import prisma from '@/lib/db';
import { SyncStatus } from '@prisma/client';
import { logger, criticalLogger } from './logger';

// Define a batch size for periodic updates and stop checks
const BATCH_SIZE = 10;

export async function syncDiamonds() {
  let syncLog: { id: string; status: SyncStatus; createdAt: Date; message: string | null; count?: number } | null = null;
  try {
    // Create a sync log entry
    syncLog = await prisma.syncLog.create({
      data: {
        status: SyncStatus.STARTED,
        message: 'Diamond sync process initializing...',
      },
    });
    logger.log(`Sync started with log ID: ${syncLog.id}`);

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
    let response: Response;
    try {
      logger.log(`[Sync ${syncLog.id}] Attempting to fetch from API: ${apiUrl}`);
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authData),
      });
      logger.log(`[Sync ${syncLog.id}] API fetch completed with status: ${response.status}`);
    } catch (fetchError) {
      criticalLogger.error(`[Sync ${syncLog.id}] Error during fetch call:`, fetchError);
      throw new Error(`Network error during fetch: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
    }

    if (!response.ok) {
      let errorBody = 'unknown error';
      try {
        errorBody = await response.text();
        logger.log(`[Sync ${syncLog.id}] API fetch failed. Response body: ${errorBody}`);
      } catch (textError) {
        criticalLogger.error(`[Sync ${syncLog.id}] Error reading error response body:`, textError);
      }
      throw new Error(`Failed to fetch diamonds from API (Status: ${response.status}): ${errorBody}`);
    }
    
    let rawData: unknown;
    try {
      rawData = await response.json();
      logger.log(`[Sync ${syncLog.id}] API response parsed successfully.`);
    } catch (jsonError) {
      criticalLogger.error(`[Sync ${syncLog.id}] Error parsing API response JSON:`, jsonError);
      // Optionally, try to log the raw text body if JSON parsing fails
      try {
         const textBody = await response.text(); 
         criticalLogger.error(`[Sync ${syncLog.id}] Raw response body (failed JSON parse): ${textBody}`);
      } catch {}
      throw new Error(`Failed to parse API response JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
    }
    
    if (
      !rawData ||
      typeof rawData !== 'object' ||
      (Array.isArray(rawData) ? rawData.length === 0 : Object.keys(rawData).length === 0)
    ) {
      throw new Error('Invalid or empty API response');
    }
    
    // Extract diamonds array with type guard and better debugging
    let diamonds: unknown = null;
    
    // Log the structure of the response for debugging
    logger.log(`[Sync ${syncLog.id}] Raw response type:`, typeof rawData);
    logger.log(`[Sync ${syncLog.id}] Raw response keys:`, Array.isArray(rawData) ? 'Array' : Object.keys(rawData as object));
    
    if (Array.isArray(rawData)) {
      diamonds = rawData;
      logger.log(`[Sync ${syncLog.id}] Found diamonds in root array`);
    } else if (rawData && typeof rawData === 'object') {
      const obj = rawData as Record<string, unknown>;
      
      // Check all possible keys where diamonds might be stored
      const possibleKeys = ['data', 'diamonds', 'results', 'items', 'records', 'content'];
      
      for (const key of possibleKeys) {
        if (key in obj && Array.isArray(obj[key])) {
          diamonds = obj[key];
          logger.log(`[Sync ${syncLog.id}] Found diamonds in key: ${key}`);
          break;
        }
      }
      
      // If no standard keys found, check if the object itself contains diamond-like data
      if (!diamonds && obj.StockID) {
        // Single diamond object
        diamonds = [obj];
        logger.log(`[Sync ${syncLog.id}] Found single diamond object`);
      } else if (!diamonds && Array.isArray(obj)) {
        // Array of objects
        diamonds = obj;
        logger.log(`[Sync ${syncLog.id}] Found array of objects`);
      }
    }

    if (!diamonds || !Array.isArray(diamonds)) {
      // Log the actual response structure for debugging
      criticalLogger.error(`[Sync ${syncLog.id}] Failed to extract diamonds. Response structure:`, JSON.stringify(rawData, null, 2));
      
      // Try to provide a more helpful error message
      if (rawData && typeof rawData === 'object') {
        const obj = rawData as Record<string, unknown>;
        const availableKeys = Object.keys(obj);
        criticalLogger.error(`[Sync ${syncLog.id}] Available keys in response:`, availableKeys);
        
        // Check if there's a message or error field
        if (obj.message) {
          throw new Error(`API Error: ${obj.message}`);
        } else if (obj.error) {
          throw new Error(`API Error: ${obj.error}`);
        } else if (obj.status) {
          throw new Error(`API returned status: ${obj.status}`);
        }
      }
      
      throw new Error('API response does not contain an array of diamonds. Please check the API response format.');
    }

    logger.log(`[Sync ${syncLog.id}] Diamonds array extracted. Length: ${diamonds.length}`); // Log length
    logger.log(`[Sync ${syncLog.id}] Attempting to update log before processing. ID: ${syncLog?.id}`); // Log before update

    await prisma.syncLog.update({ // Update status before processing
        where: { id: syncLog.id },
        data: { message: `Processing ${diamonds.length} diamonds...` },
    });

    logger.log(`[Sync ${syncLog.id}] Successfully updated log message before processing.`); // Log after update
    
    // Process each diamond
    let count = 0;
    let processedInBatch = 0;
    const errors: string[] = [];

    for (const diamond of diamonds) {
      // --- Check for Stop Request --- 
      if (processedInBatch >= BATCH_SIZE) {
        // Added detailed logging for status check
        logger.log(`[Sync ${syncLog.id}] Checking status (processed batch: ${processedInBatch})...`);
        const currentSyncLog = await prisma.syncLog.findUnique({ 
          where: { id: syncLog.id },
          select: { status: true }
        });
        
        // Log the status found
        logger.log(`[Sync ${syncLog.id}] Current DB status: ${currentSyncLog?.status}`);

        if (currentSyncLog?.status === SyncStatus.STOPPING) {
          logger.log(`[Sync ${syncLog.id}] Stop request detected. Cancelling.`); // Updated log
          await prisma.syncLog.update({
            where: { id: syncLog.id },
            data: {
              status: SyncStatus.CANCELLED,
              message: `Sync cancelled by user after processing ${count} diamonds.`,
              count: count, // Log the count processed before stopping
            },
          });
          return { success: false, message: 'Sync cancelled by user', count }; 
        }
        // Update progress if not stopping
        logger.log(`[Sync ${syncLog.id}] Status is not STOPPING. Updating progress.`); // Added log
        await prisma.syncLog.update({ 
            where: { id: syncLog.id },
            data: { count: count, message: `Processing ${count}/${diamonds.length}...` }
        });
        processedInBatch = 0; // Reset batch counter
      }
      // --- End Check for Stop Request ---

      if (!diamond.StockID) {
        logger.warn('Skipping diamond without StockID:', diamond);
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
          cAngle: parseFloat(diamond.CAngle) || null,
          cHeight: parseFloat(diamond.CHeight) || null,
          pAngle: parseFloat(diamond.PAngle) || null,
          pDepth: parseFloat(diamond.PDepth) || null,
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
        // Log the error safely before trying to access properties
        criticalLogger.error('[Sync] Caught error during diamond processing. Raw error:', String(error)); 
        // Log diamond details if possible
        try {
            criticalLogger.error(`[Sync] Error occurred while processing diamond with StockID: ${diamond?.StockID || 'UNKNOWN'}. Diamond data:`, JSON.stringify(diamond));
        } catch {
            criticalLogger.error('[Sync] Could not stringify the diamond object causing the error.');
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during processing';
        errors.push(`Failed to process diamond ${diamond?.StockID || 'UNKNOWN'}: ${errorMessage}`);
        // console.error(`Error processing diamond ${diamond.StockID}:`, error); // Original failing line - commented out
      }
    }
    
    // Final update sync log with results
    const finalStatus = errors.length > 0 ? SyncStatus.COMPLETED_WITH_ERRORS : SyncStatus.COMPLETED;
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
    logger.log(`Sync finished for log ID: ${syncLog.id}. Status: ${finalStatus}, Count: ${count}`);
    return { success: true, status: finalStatus, message: finalMessage, count };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    criticalLogger.error(`Diamond sync failed for log ID ${syncLog?.id}:`, errorMessage);
    criticalLogger.error(`[Sync ${syncLog?.id}] Original error trace:`, error); // Log the full error object
    
    // Update sync log with error
    if (syncLog) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: SyncStatus.FAILED,
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