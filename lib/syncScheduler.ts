import cron, { ScheduledTask } from 'node-cron';
import { syncDiamonds } from '../prisma/sync-diamonds';

let syncTask: ScheduledTask | null = null;
let isInitialized = false;

export function initializeSyncScheduler() {
  if (isInitialized) return;
  
  // Run a sync on startup
  console.log('Performing initial diamond sync on server start...');
  syncDiamonds()
    .then(result => {
      if (result.success) {
        console.log(`Initial diamond sync completed successfully. Synced ${result.count} diamonds.`);
      } else {
        console.error(`Initial diamond sync failed: ${result.error}`);
      }
    })
    .catch(error => {
      console.error('Error during initial sync:', error);
    });
  
  // Schedule syncs to run every 4 hours
  // Cron syntax: minute hour day-of-month month day-of-week
  // This will run at 0:00, 4:00, 8:00, 12:00, 16:00, 20:00
  syncTask = cron.schedule('0 */4 * * *', async () => {
    console.log(`Running scheduled diamond sync at ${new Date().toISOString()}`);
    try {
      const result = await syncDiamonds();
      if (result.success) {
        console.log(`Scheduled diamond sync completed successfully. Synced ${result.count} diamonds.`);
      } else {
        console.error(`Scheduled diamond sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error during scheduled sync:', error);
    }
  });
  
  isInitialized = true;
  console.log('Diamond sync scheduler initialized. Next sync will be in 4 hours.');
}

export function stopSyncScheduler() {
  if (syncTask) {
    syncTask.stop();
    isInitialized = false;
    console.log('Diamond sync scheduler stopped.');
  }
}