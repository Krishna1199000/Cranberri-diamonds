import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Fetch the most recently created memo to get its number
        const latestMemo = await prisma.memo.findFirst({
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                memoNo: true,
            },
        });

        // Return the memo number, or null if none exist
        return NextResponse.json({ lastMemoNo: latestMemo?.memoNo || null });

    } catch (error) {
        console.error("Error fetching latest memo number:", error);
        return NextResponse.json({ error: 'Failed to fetch latest memo number' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
} 