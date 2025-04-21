import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { syncDiamonds } from '@/prisma/sync-diamonds';
import { initializeSyncScheduler } from '@/lib/syncScheduler';
import { getSession } from '@/lib/session'; // Assuming you have a session handling mechanism

// Initialize the scheduler when the server starts
// This will only be executed once when the module is first loaded
if (process.env.NODE_ENV !== 'development') {
  // Only run the scheduler in production to prevent multiple instances in dev
  initializeSyncScheduler();
}

export async function GET() {
  try {
    // Get the latest sync log and diamond count
    const latestSync = await prisma.syncLog.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    
    const diamondCount = await prisma.diamond.count();
    
    return NextResponse.json({
      latestSync: latestSync || { 
        status: 'UNKNOWN', 
        message: 'No sync history found',
        count: 0,
        createdAt: new Date().toISOString()
      },
      stats: {
        totalDiamonds: diamondCount,
      },
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch sync status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Add a POST endpoint to manually trigger a sync (admin only)
export async function POST() {
  try {
    // Verify admin session
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Start the sync process
    syncDiamonds()
      .then(result => {
        console.log(`Manual sync ${result.success ? 'completed' : 'failed'}`);
      })
      .catch(error => {
        console.error('Error during manual sync:', error);
      });
    
    return NextResponse.json({
      message: 'Sync process started',
      started: true,
    });
  } catch (error) {
    console.error('Error starting sync process:', error);
    return NextResponse.json(
      { error: 'Failed to start sync process' },
      { status: 500 }
    );
  }
}