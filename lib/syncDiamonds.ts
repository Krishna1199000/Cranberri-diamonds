import prisma from '@/lib/db';


// Define a batch size for periodic updates and stop checks
const BATCH_SIZE = 10;

export async function syncDiamonds() {
  let syncLog: { id: string; status: string; createdAt: Date; message: string | null; count?: number } | null = null;
  try {
    // Create a sync log entry
    syncLog = await prisma.syncLog.create({
      data: {
        status: 'STARTED',
        message: 'Diamond sync process initializing...',
      },
    });
    console.log(`Sync started with log ID: ${syncLog.id}`);

    // Your external API endpoint
    const apiUrl = process.env.DIAMOND_API_URL;
    if (!apiUrl) {
      throw new Error('DIAMOND_API_URL is not defined in environment variables');
    }
    
    // Prepare authentication data (Consider moving to env vars)
    const authData = {
      USERNAME: 'CRANBERRI',
      PASSWORD: 'CRADIA@123'
    };
    
    await prisma.syncLog.update({ // Update status after setup
        where: { id: syncLog.id },
        data: { message: 'Fetching data from external API...' },
    });

    // Fetch diamonds from external API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authData),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch diamonds from API: ${await response.text()}`);
    }
    
    const rawData = await response.json();
    
    if (!rawData || typeof rawData !== 'object' || Object.keys(rawData).length === 0) {
      throw new Error('Invalid or empty API response');
    }
    
    // Extract diamonds array
    const diamonds = Array.isArray(rawData) ? rawData : 
                    rawData.data ? rawData.data : 
                    rawData.diamonds ? rawData.diamonds : 
                    rawData.results ? rawData.results : null;
    
    if (!diamonds || !Array.isArray(diamonds)) {
      throw new Error('API response does not contain an array of diamonds');
    }

    await prisma.syncLog.update({ // Update status before processing
        where: { id: syncLog.id },
        data: { message: `Processing ${diamonds.length} diamonds...` },
    });
    
    // Process each diamond
    let count = 0;
    let processedInBatch = 0;
    const errors: string[] = [];

    for (const diamond of diamonds) {
      // --- Check for Stop Request --- 
      if (processedInBatch >= BATCH_SIZE) {
        // Added detailed logging for status check
        console.log(`[Sync ${syncLog.id}] Checking status (processed batch: ${processedInBatch})...`);
        const currentSyncLog = await prisma.syncLog.findUnique({ 
          where: { id: syncLog.id },
          select: { status: true }
        });
        
        // Log the status found
        console.log(`[Sync ${syncLog.id}] Current DB status: ${currentSyncLog?.status}`);

        if (currentSyncLog?.status === 'STOPPING') {
          console.log(`[Sync ${syncLog.id}] Stop request detected. Cancelling.`); // Updated log
          await prisma.syncLog.update({
            where: { id: syncLog.id },
            data: {
              status: 'CANCELLED',
              message: `Sync cancelled by user after processing ${count} diamonds.`,
              count: count, // Log the count processed before stopping
            },
          });
          return { success: false, message: 'Sync cancelled by user', count }; 
        }
        // Update progress if not stopping
        console.log(`[Sync ${syncLog.id}] Status is not STOPPING. Updating progress.`); // Added log
        await prisma.syncLog.update({ 
            where: { id: syncLog.id },
            data: { count: count, message: `Processing ${count}/${diamonds.length}...` }
        });
        processedInBatch = 0; // Reset batch counter
      }
      // --- End Check for Stop Request ---

      if (!diamond.StockID) {
        console.warn('Skipping diamond without StockID:', diamond);
        continue;
      }

      try {
        // Transform the data
        const transformedDiamond = {
          stockId: diamond.StockID,
          certificateNo: diamond['Certificate No'] || '',
          shape: diamond.Shape || '',
          size: parseFloat(diamond.Size) || 0,
          color: diamond.Color || '',
          clarity: diamond.Clarity || '',
          cut: diamond.Cut || null,
          polish: diamond.Polish || '',
          sym: diamond.Sym || '',
          floro: diamond.Floro || '',
          lab: diamond.Lab || '',
          rapPrice: parseFloat(diamond.RapPrice) || 0,
          rapAmount: parseFloat(diamond.RapAmount) || 0,
          discount: parseFloat(diamond.Discount) || 0,
          pricePerCarat: parseFloat(diamond.PricePerCarat) || 0,
          finalAmount: parseFloat(diamond.FinalAmount) || 0,
          measurement: diamond.Measurement || '',
          length: parseFloat(diamond.Length) || null,
          width: parseFloat(diamond.Width) || null,
          height: parseFloat(diamond.Height) || null,
          depth: parseFloat(diamond.Depth) || null,
          table: parseFloat(diamond.Table) || null,
          ratio: parseFloat(diamond.Ratio) || null,
          status: diamond.Status || '',
          comment: diamond.Comment || null,
          videoUrl: diamond['Video URL'] || null,
          imageUrl: diamond['Image URL'] || null,
          certUrl: diamond['Cert URL'] || null,
          girdle: diamond.Girdle || null,
          culet: diamond.Culet || null,
          crownAngle: parseFloat(diamond.CAngle) || null,
          crownHeight: parseFloat(diamond.CHeight) || null,
          pavilionAngle: parseFloat(diamond.PAngle) || null,
          pavilionDepth: parseFloat(diamond.PDepth) || null,
          fancyIntensity: diamond['Fancy Intensity'] || null,
          fancyOvertone: diamond['Fancy Overtone'] || null,
          fancyColor: diamond['Fancy Color'] || null,
          location: diamond.Location || null,
          inscription: diamond.Inscription || null,
        };

        await prisma.diamond.upsert({
          where: { stockId: diamond.StockID },
          update: transformedDiamond,
          create: transformedDiamond,
        });
        count++;
        processedInBatch++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to process diamond ${diamond.StockID}: ${errorMessage}`);
        console.error(`Error processing diamond ${diamond.StockID}:`, error);
      }
    }
    
    // Final update sync log with results
    const finalStatus = errors.length > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED';
    const finalMessage = errors.length > 0 
      ? `Synced ${count} diamonds with ${errors.length} errors. See logs for details.`
      : `Successfully synced ${count} diamonds`;

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: finalStatus,
        message: finalMessage,
        count: count, // Final count
      },
    });
    console.log(`Sync finished for log ID: ${syncLog.id}. Status: ${finalStatus}, Count: ${count}`);
    return { success: true, status: finalStatus, message: finalMessage, count };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`Diamond sync failed for log ID ${syncLog?.id}:`, errorMessage);
    
    // Update sync log with error
    if (syncLog) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          message: errorMessage,
          count: 0, // Reset count on failure
        },
      });
    }
    // Return failure indication instead of throwing
    return { success: false, message: errorMessage, error: error }; 
    // throw error; // Avoid throwing to prevent unhandled rejection in the background task
  }
}