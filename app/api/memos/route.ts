import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma, InvoiceType } from '@prisma/client'; // Import InvoiceType
import { numberToWords, generateMemoNumber } from '@/lib/utils'; // Import generateMemoNumber from utils
import { getSession } from '@/lib/session';
import { memoFormSchema } from '@/lib/validators/memo';
import {
  collectInventoryStockIds,
  fetchInventoryTierMap,
  normalizeItemsToAskingPrices,
  validateInventoryTierPricing,
} from '@/lib/utils/pricing-tiers';

const prisma = new PrismaClient();



export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.userId as string | undefined;
    const userRole = session?.role as string | undefined;

    if (!userId || !userRole) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const employeeIds = searchParams.get('employeeIds')?.split(',').filter(Boolean) || [];
    const companies = searchParams.get('companies')?.split(',').filter(Boolean) || [];
    const states = searchParams.get('states')?.split(',').filter(Boolean) || [];
    const shapes = searchParams.get('shapes')?.split(',').filter(Boolean) || [];
    const colors = searchParams.get('colors')?.split(',').filter(Boolean) || [];
    const clarities = searchParams.get('clarities')?.split(',').filter(Boolean) || [];
    const labs = searchParams.get('labs')?.split(',').filter(Boolean) || [];
    const caratMin = searchParams.get('caratMin');
    const caratMax = searchParams.get('caratMax');
    const dateStart = searchParams.get('dateStart');
    const dateEnd = searchParams.get('dateEnd');
    const status = searchParams.get('status');

    const whereClause: Prisma.MemoWhereInput = {};

    // Role-based filtering
    if (userRole === 'employee') {
        whereClause.userId = userId;
    } else if (userRole === 'admin' && employeeIds.length > 0) {
        whereClause.userId = { in: employeeIds };
    }

    // Backward-compatible status behavior:
    // If schema migration isn't applied yet, we cannot query memoStatus safely.
    // `RETURNED` data is served by /api/memos/returned, so keep this endpoint focused on current memos.
    if (status === 'RETURNED') {
      return NextResponse.json({ memos: [] });
    }

    // Company filter
    if (companies.length > 0) {
        whereClause.companyName = { in: companies };
    }

    // State filter
    if (states.length > 0) {
        whereClause.state = { in: states };
    }

    // Date range filter
    if (dateStart || dateEnd) {
        whereClause.date = {};
        if (dateStart) {
            whereClause.date.gte = new Date(dateStart);
        }
        if (dateEnd) {
            const endDate = new Date(dateEnd);
            endDate.setHours(23, 59, 59, 999);
            whereClause.date.lte = endDate;
        }
    }

    // Item-based filters (shape, color, clarity, lab, carat)
    const itemFilters: Prisma.MemoItemWhereInput = {};
    if (shapes.length > 0) {
        itemFilters.shape = { in: shapes };
    }
    if (colors.length > 0) {
        itemFilters.color = { in: colors };
    }
    if (clarities.length > 0) {
        itemFilters.clarity = { in: clarities };
    }
    if (labs.length > 0) {
        itemFilters.lab = { in: labs };
    }
    if (caratMin || caratMax) {
        itemFilters.carat = {};
        if (caratMin) {
            itemFilters.carat.gte = parseFloat(caratMin);
        }
        if (caratMax) {
            itemFilters.carat.lte = parseFloat(caratMax);
        }
    }

    // If any item filters exist, add them to the where clause
    if (Object.keys(itemFilters).length > 0) {
        whereClause.items = {
            some: itemFilters
        };
    }

    const include = {
      items: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    };

    const orderBy = { memoNo: 'desc' as const };

    // Current memos tab: only ACTIVE (open) memos
    let memos;
    try {
      memos = await prisma.memo.findMany({
        where: { ...whereClause, memoStatus: 'ACTIVE' },
        orderBy,
        include,
      });
    } catch {
      const allMemos = await prisma.memo.findMany({
        where: whereClause,
        orderBy,
        include,
      });
      memos = allMemos.filter(
        (m) => (m as { memoStatus?: string }).memoStatus === 'ACTIVE' || !(m as { memoStatus?: string }).memoStatus
      );
    }

    // Add no-cache headers
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return NextResponse.json({ memos }, { headers });
  } catch (error) {
    console.error('Error fetching memos: ', String(error));
    return NextResponse.json({ error: 'Failed to fetch memos' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        const userId = session?.userId as string | undefined;
        const userRole = session?.role as string | undefined;

        if (!userId || !userRole) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();

        // Validate using the memo schema
        const validation = memoFormSchema.safeParse(body);
        if (!validation.success) {
          console.error("Memo validation failed:", JSON.stringify(validation.error.errors, null, 2));
          const errorMessage = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
          return NextResponse.json({ error: `Invalid input: ${errorMessage}`, details: validation.error.errors }, { status: 400 });
        }
        const validatedData = validation.data;

        const stockIds = collectInventoryStockIds(validatedData.items);

        if (stockIds.length > 0) {
          const inventoryByStockId = await fetchInventoryTierMap(stockIds, (args) =>
            prisma.inventoryItem.findMany(args)
          );

          const tierValidation = validateInventoryTierPricing(
            validatedData.items,
            inventoryByStockId,
            userRole
          );
          if (!tierValidation.ok) {
            return NextResponse.json(
              { error: tierValidation.error },
              { status: tierValidation.status }
            );
          }

          validatedData.items = normalizeItemsToAskingPrices(
            validatedData.items,
            inventoryByStockId
          );
        }

        // --- Transaction for fetching latest memo number and creating new one ---
        const createdMemo = await prisma.$transaction(async (tx) => {
          // 1. Fetch the selected shipment using shipmentId
          const selectedShipment = await tx.shipment.findUnique({
              where: { id: validatedData.shipmentId },
          });

          // Handle if shipment not found
          if (!selectedShipment) {
              throw new Error(`Selected company (Shipment ID: ${validatedData.shipmentId}) not found.`);
          }

          // 2. Fetch latest memo number
          const latestMemo = await tx.memo.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { memoNo: true }
          });

          // 3. Generate the new memo number using the specific logic
          const newMemoNo = generateMemoNumber(latestMemo?.memoNo, validatedData.date);

          // 4. Calculate item totals as subtotal
          let subtotal = 0;
          validatedData.items.forEach((item) => {
            const itemTotal = (Number(item.carat) || 0) * (Number(item.pricePerCarat) || 0);
            subtotal += itemTotal;
          });

          // Get the additional financial fields from validated data
          const discount = Number(validatedData.discount) || 0;
          const crPayment = Number(validatedData.crPayment) || 0;
          const shipmentCost = Number(validatedData.shipmentCost) || 0;

          // Calculate the grand total (Total Due)
          const grandTotal = Number((subtotal - discount - crPayment + shipmentCost).toFixed(2));

          // 5. Convert grand total to words
          const amountInWords = numberToWords(grandTotal);

          // 6. Create the memo record
          const memo = await tx.memo.create({
            data: {
              memoNo: newMemoNo, // Use memoNo
              type: InvoiceType.MEMO, // Set type to MEMO
              date: validatedData.date,
              paymentTerms: validatedData.paymentTerms,
              dueDate: validatedData.dueDate,
              description: validatedData.description || "",

              // Financial fields
              subtotal: Number(subtotal.toFixed(2)),
              discount: discount,
              crPayment: crPayment,
              shipmentCost: shipmentCost,
              totalAmount: grandTotal,

              amountInWords: amountInWords,

              // Address fields from shipment
              companyName: selectedShipment.companyName,
              addressLine1: selectedShipment.addressLine1,
              addressLine2: selectedShipment.addressLine2 || null,
              country: selectedShipment.country,
              state: selectedShipment.state,
              city: selectedShipment.city,
              postalCode: selectedShipment.postalCode,

              userId: userId,
              shipmentId: selectedShipment.id,

              // Create the memo items
              items: {
                create: validatedData.items.map(item => ({
                  description: item.description,
                  carat: Number(item.carat) || 0,
                  color: item.color,
                  clarity: item.clarity,
                  shape: item.shape || null,
                  lab: item.lab,
                  reportNo: item.reportNo,
                  pricePerCarat: Number(item.pricePerCarat) || 0,
                  total: Number(((Number(item.carat) || 0) * (Number(item.pricePerCarat) || 0)).toFixed(2))
                }))
              }
            },
            // Include items in the returned object
            include: {
              items: true,
            }
          });
          return memo;
        });

        return NextResponse.json({ memo: createdMemo }); // Return memo
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating memo:', errorMessage);
      if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack);
      }

      if (error instanceof Error && error.message.includes('Unique constraint failed')) {
        return NextResponse.json({ error: 'Failed to create memo: Memo number conflict.' }, { status: 409 });
      } else if (errorMessage.includes('Selected company (Shipment ID:') && errorMessage.includes('not found')) {
          return NextResponse.json({ error: errorMessage }, { status: 400 }); // Shipment not found error
      }
      return NextResponse.json({ error: `Failed to create memo: ${errorMessage}` }, { status: 500 });
    } finally {
      await prisma.$disconnect();
    }
} 