import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatDateWithSuffix(date: Date | string): string {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleString('default', { month: 'long' });
  const year = d.getFullYear();
  
  // Add ordinal suffix
  const j = day % 10,
        k = day % 100;
  const suffix = (j === 1 && k !== 11) ? 'st' : 
                 (j === 2 && k !== 12) ? 'nd' : 
                 (j === 3 && k !== 13) ? 'rd' : 'th';
  
  return `${day}${suffix} ${month} ${year}`;
}

function convertToWords(num: number): string {
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const thousands = ["", "thousand", "million", "billion"];

  if (num === 0) return "zero";

  function convertChunk(n: number): string {
    let result = "";
    
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " hundred ";
      n %= 100;
    }
    
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + " ";
      n = 0;
    }
    
    if (n > 0) {
      result += ones[n] + " ";
    }
    
    return result;
  }

  let result = "";
  let chunkIndex = 0;

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      result = convertChunk(chunk) + thousands[chunkIndex] + " " + result;
    }
    num = Math.floor(num / 1000);
    chunkIndex++;
  }

  return result.trim();
}

export function numberToWords(amount: number): string {
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);
  
  let result = convertToWords(dollars) + " dollars";
  
  if (cents > 0) {
    result += " and " + convertToWords(cents) + " cents";
  }
  
  return result.charAt(0).toUpperCase() + result.slice(1) + " only";
}

export const calculateTotal = (carat: number, pricePerCarat: number): number => {
  const total = (carat || 0) * (pricePerCarat || 0);
  return Number(total.toFixed(2));
};

// Updated invoice number generation logic
export function generateInvoiceNumber(lastInvoiceNo: string | null | undefined, invoiceDate: Date): string {
  console.log(`[generateInvoiceNumber] Received lastInvoiceNo: ${lastInvoiceNo}, invoiceDate: ${invoiceDate.toISOString()}`);

  const prefix = 'CD-';
  const datePart = format(invoiceDate, 'ddMM');
  let nextNum = 103; // Always start from 103 if no previous invoice

  if (lastInvoiceNo && lastInvoiceNo.startsWith(prefix)) {
    const parts = lastInvoiceNo.substring(prefix.length).split('/');
    console.log(`[generateInvoiceNumber] Parsed parts: ${JSON.stringify(parts)}`);

    if (parts.length > 0) {
        const numericAlphaPart = parts[0];
      if (numericAlphaPart && numericAlphaPart.length >= 5) {
        // Extract the numeric part (first 4 characters)
            const numericPart = numericAlphaPart.substring(0, 4);

        console.log(`[generateInvoiceNumber] numericPart: "${numericPart}"`);

            const lastNum = parseInt(numericPart, 10);
        console.log(`[generateInvoiceNumber] lastNum: ${lastNum}`);

        if (!isNaN(lastNum)) {
          // If the last number is less than 103, start from 103
          if (lastNum < 103) {
            nextNum = 103;
            console.log(`[generateInvoiceNumber] Last number ${lastNum} is less than 103. Starting from 103.`);
          } else {
            // Simply increment the number by 1, always use 'A'
            nextNum = lastNum + 1;
            console.log(`[generateInvoiceNumber] Incremented: nextNum=${nextNum}`);
          }
        } else {
          console.log(`[generateInvoiceNumber] Failed to parse number from "${numericPart}". Using default 103.`);
          nextNum = 103;
        }
      } else {
        console.log(`[generateInvoiceNumber] numericAlphaPart "${numericAlphaPart}" is too short. Using default 103.`);
        nextNum = 103;
        }
    } else {
      console.log(`[generateInvoiceNumber] No parts found after splitting. Using default 103.`);
      nextNum = 103;
    }
} else {
    console.log(`[generateInvoiceNumber] No valid lastInvoiceNo provided or prefix mismatch. Starting from 103.`);
    nextNum = 103;
  }

  // Always use 'A' as the letter suffix
  const nextLetter = 'A';
  const paddedNum = nextNum.toString().padStart(4, '0');
  const result = `${prefix}${paddedNum}${nextLetter}/${datePart}`;
  console.log(`[generateInvoiceNumber] Generated result: ${result}`);
  return result;
}

// Generate memo number
export function generateMemoNumber(lastMemoNo: string | null | undefined, memoDate: Date): string {
  const prefix = 'CDM-';
  const datePart = format(memoDate, 'ddMM');
  let nextNum = 10; // Start at 10 so next memo will be CDM-0010A

  if (lastMemoNo && lastMemoNo.startsWith(prefix)) {
    const parts = lastMemoNo.substring(prefix.length).split('/');
    if (parts.length > 0) {
      const numericAlphaPart = parts[0];
      if (numericAlphaPart && numericAlphaPart.length > 1) {
        const numericPart = numericAlphaPart.substring(0, 4);
        const lastNum = parseInt(numericPart, 10);

        if (!isNaN(lastNum)) {
          // Simply increment the number by 1, always use 'A'
          nextNum = lastNum + 1;
        } else {
          nextNum = 10; // Default fallback
        }
      }
    }
  }

  // Always use 'A' as the letter suffix (like invoice numbers)
  const nextLetter = 'A';
  const paddedNum = nextNum.toString().padStart(4, '0');
  return `${prefix}${paddedNum}${nextLetter}/${datePart}`;
}

export function extractTokenFromCookies(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);

  return cookies.token || null;
}

