import { NextResponse } from 'next/server';
import { syncDiamonds } from '@/prisma/sync-diamonds';
import { getSession } from '@/lib/session'; // Assuming you have this

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
    
    // Start the sync process asynchronously
    syncDiamonds()
      .then(result => {
        console.log(`Manual sync ${result.success ? 'completed' : 'failed'}`);
      })
      .catch(error => {
        console.error('Error during manual sync:', error);
      });
    
    // Return immediately as the sync process runs in the background
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