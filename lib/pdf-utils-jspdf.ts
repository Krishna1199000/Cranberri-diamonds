import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
    
    // Add header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CRANBERRI DIAMONDS', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Premium Lab-Grown Diamonds', 105, 30, { align: 'center' });
    doc.text('B-16, Chandrakant Bhavan, Marol Andheri East, Mumbai 400059 India', 105, 37, { align: 'center' });
    doc.text('Email: accounts@cranberridiamonds.in | Website: www.cranberridiamonds.in', 105, 44, { align: 'center' });
    
    // Add invoice details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, 60);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${invoice.invoiceNo}`, 20, 70);
    doc.text(`Date: ${formatDate(invoice.date)}`, 20, 77);
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 20, 84);
    doc.text(`Payment Terms: ${invoice.paymentTerms} days`, 20, 91);
    
    // Add bill to information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, 110);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.companyName, 20, 120);
    doc.text(invoice.addressLine1, 20, 127);
    if (invoice.addressLine2) {
      doc.text(invoice.addressLine2, 20, 134);
    }
    doc.text(`${invoice.city}, ${invoice.state} ${invoice.postalCode}`, 20, 141);
    doc.text(invoice.country, 20, 148);
    
    // Add items table
    const tableData = invoice.items.map(item => [
      item.description,
      item.carat.toString(),
      item.color,
      item.clarity,
      item.lab,
      item.reportNo,
      formatCurrency(item.pricePerCarat),
      formatCurrency(item.total)
    ]);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).autoTable({
      startY: 170,
      head: [['Description', 'Carat', 'Color', 'Clarity', 'Lab', 'Report #', 'Price/Carat', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        1: { halign: 'center' }, // Carat
        2: { halign: 'center' }, // Color
        3: { halign: 'center' }, // Clarity
        4: { halign: 'center' }, // Lab
        5: { halign: 'center' }, // Report #
        6: { halign: 'right' },  // Price/Carat
        7: { halign: 'right' }   // Total
      }
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Add totals
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', 150, finalY);
    doc.text(formatCurrency(invoice.subtotal), 180, finalY, { align: 'right' });
    
    if (invoice.discount > 0) {
      doc.text('Discount:', 150, finalY + 7);
      doc.text(`-${formatCurrency(invoice.discount)}`, 180, finalY + 7, { align: 'right' });
    }
    
    if (invoice.crPayment > 0) {
      doc.text('CR Payment:', 150, finalY + 14);
      doc.text(`-${formatCurrency(invoice.crPayment)}`, 180, finalY + 14, { align: 'right' });
    }
    
    if (invoice.shipmentCost > 0) {
      doc.text('Shipment Cost:', 150, finalY + 21);
      doc.text(formatCurrency(invoice.shipmentCost), 180, finalY + 21, { align: 'right' });
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', 150, finalY + 35);
    doc.text(formatCurrency(invoice.totalAmount), 180, finalY + 35, { align: 'right' });
    
    // Add amount in words
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Amount in Words: ${invoice.amountInWords}`, 20, finalY + 50);
    
    // Add description if available
    if (invoice.description) {
      doc.text('Description:', 20, finalY + 60);
      doc.setFontSize(9);
      const splitDescription = doc.splitTextToSize(invoice.description, 170);
      doc.text(splitDescription, 20, finalY + 67);
    }
    
    // Add footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Terms & Conditions:', 20, pageHeight - 40);
    doc.setFontSize(7);
    const terms = 'The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict and are compliance with United Nations Resolutions. I hereby guarantee that these diamonds are conflict free, based on personal knowledge and/ or written guarantees provided by the supplier of these diamonds. Cranberri diamonds deals only in Lab Grown Diamonds. All diamonds invoiced are Lab Grown Diamonds immaterial if its certified or non-certified.';
    const splitTerms = doc.splitTextToSize(terms, 170);
    doc.text(splitTerms, 20, pageHeight - 35);
    doc.text('Received the above goods on the terms and conditions set out', 20, pageHeight - 15);
    
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