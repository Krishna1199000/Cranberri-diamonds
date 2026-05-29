import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';
import { deliveryChallanFormSchema } from '@/lib/validators/delivery-challan';
import { generateJangadNumber } from '@/lib/utils';

const prisma = new PrismaClient();

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
    // Admins can see all delivery challans

    const deliveryChallans = await prisma.deliveryChallan.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        items: {
          orderBy: {
            srNo: 'asc'
          }
        },
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    // Add no-cache headers
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return NextResponse.json({ deliveryChallans }, { headers });
  } catch (error) {
    console.error('Error fetching delivery challans: ', String(error));
    return NextResponse.json({ error: 'Failed to fetch delivery challans' }, { status: 500 });
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

        // Only admin can create delivery challans
        if (userRole !== 'admin') {
            return NextResponse.json({ error: 'Only admins can create delivery challans' }, { status: 403 });
        }

        const body = await request.json();
        const validation = deliveryChallanFormSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            );
        }

        const validatedData = validation.data;

        // Transaction for generating Jangad No and creating delivery challan
        const createdChallan = await prisma.$transaction(async (tx) => {
          // 1. Fetch latest Jangad No
          const latestChallan = await tx.deliveryChallan.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { jangadNo: true }
          });

          // 2. Generate the new Jangad No
          const newJangadNo = generateJangadNumber(latestChallan?.jangadNo);

          // 3. Calculate totals for each item
          const itemsWithTotals = validatedData.items.map((item, index) => {
            const total = (item.cts || 0) * (item.pricePerCarat || 0);
            return {
              ...item,
              srNo: index + 1,
              total: Number(total.toFixed(2)),
              pt: item.pt || null,
            };
          });

          // 4. Create the delivery challan record
          const challan = await tx.deliveryChallan.create({
            data: {
              jangadNo: newJangadNo,
              partyName: validatedData.partyName,
              date: validatedData.date,
              userId: userId,
              items: {
                create: itemsWithTotals.map(item => ({
                  srNo: item.srNo,
                  particulars: item.particulars,
                  pktNo: item.pktNo,
                  shape: item.shape,
                  colorClarity: item.colorClarity,
                  pcs: item.pcs,
                  cts: item.cts,
                  pricePerCarat: item.pricePerCarat,
                  pt: item.pt,
                  total: item.total,
                }))
              }
            },
            include: {
              items: {
                orderBy: {
                  srNo: 'asc'
                }
              },
              user: {
                select: {
                  name: true,
                  email: true,
                }
              }
            }
          });
          
          return challan;
        });

        return NextResponse.json({ deliveryChallan: createdChallan });
    } catch (error) {
        console.error('Error creating delivery challan:', error);
        return NextResponse.json(
            { error: 'Failed to create delivery challan', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}


