import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, InvoiceType } from '@prisma/client'; // Import InvoiceType
import { numberToWords } from '@/lib/utils'; // Keep generateInvoiceNumber, we'll adapt its use
import { getSession } from '@/lib/session';
import { invoiceFormSchema } from '@/lib/validators/invoice'; // Reuse invoice schema for now, rename/copy later if needed

const prisma = new PrismaClient();

// Function to generate Memo Number (Updated Format: CDM-XXXA/DDMM)
function generateMemoNumber(lastMemoNo: string | null | undefined, date: Date): string {
    const prefix = "CDM-";
    const today = date;
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const dateSuffix = `${day}${month}`;
    const sequencePartRegex = /CDM-(\d+)A\/(\d{4})/; // Regex to extract sequence and date part

    let nextSeq = 5; // Default starting sequence is now 5

    if (lastMemoNo) {
        const match = lastMemoNo.match(sequencePartRegex);
        if (match) {
            const lastDatePart = match[2];
            const lastSeq = parseInt(match[1], 10);

            // If the date part matches today's date, increment the sequence
            if (lastDatePart === dateSuffix && !isNaN(lastSeq)) {
                nextSeq = lastSeq + 1;
            }
            // Otherwise (different day), sequence resets to 5 (already default)
        }
        // If format doesn't match, sequence resets to 5 (already default)
    }

    // Pad sequence to 3 digits
    const sequenceStr = String(nextSeq).padStart(3, '0');

    return `${prefix}${sequenceStr}A/${dateSuffix}`;
}

export async function GET() {
  try {
    const session = await getSession();
    const userId = session?.userId as string | undefined;
    const userRole = session?.role as string | undefined;

    if (!userId || !userRole) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let whereClause = {};

    if (userRole === 'employee') {
        whereClause = { userId: userId };
    }
    // Admins (or other roles) will have an empty whereClause, fetching all memos.

    const memos = await prisma.memo.findMany({
      where: whereClause, // Apply the filter conditionally
      orderBy: {
        memoNo: 'desc' // Order by memoNo
      },
      include: {
        items: true // Keep including items
      }
    });

    // Add no-cache headers
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return NextResponse.json({ memos }, { headers }); // Return memos
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

        // Validate using the invoice schema for now
        const validation = invoiceFormSchema.safeParse(body);
        if (!validation.success) {
          console.error("Memo validation failed:", JSON.stringify(validation.error.errors, null, 2));
          const errorMessage = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
          return NextResponse.json({ error: `Invalid input: ${errorMessage}`, details: validation.error.errors }, { status: 400 });
        }
        const validatedData = validation.data;

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