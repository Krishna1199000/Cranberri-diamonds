import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Fetch the most recently created delivery challan to get its Jangad No
        const latestChallan = await prisma.deliveryChallan.findFirst({
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                jangadNo: true,
            },
        });

        // Return the Jangad No, or null if none exist
        return NextResponse.json({ lastJangadNo: latestChallan?.jangadNo || null });

    } catch (error) {
        console.error("Error fetching latest Jangad No:", error);
        return NextResponse.json({ error: 'Failed to fetch latest Jangad No' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}


