// Define the interface locally since it's not exported from pdf-utils
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

// Simple HTML to PDF conversion for serverless environments
export async function generateInvoicePDFBufferServerless(invoice: InvoiceData): Promise<Buffer> {
  console.log('🔄 Serverless PDF Generation: Starting for invoice', invoice.invoiceNo);
  
  try {
    // Use jsPDF for serverless environments (no browser dependencies)
    const { generateInvoicePDFBufferJsPDF } = await import('@/lib/pdf-utils-jspdf');
    const pdfBuffer = await generateInvoicePDFBufferJsPDF(invoice);
    
    console.log('✅ Serverless PDF Generation: PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    return pdfBuffer;
  } catch (error) {
    console.error('❌ Serverless PDF Generation Error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

 