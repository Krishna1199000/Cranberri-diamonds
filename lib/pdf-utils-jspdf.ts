import jsPDF from 'jspdf';

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

export async function generateInvoicePDFBufferJsPDF(invoice: InvoiceData): Promise<Buffer> {
  console.log('🔄 jsPDF Generation: Starting for invoice', invoice.invoiceNo);
  
  try {
    // Create new PDF document
    const doc = new jsPDF();
    
    // Set document properties
    doc.setProperties({
      title: `Invoice ${invoice.invoiceNo}`,
      subject: 'Invoice from Cranberri Diamonds',
      author: 'Cranberri Diamonds',
      creator: 'Cranberri Diamonds Invoice System'
    });
    
    // Add header with logo styling (matching invoice preview print sizes)
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Cranberri', 105, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Diamonds', 105, 32, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('B-16, Chandrakant Bhavan, Marol Andheri East, Mumbai 400059 India', 105, 40, { align: 'center' });
    doc.text('www.cranberridiamonds.in', 105, 45, { align: 'center' });
    
    // Add invoice details (matching invoice preview print sizes)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice No: ${invoice.invoiceNo}`, 20, 55);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${formatDate(invoice.date)}`, 140, 55);
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 140, 60);
    doc.text(`Payment Terms: ${invoice.paymentTerms} days`, 140, 65);
    
    // Add bill to information (matching invoice preview print sizes)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('To:', 20, 75);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.companyName, 20, 82);
    doc.text(invoice.addressLine1, 20, 87);
    if (invoice.addressLine2) {
      doc.text(invoice.addressLine2, 20, 92);
    }
    doc.text(`${invoice.city}, ${invoice.state} ${invoice.postalCode}`, 20, 97);
    doc.text(invoice.country, 20, 102);
    
    // Add Annexure title (matching invoice preview print sizes)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Annexure', 105, 115, { align: 'center' });
    
    // Add items table manually (without autoTable plugin)
    let currentY = 125;
    
    // Table header with background color (matching invoice preview print sizes)
    doc.setFillColor(219, 234, 254); // Light blue background
    doc.rect(20, currentY - 6, 170, 6, 'F'); // Fill header background
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Black text
    doc.text('Description', 20, currentY);
    doc.text('Carat', 60, currentY);
    doc.text('Color & Clarity', 80, currentY);
    doc.text('Lab', 110, currentY);
    doc.text('Report No.', 125, currentY);
    doc.text('Price/ct (USD)', 150, currentY);
    doc.text('Total (USD)', 170, currentY);
    
    currentY += 8;
    
    // Add table border
    doc.setDrawColor(209, 213, 219); // Light gray border
    doc.setLineWidth(0.5);
    doc.rect(20, currentY - 14, 170, 6); // Header border
    
    // Table rows (matching invoice preview print sizes)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0); // Reset text color
    
    invoice.items.forEach((item) => {
      if (currentY > 250) {
        // Add new page if needed
        doc.addPage();
        currentY = 20;
      }
      
      // Add row border
      doc.rect(20, currentY - 4, 170, 4);
      
      doc.text(item.description.substring(0, 15), 20, currentY);
      doc.text(item.carat.toFixed(2), 60, currentY);
      doc.text(`${item.color} ${item.clarity}`, 80, currentY);
      doc.text(item.lab, 110, currentY);
      doc.text(item.reportNo.substring(0, 8), 125, currentY);
      doc.text(formatCurrency(item.pricePerCarat), 150, currentY);
      doc.text(formatCurrency(item.total), 170, currentY);
      
      currentY += 6;
    });
    
    const finalY = currentY + 6;
    
    // Add Grand Total row with background (matching invoice preview print sizes)
    doc.setFillColor(243, 244, 246); // Light gray background
    doc.rect(20, finalY - 6, 170, 6, 'F'); // Fill footer background
    doc.rect(20, finalY - 6, 170, 6); // Add border
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Black text
    doc.text('Grand Total:', 150, finalY);
    doc.text(formatCurrency(invoice.subtotal), 170, finalY);
    
    // Add account details and totals side by side
    const accountY = finalY + 8;
    
    // Account Details (left side) with border (matching invoice preview print sizes)
    doc.setDrawColor(209, 213, 219); // Light gray border
    doc.setLineWidth(0.5);
    doc.rect(20, accountY - 4, 80, 40); // Account details border
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('ACCOUNT DETAILS', 60, accountY, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('BENEFICIARY NAME - CRANBERRI DIAMONDS', 20, accountY + 6);
    doc.text('BANK NAME - CITIBANK', 20, accountY + 10);
    doc.text('ADDRESS - 111 WALL STREET,', 20, accountY + 14);
    doc.text('NEW YORK, NY 10043 USA', 20, accountY + 18);
    doc.text('SWIFT - CITIUS33', 20, accountY + 22);
    doc.text('ACCOUNT NUMBER - 70588170001126150', 20, accountY + 26);
    doc.text('ACCOUNT TYPE - CHECKING', 20, accountY + 30);
    
    // Totals (right side) with border (matching invoice preview print sizes)
    doc.rect(110, accountY - 4, 80, 40); // Totals border
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Subtotal:', 150, accountY);
    doc.text(formatCurrency(invoice.subtotal), 170, accountY);
    doc.text('Discount:', 150, accountY + 4);
    doc.text(formatCurrency(invoice.discount || 0), 170, accountY + 4);
    doc.text('CR/Payment:', 150, accountY + 8);
    doc.text(formatCurrency(invoice.crPayment || 0), 170, accountY + 8);
    doc.text('Shipping:', 150, accountY + 12);
    doc.text(formatCurrency(invoice.shipmentCost || 0), 170, accountY + 12);
    
    // Add line separator above Total Due
    doc.setDrawColor(209, 213, 219);
    doc.line(150, accountY + 15, 190, accountY + 15);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Total Due:', 150, accountY + 18);
    doc.text(formatCurrency(invoice.totalAmount), 170, accountY + 18);
    
    // Add amount in words (matching invoice preview print sizes)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Amount in words:', 150, accountY + 24);
    doc.setFontSize(9);
    doc.text(invoice.amountInWords, 150, accountY + 28);
    
    // Add disclaimer with border (matching invoice preview print sizes)
    const disclaimerY = accountY + 40;
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.5);
    doc.rect(20, disclaimerY - 4, 170, 24); // Disclaimer border
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('DISCLAIMER:', 20, disclaimerY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('1. The goods invoiced herein above are LABORATORY GROWN DIAMONDS. These laboratory grown diamonds are optically, chemically physically identical to mined diamonds.', 20, disclaimerY + 4);
    doc.text('2. All subsequent future sale of these diamonds must be accompanies by disclosure of their origin as LABORATORY GROWN DIAMONDS.', 20, disclaimerY + 8);
    doc.text('3. These goods remain the property of the seller until full payment is received. Full payment only transfers the ownership, regardless the conditions of this invoice.', 20, disclaimerY + 12);
    
    // Add signature section with line (matching invoice preview print sizes)
    const signatureY = disclaimerY + 24;
    doc.setDrawColor(209, 213, 219);
    doc.line(150, signatureY - 2, 190, signatureY - 2); // Signature line
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('For Cranberri Diamonds', 170, signatureY, { align: 'center' });
    
    // Add description if available
    if (invoice.description) {
      doc.text('Description:', 20, disclaimerY + 50);
      doc.setFontSize(9);
      const splitDescription = doc.splitTextToSize(invoice.description, 170);
      doc.text(splitDescription, 20, disclaimerY + 57);
    }
    
    // Add footer (matching invoice preview print sizes)
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const terms = 'The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict and are compliance with United Nations Resolutions. I hereby guarantee that these diamonds are conflict free, based on personal knowledge and/ or written guarantees provided by the supplier of these diamonds. Cranberri diamonds deals only in Lab Grown Diamonds. All diamonds invoiced are Lab Grown Diamonds immaterial if its certified or non-certified.';
    const splitTerms = doc.splitTextToSize(terms, 170);
    doc.text(splitTerms, 20, pageHeight - 20);
    doc.text('Received the above goods on the terms and conditions set out', 20, pageHeight - 8);
    
    // Get PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    console.log('✅ jsPDF Generation: PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    return pdfBuffer;
  } catch (error) {
    console.error('❌ jsPDF Generation Error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
} 