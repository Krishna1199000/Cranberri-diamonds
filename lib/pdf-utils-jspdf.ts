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
    
    // Add header with logo styling
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Cranberri', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Diamonds', 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('B-16, Chandrakant Bhavan, Marol Andheri East, Mumbai 400059 India', 105, 40, { align: 'center' });
    doc.text('www.cranberridiamonds.in', 105, 47, { align: 'center' });
    
    // Add invoice details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice No: ${invoice.invoiceNo}`, 20, 60);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${formatDate(invoice.date)}`, 140, 60);
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 140, 67);
    doc.text(`Payment Terms: ${invoice.paymentTerms} days`, 140, 74);
    
    // Add bill to information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('To:', 20, 85);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.companyName, 20, 95);
    doc.text(invoice.addressLine1, 20, 102);
    if (invoice.addressLine2) {
      doc.text(invoice.addressLine2, 20, 109);
    }
    doc.text(`${invoice.city}, ${invoice.state} ${invoice.postalCode}`, 20, 116);
    doc.text(invoice.country, 20, 123);
    
    // Add Annexure title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Annexure', 105, 140, { align: 'center' });
    
    // Add items table manually (without autoTable plugin)
    let currentY = 150;
    
    // Table header with background color
    doc.setFillColor(219, 234, 254); // Light blue background
    doc.rect(20, currentY - 8, 170, 8, 'F'); // Fill header background
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Black text
    doc.text('Description', 20, currentY);
    doc.text('Carat', 60, currentY);
    doc.text('Color & Clarity', 80, currentY);
    doc.text('Lab', 110, currentY);
    doc.text('Report No.', 125, currentY);
    doc.text('Price/ct (USD)', 150, currentY);
    doc.text('Total (USD)', 170, currentY);
    
    currentY += 10;
    
    // Add table border
    doc.setDrawColor(209, 213, 219); // Light gray border
    doc.setLineWidth(0.5);
    doc.rect(20, currentY - 18, 170, 8); // Header border
    
    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0); // Reset text color
    
    invoice.items.forEach((item) => {
      if (currentY > 250) {
        // Add new page if needed
        doc.addPage();
        currentY = 20;
      }
      
      // Add row border
      doc.rect(20, currentY - 6, 170, 6);
      
      doc.text(item.description.substring(0, 15), 20, currentY);
      doc.text(item.carat.toFixed(2), 60, currentY);
      doc.text(`${item.color} ${item.clarity}`, 80, currentY);
      doc.text(item.lab, 110, currentY);
      doc.text(item.reportNo.substring(0, 8), 125, currentY);
      doc.text(formatCurrency(item.pricePerCarat), 150, currentY);
      doc.text(formatCurrency(item.total), 170, currentY);
      
      currentY += 8;
    });
    
    const finalY = currentY + 10;
    
    // Add Grand Total row with background
    doc.setFillColor(243, 244, 246); // Light gray background
    doc.rect(20, finalY - 8, 170, 8, 'F'); // Fill footer background
    doc.rect(20, finalY - 8, 170, 8); // Add border
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Black text
    doc.text('Grand Total:', 150, finalY);
    doc.text(formatCurrency(invoice.subtotal), 170, finalY);
    
    // Add account details and totals side by side
    const accountY = finalY + 20;
    
    // Account Details (left side) with border
    doc.setDrawColor(209, 213, 219); // Light gray border
    doc.setLineWidth(0.5);
    doc.rect(20, accountY - 8, 80, 58); // Account details border
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('ACCOUNT DETAILS', 60, accountY, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('BENEFICIARY NAME - CRANBERRI DIAMONDS', 20, accountY + 8);
    doc.text('BANK NAME - CITIBANK', 20, accountY + 15);
    doc.text('ADDRESS - 111 WALL STREET,', 20, accountY + 22);
    doc.text('NEW YORK, NY 10043 USA', 20, accountY + 29);
    doc.text('SWIFT - CITIUS33', 20, accountY + 36);
    doc.text('ACCOUNT NUMBER - 70588170001126150', 20, accountY + 43);
    doc.text('ACCOUNT TYPE - CHECKING', 20, accountY + 50);
    
    // Totals (right side) with border
    doc.rect(110, accountY - 8, 80, 58); // Totals border
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Subtotal:', 150, accountY);
    doc.text(formatCurrency(invoice.subtotal), 170, accountY);
    doc.text('Discount:', 150, accountY + 8);
    doc.text(formatCurrency(invoice.discount || 0), 170, accountY + 8);
    doc.text('CR/Payment:', 150, accountY + 16);
    doc.text(formatCurrency(invoice.crPayment || 0), 170, accountY + 16);
    doc.text('Shipping:', 150, accountY + 24);
    doc.text(formatCurrency(invoice.shipmentCost || 0), 170, accountY + 24);
    
    // Add line separator above Total Due
    doc.setDrawColor(209, 213, 219);
    doc.line(150, accountY + 28, 190, accountY + 28);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total Due:', 150, accountY + 32);
    doc.text(formatCurrency(invoice.totalAmount), 170, accountY + 32);
    
    // Add amount in words
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Amount in words:', 150, accountY + 40);
    doc.setFontSize(8);
    doc.text(invoice.amountInWords, 150, accountY + 47);
    
    // Add disclaimer with border
    const disclaimerY = accountY + 60;
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.5);
    doc.rect(20, disclaimerY - 8, 170, 40); // Disclaimer border
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('DISCLAIMER:', 20, disclaimerY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('1. The goods invoiced herein above are LABORATORY GROWN DIAMONDS. These laboratory grown diamonds are optically, chemically physically identical to mined diamonds.', 20, disclaimerY + 8);
    doc.text('2. All subsequent future sale of these diamonds must be accompanies by disclosure of their origin as LABORATORY GROWN DIAMONDS.', 20, disclaimerY + 16);
    doc.text('3. These goods remain the property of the seller until full payment is received. Full payment only transfers the ownership, regardless the conditions of this invoice.', 20, disclaimerY + 24);
    
    // Add signature section with line
    const signatureY = disclaimerY + 40;
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
    
    // Add footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const terms = 'The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict and are compliance with United Nations Resolutions. I hereby guarantee that these diamonds are conflict free, based on personal knowledge and/ or written guarantees provided by the supplier of these diamonds. Cranberri diamonds deals only in Lab Grown Diamonds. All diamonds invoiced are Lab Grown Diamonds immaterial if its certified or non-certified.';
    const splitTerms = doc.splitTextToSize(terms, 170);
    doc.text(splitTerms, 20, pageHeight - 25);
    doc.text('Received the above goods on the terms and conditions set out', 20, pageHeight - 10);
    
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