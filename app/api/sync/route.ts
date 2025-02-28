import {  NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Get the latest sync log
    const latestSync = await prisma.syncLog.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json({
      latestSync,
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}