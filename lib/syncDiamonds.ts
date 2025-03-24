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
      throw new Error(`Failed to fetch diamonds from API: ${await response.text()}`);
    }
    
    const rawData = await response.json();
    
    if (!rawData || typeof rawData !== 'object' || Object.keys(rawData).length === 0) {
      throw new Error('Invalid or empty API response');
    }
    

    // Extract diamonds array from response
    const diamonds = Array.isArray(rawData) ? rawData : 
                    rawData.data ? rawData.data : 
                    rawData.diamonds ? rawData.diamonds : 
                    rawData.results ? rawData.results : null;
    
    if (!diamonds || !Array.isArray(diamonds)) {
      throw new Error('API response does not contain an array of diamonds');
    }
    
    // Process each diamond
    let count = 0;
    const errors: string[] = [];

    for (const diamond of diamonds) {
      if (!diamond.StockID) {
        console.warn('Skipping diamond without StockID:', diamond);
        continue;
      }

      try {
        // Transform the data to match your database schema
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
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to process diamond ${diamond.StockID}: ${errorMessage}`);
      }
    }
    
    // Update sync log with results
    const message = errors.length > 0 
      ? `Synced ${count} diamonds with ${errors.length} errors: ${errors.join('; ')}`
      : `Successfully synced ${count} diamonds`;

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: errors.length > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
        message,
        count,
      },
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Diamond sync failed:', errorMessage);
    
    // Update sync log with error
    if (syncLog) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          message: errorMessage,
        },
      });
    }
    
    throw error;
  }
}