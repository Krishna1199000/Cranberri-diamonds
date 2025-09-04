

export async function getUSDToINRRate(): Promise<number> {
  try {
    // Use exchangerate.host API with access key for real-time rates
    const accessKey = process.env.USD_ACCESS_KEY;
    
    if (!accessKey) {
      console.log('USD_ACCESS_KEY not found in environment, using fallback APIs');
      return await getFallbackRate();
    }

    console.log('Fetching exchange rate from exchangerate.host with access key');
    
    const response = await fetch(`https://api.exchangerate.host/live?access_key=${accessKey}&source=USD&currencies=INR&format=1`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      next: { revalidate: 0 } // Disable Next.js caching
    });

    if (response.ok) {
      const data = await response.json();
      console.log('exchangerate.host API response:', data);
      
      if (data.success && data.quotes && data.quotes.USDINR) {
        const rate = data.quotes.USDINR;
        console.log(`Successfully fetched USD to INR rate: ${rate} from exchangerate.host`);
        return rate;
      } else if (data.rates && data.rates.INR) {
        const rate = data.rates.INR;
        console.log(`Successfully fetched USD to INR rate: ${rate} from exchangerate.host (alternative format)`);
        return rate;
      } else {
        console.log('exchangerate.host response format not recognized:', data);
      }
    } else {
      console.log(`exchangerate.host API returned status: ${response.status}`);
    }

    // Fallback to exchangerate.host without access key (free tier)
    console.log('Trying exchangerate.host free tier as fallback');
    const freeResponse = await fetch('https://api.exchangerate.host/live?source=USD&currencies=INR&format=1', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (freeResponse.ok) {
      const freeData = await freeResponse.json();
      console.log('exchangerate.host free tier response:', freeData);
      
      if (freeData.success && freeData.quotes && freeData.quotes.USDINR) {
        const rate = freeData.quotes.USDINR;
        console.log(`Free tier returned rate: ${rate}`);
        return rate;
      } else if (freeData.rates && freeData.rates.INR) {
        const rate = freeData.rates.INR;
        console.log(`Free tier returned rate: ${rate} (alternative format)`);
        return rate;
      }
    }

    // If exchangerate.host fails, try other APIs
    return await getFallbackRate();
  } catch (error) {
    console.error('exchangerate.host API failed:', error);
    return await getFallbackRate();
  }
}

async function getFallbackRate(): Promise<number> {
  try {
    // Try multiple exchange rate APIs for better reliability
    const apis = [
      'https://api.exchangerate-api.com/v4/latest/USD',
      'https://open.er-api.com/v6/latest/USD',
      'https://api.frankfurter.app/latest?from=USD&to=INR'
    ];

    for (const apiUrl of apis) {
      try {
        console.log(`Fetching exchange rate from fallback API: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          next: { revalidate: 0 }
        });

        if (!response.ok) {
          console.log(`Fallback API ${apiUrl} returned status: ${response.status}`);
          continue;
        }

        const data = await response.json();
        let rate: number | null = null;

        // Parse different API response formats
        if (data.rates && data.rates.INR) {
          rate = data.rates.INR;
        } else if (data.INR) {
          rate = data.INR;
        }

        if (rate && rate > 0) {
          console.log(`Fallback API returned rate: ${rate} from ${apiUrl}`);
          return rate;
        }
      } catch (apiError) {
        console.log(`Failed to fetch from fallback API ${apiUrl}:`, apiError);
        continue;
      }
    }

    // Return current market rate as final fallback
    console.log('All exchange rate APIs failed, using current market rate: 88.20');
    return 88.20;
  } catch (error) {
    console.error('All fallback APIs failed:', error);
    return 88.20;
  }
}

// Alternative function that forces refresh from exchangerate.host
export async function getFreshUSDToINRRate(): Promise<number> {
  try {
    const accessKey = process.env.USD_ACCESS_KEY;
    const timestamp = Date.now();
    
    if (accessKey) {
      const response = await fetch(`https://api.exchangerate.host/live?access_key=${accessKey}&source=USD&currencies=INR&format=1&v=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fresh exchangerate.host API response:', data);
        
        if (data.success && data.quotes && data.quotes.USDINR) {
          const rate = data.quotes.USDINR;
          console.log(`Fresh API call returned rate: ${rate}`);
          return rate;
        } else if (data.rates && data.rates.INR) {
          const rate = data.rates.INR;
          console.log(`Fresh API call returned rate: ${rate} (alternative format)`);
          return rate;
        }
      }
    }

    // If access key method fails, try without access key
    const timestamp2 = Date.now();
    const freeResponse = await fetch(`https://api.exchangerate.host/live?source=USD&currencies=INR&format=1&v=${timestamp2}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (freeResponse.ok) {
      const freeData = await freeResponse.json();
      console.log('Fresh free tier response:', freeData);
      
      if (freeData.success && freeData.quotes && freeData.quotes.USDINR) {
        const rate = freeData.quotes.USDINR;
        console.log(`Fresh free tier returned rate: ${rate}`);
        return rate;
      } else if (freeData.rates && freeData.rates.INR) {
        const rate = freeData.rates.INR;
        console.log(`Fresh free tier returned rate: ${rate} (alternative format)`);
        return rate;
      }
    }

    // Fallback to main function
    return getUSDToINRRate();
  } catch (error) {
    console.error('Fresh exchange rate fetch failed:', error);
    return getUSDToINRRate();
  }
}
