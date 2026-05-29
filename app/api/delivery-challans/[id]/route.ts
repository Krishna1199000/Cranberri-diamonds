import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getSession();
        const userId = session?.userId as string | undefined;
        const userRole = session?.role as string | undefined;

        if (!userId || !userRole) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const challan = await prisma.deliveryChallan.findUnique({
            where: { id: resolvedParams.id },
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

        if (!challan) {
            return NextResponse.json(
                { error: 'Delivery challan not found' },
                { status: 404 }
            );
        }

        // Employees can only view their own challans
        if (userRole === 'employee' && challan.userId !== userId) {
            return NextResponse.json(
                { error: 'Unauthorized to view this delivery challan' },
                { status: 403 }
            );
        }

        return NextResponse.json({ deliveryChallan: challan });
    } catch (error) {
        console.error(`Error fetching delivery challan:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch delivery challan' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}


