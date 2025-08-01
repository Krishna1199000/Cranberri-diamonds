import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Test PDF: Starting PDF generation test...');
    
    // Create a test invoice
    const testInvoice = {
      id: 'test-123',
      invoiceNo: 'TEST-001',
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      paymentTerms: 30,
      companyName: 'Test Company',
      addressLine1: '123 Test Street',
      addressLine2: null,
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      postalCode: '12345',
      description: 'Test invoice for PDF generation',
      amountInWords: 'One Thousand Dollars Only',
      subtotal: 1000,
      discount: 0,
      crPayment: 0,
      shipmentCost: 0,
      totalAmount: 1000,
      items: [
        {
          id: 'item-1',
          description: 'Test Diamond',
          carat: 1.0,
          color: 'D',
          clarity: 'VS1',
          lab: 'GIA',
          reportNo: 'TEST123456',
          pricePerCarat: 1000,
          total: 1000
        }
      ]
    };
    
    // Generate PDF using jsPDF
    const { generateInvoicePDFBufferJsPDF } = await import('@/lib/pdf-utils-jspdf');
    const pdfBuffer = await generateInvoicePDFBufferJsPDF(testInvoice);
    
    // Validate PDF
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Generated PDF buffer is empty');
    }
    
    const pdfHeader = pdfBuffer.slice(0, 4).toString('hex');
    const isValidPdf = pdfHeader === '25504446';
    
    console.log('🧪 Test PDF: PDF generation test completed');
    console.log('🧪 Test PDF: Buffer size:', pdfBuffer.length, 'bytes');
    console.log('🧪 Test PDF: PDF header:', pdfHeader);
    console.log('🧪 Test PDF: Is valid PDF:', isValidPdf);
    
    return NextResponse.json({
      success: true,
      message: 'PDF generation test completed',
      bufferSize: pdfBuffer.length,
      pdfHeader,
      isValidPdf,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test PDF: PDF generation test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 