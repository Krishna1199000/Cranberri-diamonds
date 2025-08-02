let isSchedulerInitialized = false;

export function initializeSyncScheduler() {
  // Disable automatic sync - sync will now be manual only
  if (isSchedulerInitialized) {
    console.log('Sync scheduler initialization skipped - manual sync only.');
    return;
  }
  isSchedulerInitialized = true;

  console.log('Sync scheduler disabled - diamonds will sync only when manually triggered.');

  // Automatic sync is now disabled
  // Users must click "Sync Now" button to trigger diamond sync
  
  console.log('Diamond sync is now manual only. Use the Sync Now button to sync diamonds.');
} 