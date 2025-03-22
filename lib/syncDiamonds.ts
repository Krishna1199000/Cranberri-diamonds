import prisma from '@/lib/db';

export async function syncDiamonds() {
  let syncLog: { id: string; status: string; createdAt: Date; message: string | null; count?: number } | null = null;
  try {
    // Create a sync log entry
    syncLog = await prisma.syncLog.create({
      data: {
        status: 'STARTED',
        message: 'Diamond sync process started',
      },
    });

    // Your external API endpoint
    const apiUrl = process.env.DIAMOND_API_URL;
    if (!apiUrl) {
      throw new Error('DIAMOND_API_URL is not defined in environment variables');
    }
    
    // Prepare authentication data
    const authData = {
      USERNAME: 'CRANBERRI',
      PASSWORD: 'CRADIA@123'
    };
    
    // Fetch diamonds from external API with authentication
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch diamonds from API: ${errorText}`);
    }
    
    const diamonds = await response.json();
    
    // Process each diamond
    let count = 0;
    for (const diamond of diamonds) {
      await prisma.diamond.upsert({
        where: { stockId: diamond.stockId },
        update: diamond,
        create: diamond,
      });
      count++;
    }
    
    // Update sync log with success
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'COMPLETED',
        message: `Successfully synced ${count} diamonds`,
        count,
      },
    });
    
  } catch (error) {
    console.error('Diamond sync failed:', error);
    
    // Update sync log with error
    if (syncLog) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          message: error instanceof Error ? error.message : 'An unknown error occurred',
        },
      });
    }
    
    throw error;
  }
}