import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { syncDiamonds } from '@/lib/syncDiamonds';

// Initialize sync on server start
let syncInitialized = false;

async function initializeSync() {
  if (syncInitialized) return;
  
  try {
    console.log('Starting initial diamond sync...');
    await syncDiamonds();
    console.log('Initial diamond sync completed successfully');
  } catch (error) {
    console.error('Initial diamond sync failed:', error);
  }

  // Set up recurring sync every 2 hours
  setInterval(async () => {
    try {
      console.log('Starting scheduled diamond sync...');
      await syncDiamonds();
      console.log('Scheduled diamond sync completed successfully');
    } catch (error) {
      console.error('Scheduled diamond sync failed:', error);
    }
  }, 2 * 60 * 60 * 1000); // 2 hours in milliseconds

  syncInitialized = true;
}

// Initialize sync when the route module is loaded
initializeSync();

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