import jsPDF from 'jspdf';
import { formatCurrency, numberToWords, calculateTotal } from './utils';
import fs from 'fs';
import path from 'path';

interface InvoiceItem {
  id: string;
  description: string;
  carat: number;
  color: string;
  clarity: string;
  lab: string;
  reportNo: string;
  pricePerCarat: number;
  total: number;
}

interface InvoiceData {
  id: string;
  invoiceNo: string;
  date: Date;
  dueDate: Date;
  paymentTerms: number;
  companyName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  description: string | null;
  amountInWords: string;
  subtotal: number;
  discount: number;
  crPayment: number;
  shipmentCost: number;
  totalAmount: number;
  items: InvoiceItem[];
}

// Function to load logo for PDF
function loadLogoForPDF(): { logoData: string | null; logoProps: { width: number; height: number } | null } {
  try {
    // Try multiple possible paths for the logo
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'logo.png'),
      path.join(process.cwd(), 'public', 'imp.png'),
      path.join(process.cwd(), 'logo.png'),
      '/app/public/logo.png', // For some deployment platforms
      './public/logo.png'
    ];
    
    for (const logoPath of possiblePaths) {
      try {
        console.log('🔄 PDF: Trying logo path for PDF:', logoPath);
        const logoBuffer = fs.readFileSync(logoPath);
        console.log('✅ PDF: Logo loaded successfully from:', logoPath, 'Size:', logoBuffer.length, 'bytes');
        
        // Convert to base64 for jsPDF
        const logoData = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        
        // Create a simple properties object (jsPDF will handle the image)
        const logoProps = {
          width: 200, // Default width, will be adjusted
          height: 100 // Default height, will be adjusted
        };
        
        return { logoData, logoProps };
      } catch (pathError) {
        console.log('❌ PDF: Failed to load logo from:', logoPath, pathError instanceof Error ? pathError.message : 'Unknown error');
        continue;
      }
    }
    
    console.log('⚠️ PDF: Could not load logo from any path');
    return { logoData: null, logoProps: null };
  } catch (error) {
    console.error('❌ PDF: Failed to load logo:', error);
    return { logoData: null, logoProps: null };
  }
}

export async function generateInvoicePDFBufferJsPDF(invoice: InvoiceData): Promise<Buffer> {
  console.log('🔄 jsPDF Generation: Starting for invoice', invoice.invoiceNo);
  
  try {
    // Create new PDF document with A4 size
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4'
    });
    
    // Set document properties
    doc.setProperties({
      title: `Invoice ${invoice.invoiceNo}`,
      subject: 'Invoice from Cranberri Diamonds',
      author: 'Cranberri Diamonds',
      creator: 'Cranberri Diamonds Invoice System'
    });
    
    // Calculate totals (same logic as invoice-preview.tsx)
    const subtotal = invoice.items.reduce((total, item) => {
      return total + calculateTotal(Number(item.carat) || 0, Number(item.pricePerCarat) || 0);
    }, 0);
    const totalAmount = subtotal - (Number(invoice.discount) || 0) - (Number(invoice.crPayment) || 0) + (Number(invoice.shipmentCost) || 0);
    const grandTotalTable = subtotal;
    
    // Format dates (DD/MM/YYYY format like in preview)
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      }).format(new Date(date));
    };
    
    let currentY = 15;
    
    // Load logo
    const { logoData, logoProps } = loadLogoForPDF();
    
    // Logo Section - Add actual logo or fallback text with proper sizing
    if (logoData && logoProps) {
      try {
        // Add the logo image to PDF with proper sizing
        const logoWidth = 30; // Reduced for better proportion
        const logoHeight = 15; // Reduced for better proportion
        const logoX = (210 - logoWidth) / 2; // Center on A4 width (210mm)
        
        doc.addImage(logoData, 'PNG', logoX, currentY, logoWidth, logoHeight);
        currentY += logoHeight + 3;
        console.log('✅ PDF: Logo added successfully to PDF');
      } catch (logoError) {
        console.error('❌ PDF: Failed to add logo to PDF:', logoError);
        // Fall back to text logo
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 51, 51); // #333333
        doc.text('Cranberri', 105, currentY, { align: 'center' });
        
        currentY += 6;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Diamonds', 105, currentY, { align: 'center' });
        currentY += 5;
      }
    } else {
      // Fallback text logo (matching preview)
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 51, 51); // #333333
      doc.text('Cranberri', 105, currentY, { align: 'center' });
      
      currentY += 6;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Diamonds', 105, currentY, { align: 'center' });
      currentY += 5;
    }
    
    // Company Address (matching preview format)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128); // #6b7280 - gray-600
    doc.text('B-16, Chandrakant Bhavan, Marol Andheri East, Mumbai 400059 India', 105, currentY, { align: 'center' });
    
    currentY += 4;
    doc.setTextColor(37, 99, 235); // #2563eb - blue-600
    doc.text('www.cranberridiamonds.in', 105, currentY, { align: 'center' });
    
    // Invoice Header Section (matching preview layout)
    currentY += 12;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55); // #1f2937 - gray-800
    doc.text(`Invoice No: ${invoice.invoiceNo}`, 20, currentY);
    
    // Date information (right aligned like preview)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128); // #6b7280 - gray-600
    doc.text(`Date: ${formatDate(invoice.date)}`, 190, currentY, { align: 'right' });
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 190, currentY + 4, { align: 'right' });
    doc.text(`Payment Terms: ${invoice.paymentTerms} days`, 190, currentY + 8, { align: 'right' });
    
    // Bill To Section (matching preview format)
    currentY += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81); // #374151 - gray-700
    doc.text('To:', 20, currentY);
    
    currentY += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(invoice.companyName, 20, currentY);
    
    currentY += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.addressLine1, 20, currentY);
    
    if (invoice.addressLine2) {
      currentY += 4;
      doc.text(invoice.addressLine2, 20, currentY);
    }
    
    currentY += 4;
    doc.text(`${invoice.city}, ${invoice.state} ${invoice.postalCode}`, 20, currentY);
    
    currentY += 4;
    doc.text(invoice.country, 20, currentY);
    
    // Annexure Title with proper underline (matching preview)
    currentY += 12;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Annexure', 105, currentY, { align: 'center' });
    
    // Add proper underline for Annexure with correct positioning
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    const annexureWidth = doc.getTextWidth('Annexure');
    const annexureStartX = 105 - (annexureWidth / 2);
    const annexureEndX = 105 + (annexureWidth / 2);
    doc.line(annexureStartX, currentY + 1, annexureEndX, currentY + 1);
    
    // Items Table (matching preview exact layout)
    currentY += 10;
    const tableWidth = 170;
    const rowHeight = 7; // Increased for better readability
    
    // Table header with light blue background (matching preview)
    doc.setFillColor(219, 234, 254); // #dbeafe - blue-100
    doc.rect(20, currentY - 4, tableWidth, rowHeight, 'F');
    
    // Header border
    doc.setDrawColor(209, 213, 219); // #d1d5db - gray-300
    doc.setLineWidth(0.3);
    doc.rect(20, currentY - 4, tableWidth, rowHeight);
    
    // Column positions (matching preview table layout)
    const colPositions = [20, 55, 70, 95, 115, 140, 165];
    const colWidths = [35, 15, 25, 20, 25, 25, 25];
    
    // Draw vertical lines for columns
    for (let i = 0; i <= colWidths.length; i++) {
      const x = i === 0 ? colPositions[0] : colPositions[i - 1] + colWidths[i - 1];
      doc.line(x, currentY - 4, x, currentY + 3);
    }
    
    // Header text (matching preview) - properly aligned
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Description', 22, currentY);
    doc.text('Carat', 62, currentY, { align: 'center' });
    doc.text('Color & Clarity', 82, currentY, { align: 'center' });
    doc.text('Lab', 105, currentY, { align: 'center' });
    doc.text('Report No.', 127, currentY, { align: 'center' });
    doc.text('Price/ct (USD)', 152, currentY, { align: 'center' });
    doc.text('Total (USD)', 177, currentY, { align: 'center' });
    
    currentY += rowHeight;
    
    // Table rows (matching preview format)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    
    invoice.items.forEach((item, index) => {
      const itemTotal = calculateTotal(Number(item.carat) || 0, Number(item.pricePerCarat) || 0);
      
      // Row border
      doc.rect(20, currentY - 4, tableWidth, rowHeight);
      
      // Draw vertical lines for this row
      for (let i = 0; i <= colWidths.length; i++) {
        const x = i === 0 ? colPositions[0] : colPositions[i - 1] + colWidths[i - 1];
        doc.line(x, currentY - 4, x, currentY + 3);
      }
      
      // Row data - properly aligned
      const description = item.description || `Item${index + 1}`;
      doc.text(description.substring(0, 18), 22, currentY);
      doc.text(Number(item.carat).toFixed(2), 62, currentY, { align: 'center' });
      doc.text(`${item.color} ${item.clarity}`.substring(0, 12), 82, currentY, { align: 'center' });
      doc.text(item.lab.substring(0, 6), 105, currentY, { align: 'center' });
      doc.text(item.reportNo.substring(0, 10), 127, currentY, { align: 'center' });
      doc.text(formatCurrency(Number(item.pricePerCarat)), 165, currentY, { align: 'right' });
      doc.text(formatCurrency(itemTotal), 188, currentY, { align: 'right' });
      
      currentY += rowHeight;
    });
    
    // Grand Total footer (matching preview with light gray background)
    doc.setFillColor(243, 244, 246); // #f3f4f6 - gray-100
    doc.rect(20, currentY - 4, tableWidth, rowHeight, 'F');
    doc.rect(20, currentY - 4, tableWidth, rowHeight);
    
    // Draw vertical lines for footer
    for (let i = 0; i <= colWidths.length; i++) {
      const x = i === 0 ? colPositions[0] : colPositions[i - 1] + colWidths[i - 1];
      doc.line(x, currentY - 4, x, currentY + 3);
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Grand Total:', 152, currentY, { align: 'center' });
    doc.text(formatCurrency(grandTotalTable), 188, currentY, { align: 'right' });
    
    // Account Details and Totals Section (matching preview layout)
    currentY += 15;
    
    // Account Details Box (left side, matching preview)
    const accountBoxWidth = 80;
    const accountBoxHeight = 40; // Increased height
    
    // Account details border
    doc.setDrawColor(209, 213, 219); // #d1d5db - gray-300
    doc.setLineWidth(0.3);
    doc.rect(20, currentY - 4, accountBoxWidth, accountBoxHeight);
    
    // Account header with bottom border
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('ACCOUNT DETAILS', 60, currentY, { align: 'center' });
    doc.line(20, currentY + 2, 100, currentY + 2);
    
    // Account details content with proper spacing
    currentY += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('BENEFICIARY NAME - CRANBERRI DIAMONDS', 22, currentY);
    currentY += 4;
    doc.text('BANK NAME - CITIBANK', 22, currentY);
    currentY += 4;
    doc.text('ADDRESS - 111 WALL STREET,', 22, currentY);
    currentY += 4;
    doc.text('NEW YORK, NY 10043 USA', 22, currentY);
    currentY += 4;
    doc.text('SWIFT - CITIUS33', 22, currentY);
    currentY += 4;
    doc.text('ACCOUNT NUMBER - 70588170001126150', 22, currentY);
    currentY += 4;
    doc.text('ACCOUNT TYPE - CHECKING', 22, currentY);
    
    // Reset currentY for totals section
    currentY -= 30;
    
    // Totals Section (right side, matching preview)
    const totalsStartX = 110;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsStartX, currentY);
    doc.text(formatCurrency(subtotal), 188, currentY, { align: 'right' });
    
    currentY += 4;
    doc.text('Discount:', totalsStartX, currentY);
    doc.text(formatCurrency(invoice.discount || 0), 188, currentY, { align: 'right' });
    
    currentY += 4;
    doc.text('CR/Payment:', totalsStartX, currentY);
    doc.text(formatCurrency(invoice.crPayment || 0), 188, currentY, { align: 'right' });
    
    currentY += 4;
    doc.text('Shipping:', totalsStartX, currentY);
    doc.text(formatCurrency(invoice.shipmentCost || 0), 188, currentY, { align: 'right' });
    
    // Border line above Total Due
    currentY += 3;
    doc.setDrawColor(209, 213, 219);
    doc.line(totalsStartX, currentY, 190, currentY);
    
    currentY += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Total Due:', totalsStartX, currentY);
    doc.text(formatCurrency(totalAmount), 188, currentY, { align: 'right' });
    
    // Amount in words
    currentY += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Amount in words:', totalsStartX, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'italic');
    const words = numberToWords(totalAmount);
    const splitWords = doc.splitTextToSize(words, 75);
    doc.text(splitWords, totalsStartX, currentY);
    
    // Disclaimer Section (matching preview) - Fixed text cutting
    currentY += 18;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('DISCLAIMER:', 20, currentY);
    
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    // Split long disclaimer text properly to avoid cutting
    const disclaimer1 = '1. The goods invoiced herein above are LABORATORY GROWN DIAMONDS. These laboratory grown diamonds are optically, chemically physically identical to mined diamonds.';
    const splitDisclaimer1 = doc.splitTextToSize(disclaimer1, 170);
    doc.text(splitDisclaimer1, 20, currentY);
    
    currentY += splitDisclaimer1.length * 3.5;
    const disclaimer2 = '2. All subsequent future sale of these diamonds must be accompanies by disclosure of their origin as LABORATORY GROWN DIAMONDS.';
    const splitDisclaimer2 = doc.splitTextToSize(disclaimer2, 170);
    doc.text(splitDisclaimer2, 20, currentY);
    
    currentY += splitDisclaimer2.length * 3.5;
    const disclaimer3 = '3. These goods remain the property of the seller until full payment is received. Full payment only transfers the ownership, regardless the conditions of this invoice.';
    const splitDisclaimer3 = doc.splitTextToSize(disclaimer3, 170);
    doc.text(splitDisclaimer3, 20, currentY);
    
    currentY += splitDisclaimer3.length * 3.5;
    const disclaimer4 = 'In case the purchaser takes delivery of goods prior to full payment he will be considered, not as owner, whilst purchaser remains fully liable for any loss or damage.';
    const splitDisclaimer4 = doc.splitTextToSize(disclaimer4, 170);
    doc.text(splitDisclaimer4, 20, currentY);
    
    // Signature Section (matching preview)
    currentY += splitDisclaimer4.length * 3.5 + 8;
    doc.setDrawColor(156, 163, 175); // #9ca3af - gray-400
    doc.line(150, currentY, 190, currentY); // Signature line
    
    currentY += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('For Cranberri Diamonds', 170, currentY, { align: 'center' });
    
    // Footer legal text (matching preview) - Fixed overlapping
    currentY += 10;
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128); // #6b7280 - gray-500
    const legalText1 = 'The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict and are compliance with United Nations Resolutions. I hereby guarantee that these diamonds are conflict free, based on personal knowledge and/ or written guarantees provided by the supplier of these diamonds. Cranberri diamonds deals only in Lab Grown Diamonds. All diamonds invoiced are Lab Grown Diamonds immaterial if its certified or non-certified.';
    const splitLegal1 = doc.splitTextToSize(legalText1, 170);
    doc.text(splitLegal1, 20, currentY);
    
    currentY += splitLegal1.length * 3 + 3;
    const legalText2 = 'Received the above goods on the terms and conditions set out';
    doc.text(legalText2, 20, currentY);
    
    // Get PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    console.log('✅ jsPDF Generation: PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    return pdfBuffer;
  } catch (error) {
    console.error('❌ jsPDF Generation Error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 