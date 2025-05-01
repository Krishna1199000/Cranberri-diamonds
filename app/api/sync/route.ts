import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { syncDiamonds } from '@/lib/syncDiamonds';
import { getSession } from '@/lib/session'; // Assuming you have a session handling mechanism
import { SyncStatus } from '@prisma/client'; // Import the enum
import { initializeSyncScheduler } from '@/lib/scheduler'; // Import the initializer

// Initialize scheduler only once in production/staging environments
if (process.env.NODE_ENV !== 'development') {
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
        id: '', // Add default id
        status: SyncStatus.UNKNOWN, // Use enum
        message: 'No sync history found',
        count: 0,
        createdAt: new Date() // Use Date object
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
  console.log("Received POST request to /api/sync"); // Added logging
  try {
    // Verify admin session
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      console.warn("Unauthorized sync attempt: No admin session found."); // Added logging
      return NextResponse.json(
        { error: 'Unauthorized: Admin role required.' },
        { status: 401 }
      );
    }
    
    console.log("Admin session verified. Starting sync process..."); // Added logging
    
    // Check if a sync is already running
    const runningSync = await prisma.syncLog.findFirst({
      where: { status: SyncStatus.STARTED }, // Use enum
    });

    if (runningSync) {
      console.log("Sync already in progress."); // Added logging
      return NextResponse.json(
        { message: 'Sync process is already running', started: false },
        { status: 409 } // 409 Conflict is appropriate here
      );
    }

    // Start the sync process (no await - run in background)
    syncDiamonds()
      .then(() => {
        // Logging is handled within syncDiamonds now for completion/failure
        console.log(`Background sync process finished.`);
      })
      .catch(error => {
        // This catch might be redundant if syncDiamonds handles its own errors, but good for safety
        console.error('Error in background sync process:', error);
      });
    
    console.log("Sync process initiated in background."); // Added logging
    return NextResponse.json({
      message: 'Sync process started',
      started: true,
    });
  } catch (error) {
    console.error('Error starting sync process:', error);
    return NextResponse.json(
      { error: 'Failed to start sync process', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Add a DELETE endpoint to stop a running sync
export async function DELETE() {
  console.log("Received DELETE request to /api/sync"); // Added logging
  try {
    // Verify admin session (optional, but recommended for consistency)
    const session = await getSession();
    if (!session || session.role !== 'admin') {
       console.warn("Unauthorized stop sync attempt: No admin session found."); // Added logging
      return NextResponse.json(
        { error: 'Unauthorized: Admin role required.' },
        { status: 401 }
      );
    }

    // Find the sync log entry with status 'STARTED'
    console.log("Finding sync log entry with status 'STARTED'..."); // Added logging
    const runningSync = await prisma.syncLog.findFirst({
      where: { status: SyncStatus.STARTED }, // Use enum
    });

    if (!runningSync) {
      console.log("No sync process currently running to stop."); // Added logging
      return NextResponse.json(
        { message: 'No sync process is currently running' },
        { status: 404 } // Not Found
      );
    }

    // Update the status to 'STOPPING'
    await prisma.syncLog.update({
      where: { id: runningSync.id },
      data: { status: SyncStatus.STOPPING, message: 'Stop request received by user.' }, // Use enum
    });

    console.log(`Sync process ${runningSync.id} marked as STOPPING.`); // Added logging
    return NextResponse.json({ message: 'Sync stop request initiated' });

  } catch (error) {
    console.error('Error stopping sync process:', error);
    return NextResponse.json(
      { error: 'Failed to stop sync process', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}