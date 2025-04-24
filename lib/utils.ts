import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return format(date, 'dd/MM/yyyy');
}

export function calculateTotal(carat: number, pricePerCarat: number): number {
  return carat * pricePerCarat;
}

export function numberToWords(num: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convertLessThanOneThousand = (num: number): string => {
    if (num === 0) {
      return '';
    }
    
    let result = '';
    
    if (num >= 100) {
      result += units[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    
    if (num >= 10 && num < 20) {
      result += teens[num - 10];
      return result;
    }
    
    if (num >= 20) {
      result += tens[Math.floor(num / 10)];
      num %= 10;
      
      if (num > 0) {
        result += ' ' + units[num];
      }
    } else if (num > 0) {
      result += units[num];
    }
    
    return result;
  };
  
  if (num === 0) {
    return 'Zero';
  }
  
  // Handle negative numbers
  const isNegative = num < 0;
  num = Math.abs(num);
  
  // Split into whole and decimal parts
  const decimalStr = num.toFixed(2);
  const parts = decimalStr.split('.');
  const wholePart = parseInt(parts[0]);
  const decimalPart = parseInt(parts[1]);
  
  // Convert whole part
  let result = '';
  
  if (wholePart >= 1e12) {
    result += convertLessThanOneThousand(Math.floor(wholePart / 1e12)) + ' Trillion ';
    num %= 1e12;
  }
  
  if (wholePart >= 1e9) {
    result += convertLessThanOneThousand(Math.floor(wholePart / 1e9)) + ' Billion ';
    num %= 1e9;
  }
  
  if (wholePart >= 1e6) {
    result += convertLessThanOneThousand(Math.floor(wholePart / 1e6)) + ' Million ';
    num %= 1e6;
  }
  
  if (wholePart >= 1e3) {
    result += convertLessThanOneThousand(Math.floor(wholePart / 1e3)) + ' Thousand ';
    num %= 1e3;
  }
  
  result += convertLessThanOneThousand(wholePart % 1000);
  
  // Add dollars
  result = result.trim() + ' Dollars';
  
  // Add cents
  if (decimalPart > 0) {
    result += ' and ' + convertLessThanOneThousand(decimalPart) + ' Cents';
  }
  
  // Add 'Only' at the end and handle negative numbers
  return (isNegative ? 'Negative ' : '') + result + ' Only';
}

export function generateInvoiceNumber(lastInvoiceId: number): string {
  const nextId = lastInvoiceId + 1;
  const paddedId = nextId.toString().padStart(4, '0');
  const today = new Date();
  const datePart = format(today, 'ddMM');
  
  return `CD-${paddedId}A/${datePart.substring(0, 2)}${datePart.substring(2, 4)}`;
}