import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  // Format without currency symbol, will be added in PDF/UI manually
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// New date formatter
export function formatDateWithSuffix(date: Date): string {
  const day = format(date, 'd');
  const month = format(date, 'MMM');
  const year = format(date, 'yyyy');

  let suffix = 'th';
  if (day === '1' || day === '21' || day === '31') {
    suffix = 'st';
  } else if (day === '2' || day === '22') {
    suffix = 'nd';
  } else if (day === '3' || day === '23') {
    suffix = 'rd';
  }

  return `${day}${suffix} ${month}' ${year}`;
}

export function calculateTotal(carat: number, pricePerCarat: number): number {
  return carat * pricePerCarat;
}

// Modified numberToWords function for the specific format
export function numberToWords(num: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n: number): string => {
    if (n === 0) return '';
    let words = '';
    if (n >= 100) {
      words += units[Math.floor(n / 100)] + ' Hundred';
      n %= 100;
      if (n > 0) words += ' ';
    }
    if (n >= 10 && n < 20) {
      words += teens[n - 10];
    } else if (n >= 20) {
      words += tens[Math.floor(n / 10)];
      n %= 10;
      if (n > 0) words += ' ' + units[n];
    } else if (n > 0) {
      words += units[n];
    }
    return words;
  };

  const convert = (n: number): string => {
    if (n === 0) return 'Zero';
    let words = '';
    if (n >= 1e9) {
      words += convertLessThanOneThousand(Math.floor(n / 1e9)) + ' Billion';
      n %= 1e9;
      if (n > 0) words += ' ';
    }
    if (n >= 1e6) {
      words += convertLessThanOneThousand(Math.floor(n / 1e6)) + ' Million';
      n %= 1e6;
      if (n > 0) words += ' ';
    }
    if (n >= 1e3) {
      words += convertLessThanOneThousand(Math.floor(n / 1e3)) + ' Thousand';
      n %= 1e3;
      if (n > 0) words += ' ';
    }
    words += convertLessThanOneThousand(n);
    return words.trim();
  };

  if (num === 0) return '(US Dollar Zero and Cent Zero)';
  if (typeof num !== 'number') return ''; // Handle potential invalid input

  const isNegative = num < 0;
  num = Math.abs(num);

  const decimalStr = num.toFixed(2);
  const parts = decimalStr.split('.');
  const dollarPart = parseInt(parts[0], 10);
  const centPart = parseInt(parts[1], 10);

  const dollarWords = convert(dollarPart);
  const centWords = centPart === 0 ? 'Zero' : convert(centPart);

  let result = `(US Dollar ${dollarWords} and Cent ${centWords})`;

  if (isNegative) {
    result = `Negative ${result}`; // Consider how to handle negative if needed
  }

  return result;
}

// Updated invoice number generation logic
export function generateInvoiceNumber(lastInvoiceNo: string | null | undefined, invoiceDate: Date): string {
  console.log(`[generateInvoiceNumber] Received lastInvoiceNo: ${lastInvoiceNo}, invoiceDate: ${invoiceDate.toISOString()}`); // Log inputs

  const prefix = 'CD-';
  const datePart = format(invoiceDate, 'ddMM');
  let nextNum = 1; // Default starting number
  let nextLetterCode = 'A'.charCodeAt(0); // Default starting letter

  if (lastInvoiceNo && lastInvoiceNo.startsWith(prefix)) {
    const parts = lastInvoiceNo.substring(prefix.length).split('/');
    console.log(`[generateInvoiceNumber] Parsed parts: ${JSON.stringify(parts)}`); // Log parts

    if (parts.length > 0) {
        const numericAlphaPart = parts[0];
        if (numericAlphaPart && numericAlphaPart.length > 1) { 
            const numStr = numericAlphaPart.substring(0, numericAlphaPart.length - 1);
            const letter = numericAlphaPart.substring(numericAlphaPart.length - 1);
            console.log(`[generateInvoiceNumber] Parsed numStr: ${numStr}, letter: ${letter}`); // Log parsed num/letter

            const currentNum = parseInt(numStr, 10);
            const currentLetterCode = letter.charCodeAt(0);

            if (!isNaN(currentNum) && !isNaN(currentLetterCode) && currentLetterCode >= 'A'.charCodeAt(0) && currentLetterCode <= 'Z'.charCodeAt(0) ) {
                if (currentNum === 9999) {
                    nextNum = 1;
                    nextLetterCode = currentLetterCode + 1;
                    console.log(`[generateInvoiceNumber] Rollover detected. nextNum: ${nextNum}, nextLetterCode: ${nextLetterCode}`);
                } else {
                    nextNum = currentNum + 1;
                    nextLetterCode = currentLetterCode;
                    console.log(`[generateInvoiceNumber] Incremented number. nextNum: ${nextNum}, nextLetterCode: ${nextLetterCode}`);
                }
            } else {
                 console.error(`[generateInvoiceNumber] Failed to parse numeric/alpha part: '${numericAlphaPart}'. Defaulting.`);
                 nextNum = 54; // << CHANGE: Start at 54 if parsing fails
                 nextLetterCode = 'A'.charCodeAt(0);
            }
        } else {
             console.error(`[generateInvoiceNumber] Invalid numericAlphaPart: '${numericAlphaPart}'. Defaulting.`);
             nextNum = 54; // << CHANGE: Start at 54 if parsing fails
             nextLetterCode = 'A'.charCodeAt(0);
        }
    } else {
         console.error(`[generateInvoiceNumber] Failed to split lastInvoiceNo by '/'. Defaulting.`);
         nextNum = 54; // << CHANGE: Start at 54 if parsing fails
         nextLetterCode = 'A'.charCodeAt(0);
    }
  } else {
       console.log(`[generateInvoiceNumber] No valid lastInvoiceNo provided or prefix mismatch. Starting new sequence.`);
       nextNum = 54; // << CHANGE: Start at 54 for the very first invoice
       nextLetterCode = 'A'.charCodeAt(0);
  }

  if (nextLetterCode > 'Z'.charCodeAt(0)) {
      console.error("[generateInvoiceNumber] Invoice letter sequence exceeded 'Z'. Resetting to A.");
      nextLetterCode = 'A'.charCodeAt(0);
  }

  const nextLetter = String.fromCharCode(nextLetterCode);
  const paddedNum = nextNum.toString().padStart(4, '0');
  const result = `${prefix}${paddedNum}${nextLetter}/${datePart}`;
  console.log(`[generateInvoiceNumber] Generated result: ${result}`); // Log final result
  return result;
}