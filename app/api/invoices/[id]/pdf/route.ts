// app/api/invoices/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Invoice, InvoiceItem } from '@prisma/client';
import { formatDateWithSuffix, formatCurrency } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import fs from 'fs'; // Import fs to read the image file
import path from 'path'; // Import path for constructing file path

const prisma = new PrismaClient();

// Define a type for the Invoice with its items
type InvoiceWithItems = Invoice & {
    items: InvoiceItem[];
};

// --- COPY numberToWords function logic here ---
function numberToWords(num: number): string {
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
    if (n >= 1e9) { words += convertLessThanOneThousand(Math.floor(n / 1e9)) + ' Billion'; n %= 1e9; if (n > 0) words += ' '; }
    if (n >= 1e6) { words += convertLessThanOneThousand(Math.floor(n / 1e6)) + ' Million'; n %= 1e6; if (n > 0) words += ' '; }
    if (n >= 1e3) { words += convertLessThanOneThousand(Math.floor(n / 1e3)) + ' Thousand'; n %= 1e3; if (n > 0) words += ' '; }
    words += convertLessThanOneThousand(n);
    return words.trim();
  };

  if (num === null || num === undefined) return ''; // Handle null/undefined input
  if (typeof num !== 'number') return '';

  if (num === 0) return '(US Dollar Zero and Cent Zero)';

  const isNegative = num < 0;
  num = Math.abs(num);

  const decimalStr = num.toFixed(2);
  const parts = decimalStr.split('.');
  const dollarPart = parseInt(parts[0], 10);
  const centPart = parseInt(parts[1], 10);

  const dollarWords = convert(dollarPart);
  const centWords = centPart === 0 ? 'Zero' : convert(centPart);

  let result = `(US Dollar ${dollarWords} and Cent ${centWords})`;

  if (isNegative) { result = `Negative ${result}`; }

  return result;
}
// --- END numberToWords function logic ---

export async function GET(
    request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: resolvedParams.id },
            include: { items: true }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Create a new PDF document (autoTable should be available now)
        const doc = new jsPDF();
        
        // Generate the PDF content
        await generateInvoicePDF(doc, invoice as InvoiceWithItems);
        
        // Get the PDF as a buffer
        const pdfBytes = doc.output('arraybuffer');
        
        // Set response headers for PDF download
        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        // Sanitize filename - replace slashes which are invalid in filenames
        const safeInvoiceNo = invoice.invoiceNo.replace(/\/|\?/g, '-');
        headers.set('Content-Disposition', `inline; filename="Invoice-${safeInvoiceNo}.pdf"`);

        // Return the PDF as the response
        return new NextResponse(pdfBytes, {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('Error generating PDF:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

async function generateInvoicePDF(doc: jsPDF, invoice: InvoiceWithItems) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let currentY = 15; // Start Y position

    // === Logo ===
    try {
        const imgPath = path.join(process.cwd(), 'public', 'logo.png');
        const imgData = fs.readFileSync(imgPath);
        const imgProps = doc.getImageProperties(imgData);
        const imgWidth = 40; // Smaller width to match preview
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        const imgX = (pageWidth - imgWidth) / 2;
        doc.addImage(imgData, 'PNG', imgX, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 1; // Minimal spacing after logo
    } catch (imgError) {
        console.error("Error loading logo image:", imgError);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text("Cranberri", pageWidth / 2, currentY + 5, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("Diamonds", pageWidth / 2, currentY + 12, { align: 'center' });
        currentY += 15;
    }

    // === Company Address and Website ===
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100); // Gray color for address
    doc.text("B-16, Chandrakant Bhavan, Marol Andheri East, Mumbai 400059 India", pageWidth / 2, currentY, { align: 'center' });
    currentY += 3;
    doc.text("www.cranberridiamonds.in", pageWidth / 2, currentY, { align: 'center' });
    doc.setTextColor(0, 0, 0); // Reset to black
    currentY += 4; // Reduced space after address

    // === Header Section (Invoice No Left, Dates Right) ===
    const headerStartY = currentY;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice No: ${invoice.invoiceNo}`, margin, headerStartY);
    doc.setFont('helvetica', 'normal');

    doc.setFontSize(9);
    const rightColX = pageWidth - margin;
    doc.text(`Date: ${formatDateWithSuffix(invoice.date)}`, rightColX, headerStartY, { align: 'right' });
    doc.text(`Due Date: ${formatDateWithSuffix(invoice.dueDate)}`, rightColX, headerStartY + 4, { align: 'right' });
    doc.text(`Payment Terms: ${invoice.paymentTerms} days`, rightColX, headerStartY + 8, { align: 'right' });
    currentY = headerStartY + 12; // Reduced space below dates

    // === Billing Address ('To:') Section ===
    currentY += 3; // Reduced space before address
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('To:', margin, currentY);
    currentY += 4;
    doc.text(invoice.companyName, margin, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(invoice.addressLine1, margin, currentY);
    currentY += 4;
    if (invoice.addressLine2) {
        doc.text(invoice.addressLine2, margin, currentY);
        currentY += 4;
    }
    doc.text(`${invoice.city}, ${invoice.state} ${invoice.postalCode}`, margin, currentY);
    currentY += 4;
    doc.text(invoice.country, margin, currentY);
    currentY += 6; // Reduced space after address

    // === Annexure Title ===
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Annexure', pageWidth / 2, currentY, { align: 'center' });
    const annexureTextWidth = doc.getTextWidth('Annexure');
    doc.line(pageWidth / 2 - annexureTextWidth / 2, currentY + 1, pageWidth / 2 + annexureTextWidth / 2, currentY + 1);
    doc.setFont('helvetica', 'normal');
    currentY += 6; // Reduced space after title

    // === Items Table ===
    const tableStartY = currentY;
    const colWidths = [45, 15, 25, 15, 25, 25, 25]; // Column widths
    const colPositions = [margin];
    for (let i = 1; i < colWidths.length; i++) {
        colPositions.push(colPositions[i-1] + colWidths[i-1]);
    }
    
    // Table headers
    const headers = ['Description', 'Carat', 'Color & Clarity', 'Lab', 'Report No.', 'Price/ct (USD)', 'Total (USD)'];
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(219, 234, 254); // Light blue background to match preview
    
    // Draw header background
    doc.rect(margin, tableStartY, colWidths.reduce((a, b) => a + b, 0), 6, 'F');
    
    // Draw header text
    headers.forEach((header, i) => {
        const x = colPositions[i] + 2;
        const align = i === 1 || i === 5 || i === 6 ? 'right' : i === 3 || i === 4 ? 'center' : 'left';
        doc.text(header, x, tableStartY + 4, { align });
    });
    
    // Draw header border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(margin, tableStartY, margin + colWidths.reduce((a, b) => a + b, 0), tableStartY);
    doc.line(margin, tableStartY + 6, margin + colWidths.reduce((a, b) => a + b, 0), tableStartY + 6);
    
    let tableY = tableStartY + 6;
    let grandTotal = 0;
    
    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    invoice.items.forEach((item) => {
        const itemTotal = (item.carat || 0) * (item.pricePerCarat || 0);
        grandTotal += itemTotal;
        
        // Check if we need a new page
        if (tableY > 250) {
            doc.addPage();
            tableY = 20;
        }
        
        // Draw row data
        const rowData = [
            item.description || '',
            (item.carat || 0).toFixed(2),
            `${item.color || ''} ${item.clarity || ''}`,
            item.lab || '',
            item.reportNo || '',
            `$${formatCurrency(item.pricePerCarat || 0)}`,
            `$${formatCurrency(itemTotal)}`
        ];
        
        rowData.forEach((text, i) => {
            const x = colPositions[i] + 2;
            const align = i === 1 || i === 5 || i === 6 ? 'right' : i === 3 || i === 4 ? 'center' : 'left';
            doc.text(text.substring(0, 20), x, tableY + 2.5, { align });
        });
        
        // Draw row border
        doc.line(margin, tableY, margin + colWidths.reduce((a, b) => a + b, 0), tableY);
        doc.line(margin, tableY + 5, margin + colWidths.reduce((a, b) => a + b, 0), tableY + 5);
        
        tableY += 5;
    });
    
    // Grand total row
    const totalRowY = tableY;
    doc.setFillColor(243, 244, 246); // Light gray background to match preview
    const spanWidth = colWidths.slice(0, -1).reduce((a, b) => a + b, 0);
    doc.rect(margin, totalRowY, spanWidth, 6, 'F');
    doc.rect(margin + spanWidth, totalRowY, colWidths[colWidths.length - 1], 6, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text('Grand Total:', margin + spanWidth - 2, totalRowY + 4, { align: 'right' });
    doc.text(`$${formatCurrency(grandTotal)}`, margin + spanWidth + colWidths[colWidths.length - 1] - 2, totalRowY + 4, { align: 'right' });
    
    // Draw total row borders
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(margin, totalRowY, margin + spanWidth + colWidths[colWidths.length-1], totalRowY);
    doc.line(margin, totalRowY + 6, margin + spanWidth + colWidths[colWidths.length-1], totalRowY + 6);
    doc.line(margin, totalRowY, margin, totalRowY + 6);
    doc.line(margin + spanWidth, totalRowY, margin + spanWidth, totalRowY + 6);
    doc.line(margin + spanWidth + colWidths[colWidths.length -1], totalRowY, margin + spanWidth + colWidths[colWidths.length -1], totalRowY + 6);
    
    currentY = totalRowY + 6 + 4;

    // === Two Column Layout (Account Details & Totals) ===
    const twoColStartY = currentY;
    const accountBoxWidth = contentWidth * 0.45;
    const totalsWidth = contentWidth * 0.53;
    const totalsX = margin + accountBoxWidth + (contentWidth * 0.02);

    // --- Account Details (Left) ---
    const accountLineHeight = 3.5;
    let accountY = twoColStartY + 6;

    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.5);
    doc.rect(margin, twoColStartY, accountBoxWidth, 32);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ACCOUNT DETAILS', margin + accountBoxWidth / 2, twoColStartY + 4, { align: 'center' });
    doc.line(margin + 1, twoColStartY + 6, margin + accountBoxWidth - 1, twoColStartY + 6);

    doc.setFontSize(9);
    const addAccountDetail = (label: string, value: string | null | undefined) => {
        const textValue = value ?? '';
        doc.setFont('helvetica', 'normal');
        const labelX = margin + 2;
        doc.text(`${label} - ${textValue}`, labelX, accountY);
        accountY += accountLineHeight;
    };

    addAccountDetail('BENEFICIARY NAME', 'CRANBERRI DIAMONDS');
    addAccountDetail('BANK NAME', 'CITIBANK');
    addAccountDetail('ADDRESS', '111 WALL STREET,');
    doc.setFont('helvetica', 'normal');
    doc.text('NEW YORK, NY 10043 USA', margin + accountBoxWidth / 2, accountY, { align: 'center' });
    accountY += accountLineHeight;
    addAccountDetail('SWIFT', 'CITIUS33');
    addAccountDetail('ACCOUNT NUMBER', '70588170001126150');
    addAccountDetail('ACCOUNT TYPE', 'CHECKING');
    const accountBoxEndY = twoColStartY + 32;

    // --- Totals (Right) ---
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.5);
    doc.rect(totalsX - 2, twoColStartY, totalsWidth + 2, 32);
    
    let totalsY = twoColStartY + 4;
    doc.setFontSize(9);
    const addTotalRow = (label: string, amount: number, isBold = false) => {
        if (isBold) doc.setFont('helvetica', 'bold');
        else doc.setFont('helvetica', 'normal');
        doc.text(label, totalsX, totalsY);
        doc.text(`${formatCurrency(amount)}`, margin + contentWidth - 2, totalsY, { align: 'right' });
        totalsY += 4;
    };

    addTotalRow('Subtotal:', invoice.subtotal || 0);
    addTotalRow('Discount:', invoice.discount || 0);
    addTotalRow('CR/Payment:', invoice.crPayment || 0);
    addTotalRow('Shipping:', invoice.shipmentCost || 0);
    
    doc.setDrawColor(209, 213, 219);
    doc.line(totalsX, totalsY, margin + contentWidth - 2, totalsY);
    totalsY += 2;
    doc.setFontSize(10);
    addTotalRow('Total Due:', invoice.totalAmount, true);

    // Amount in Words
    totalsY += 1;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Amount in words:', totalsX, totalsY);
    totalsY += 3;
    doc.setFont('helvetica', 'italic');
    const amountText = numberToWords(invoice.totalAmount);
    const amountLines = doc.splitTextToSize(amountText, totalsWidth - 5);
    doc.text(amountLines, totalsX, totalsY);
    totalsY += amountLines.length * 3;
    doc.setFont('helvetica', 'normal');

    currentY = Math.max(accountBoxEndY, totalsY) + 6;

    // === Disclaimer ===
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DISCLAIMER:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 4;
    doc.setFontSize(7);
    const disclaimerText = [
        '1. The goods invoiced herein above are LABORATORY GROWN DIAMONDS. These laboratory grown diamonds are optically, chemically physically identical to mined diamonds.',
        '2. All subsequent future sale of these diamonds must be accompanies by disclosure of their origin as LABORATORY GROWN DIAMONDS.',
        '3. These goods remain the property of the seller until full payment is received. Full payment only transfers the ownership, regardless the conditions of this invoice. In case the purchaser takes delivery of goods prior to full payment he will be considered, not as owner, whilst purchaser remains fully liable for any loss or damage.'
    ];
    disclaimerText.forEach(text => {
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, margin, currentY);
        currentY += lines.length * 3 + 1;
    });
    currentY += 2;

    // === Legal Text ===
    doc.setFontSize(6.5);
    const legalText = "The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict and are compliance with United Nations Resolutions. I hereby guarantee that these diamonds are conflict free, based on personal knowledge and/ or written guarantees provided by the supplier of these diamonds. UNIQUE LAB GROWN DIAMOND INC. deals only in Lab Grown Diamonds. All diamonds invoiced are Lab Grown Diamonds immaterial if its certified or non-certified.";
    const legalLines = doc.splitTextToSize(legalText, contentWidth);
    doc.text(legalLines, margin, currentY);
    currentY += legalLines.length * 2.5 + 1;
    doc.text("Received the above goods on the terms and conditions set out", margin, currentY);
    currentY += 5;

    // === Signature Line ===
    const signatureY = Math.min(currentY + 10, 280);
    const signatureText = 'For Cranberri Diamonds';
    const signatureX = pageWidth - margin - 35;
    const signatureWidth = 60;

    doc.setLineWidth(0.3);
    doc.setDrawColor(0);
    doc.line(signatureX - signatureWidth / 2, signatureY, signatureX + signatureWidth / 2, signatureY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(signatureText, signatureX, signatureY + 5, { align: 'center' });
}