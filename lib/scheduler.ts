import cron from 'node-cron';
import prisma from '@/lib/db';
import { syncDiamonds } from '@/lib/syncDiamonds';
import { SyncStatus } from '@prisma/client';

let isSchedulerInitialized = false;

export function initializeSyncScheduler() {
  // Prevent multiple initializations in the same process
  if (isSchedulerInitialized) {
    console.log('Sync scheduler already initialized.');
    return;
  }
  isSchedulerInitialized = true;

  console.log('Initializing diamond sync scheduler...');

  // Schedule to run every 4 hours (at minute 0)
  // Syntax: minute hour day-of-month month day-of-week
  // '0 */4 * * *' means at minute 0 past every 4th hour.
  cron.schedule('0 */4 * * *', async () => {
    console.log('[Scheduler] Running scheduled diamond sync...');
    
    try {
      // Check if a sync is already running to prevent overlap
      const runningSync = await prisma.syncLog.findFirst({
        where: { status: SyncStatus.STARTED },
      });

      if (runningSync) {
        console.log('[Scheduler] Sync already in progress. Skipping scheduled run.');
        return;
      }

      console.log('[Scheduler] Starting syncDiamonds process...');
      const result = await syncDiamonds();
      console.log(`[Scheduler] Scheduled sync finished. Success: ${result.success}, Status: ${result.status}, Message: ${result.message}`);

    } catch (error) {
        // This catch is for errors *checking* the running sync or *uncaught* errors from syncDiamonds 
        // (though syncDiamonds is designed to return results, not throw)
      console.error('[Scheduler] Error during scheduled sync execution:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC" // Or your preferred timezone, e.g., "America/New_York"
  });

  console.log('Diamond sync scheduler initialized to run every 4 hours.');
} 