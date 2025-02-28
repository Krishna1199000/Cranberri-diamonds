// Script to sync diamonds from API to database
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fetchDiamondsFromAPI() {
  try {
    console.log('Fetching diamonds from API...');
    const response = await fetch("https://kyrahapi.azurewebsites.net/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        USERNAME: "CRANBERRI",
        PASSWORD: "CRADIA@123",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "Failed to fetch diamonds");
    }

    if (!Array.isArray(result.data)) {
      throw new Error("Invalid data format received from server");
    }

    console.log(`Fetched ${result.data.length} diamonds from API`);
    return result.data;
  } catch (error) {
    console.error("Error fetching diamonds:", error);
    throw error;
  }
}

function mapApiDiamondToDbDiamond(apiDiamond) {
  return {
    stockId: apiDiamond.StockID,
    certificateNo: apiDiamond["Certificate No"] || apiDiamond.Certificate_No || '',
    shape: apiDiamond.Shape || '',
    size: parseFloat(apiDiamond.Size) || 0,
    color: apiDiamond.Color || '',
    clarity: apiDiamond.Clarity || '',
    cut: apiDiamond.Cut || '',
    polish: apiDiamond.Polish || '',
    sym: apiDiamond.Sym || '',
    floro: apiDiamond.Floro || '',
    lab: apiDiamond.Lab || '',
    rapPrice: parseFloat(apiDiamond.RapPrice) || 0,
    rapAmount: parseFloat(apiDiamond.RapAmount) || 0,
    discount: parseFloat(apiDiamond.Discount) || 0,
    pricePerCarat: parseFloat(apiDiamond.PricePerCarat) || 0,
    finalAmount: parseFloat(apiDiamond.FinalAmount) || 0,
    measurement: apiDiamond.Measurement || '',
    length: parseFloat(apiDiamond.Length) || null,
    width: parseFloat(apiDiamond.Width) || null,
    height: parseFloat(apiDiamond.Height) || null,
    depth: parseFloat(apiDiamond.Depth) || null,
    table: parseFloat(apiDiamond.Table) || null,
    ratio: parseFloat(apiDiamond.Ratio) || null,
    status: apiDiamond.Status || '',
    comment: apiDiamond.Comment || '',
    videoUrl: apiDiamond["Video URL"] || apiDiamond.Video_URL || null,
    imageUrl: apiDiamond["Image URL"] || apiDiamond.Image_URL || null,
    certUrl: apiDiamond["Cert URL"] || apiDiamond.Cert_URL || null,
    girdle: apiDiamond.Girdle || null,
    culet: apiDiamond.Culet || null,
    cAngle: parseFloat(apiDiamond.CAngle) || null,
    cHeight: parseFloat(apiDiamond.CHeight) || null,
    pAngle: parseFloat(apiDiamond.PAngle) || null,
    pDepth: parseFloat(apiDiamond.PDepth) || null,
    fancyIntensity: apiDiamond["Fancy Intensity"] || null,
    fancyOvertone: apiDiamond["Fancy Overtone"] || null,
    fancyColor: apiDiamond["Fancy Color"] || null,
    location: apiDiamond.Location || null,
    inscription: apiDiamond.Inscription || null,
  };
}

async function syncDiamonds() {
  let syncLog;
  try {
    // Create a sync log entry
    syncLog = await prisma.syncLog.create({
      data: {
        status: 'STARTED',
        message: 'Starting diamond sync',
      },
    });

    // Fetch diamonds from API
    const apiDiamonds = await fetchDiamondsFromAPI();
    
    // Process diamonds in batches to avoid memory issues
    const batchSize = 100;
    let processedCount = 0;
    
    for (let i = 0; i < apiDiamonds.length; i += batchSize) {
      const batch = apiDiamonds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (apiDiamond) => {
          const dbDiamond = mapApiDiamondToDbDiamond(apiDiamond);
          
          // Upsert diamond (update if exists, create if not)
          await prisma.diamond.upsert({
            where: { stockId: dbDiamond.stockId },
            update: dbDiamond,
            create: dbDiamond,
          });
          
          processedCount++;
        })
      );
      
      console.log(`Processed ${processedCount} of ${apiDiamonds.length} diamonds`);
      
      // Update sync log with progress
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          message: `Processed ${processedCount} of ${apiDiamonds.length} diamonds`,
          count: processedCount,
        },
      });
    }
    
    // Update sync log with completion status
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'COMPLETED',
        message: `Successfully synced ${processedCount} diamonds`,
        count: processedCount,
      },
    });
    
    console.log(`Diamond sync completed. Synced ${processedCount} diamonds.`);
  } catch (error) {
    console.error('Error syncing diamonds:', error);
    
    // Update sync log with error status
    if (syncLog) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          message: `Error: ${error.message}`,
        },
      });
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncDiamonds();