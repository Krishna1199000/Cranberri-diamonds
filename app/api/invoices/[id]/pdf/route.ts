// app/api/invoices/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: params.id
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers for PDF download
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNo}.pdf"`);
    
    // Buffer to store the PDF data
    const chunks: Buffer[] = [];
    
    // Collect PDF data
    doc.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    // When PDF is finished, return it as response
    const response = new Promise<NextResponse>((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(new NextResponse(pdfBuffer, {
          status: 200,
          headers
        }));
      });
    });
    
    // Generate PDF content
    generateInvoicePDF(doc, invoice);
    doc.end();
    
    return await response;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

function generateInvoicePDF(doc: PDFKit.PDFDocument, invoice: any) {
  // Header
  doc.fontSize(20).text('INVOICE', { align: 'center' });
  doc.moveDown();
  
  // Invoice details
  doc.fontSize(12);
  doc.text(`Invoice No: ${invoice.invoiceNo}`);
  doc.text(`Date: ${invoice.date.toLocaleDateString()}`);
  doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`);
  doc.moveDown();
  
  // Company details
  doc.text('From: Crystal Diamonds');
  doc.text('123 Diamond Street');
  doc.text('Surat, Gujarat 395007');
  doc.text('India');
  doc.moveDown();
  
  // Customer details
  doc.text('Bill To:');
  doc.text(invoice.companyName);
  doc.text(invoice.addressLine1);
  if (invoice.addressLine2) doc.text(invoice.addressLine2);
  doc.text(`${invoice.city}, ${invoice.state} ${invoice.postalCode}`);
  doc.text(invoice.country);
  doc.moveDown();
  
  // Description
  if (invoice.description) {
    doc.text('Description:');
    doc.text(invoice.description);
    doc.moveDown();
  }
  
  // Item table
  doc.text('Diamond Details:', { underline: true });
  doc.moveDown(0.5);
  
  // Table headers
  const tableTop = doc.y;
  const itemX = 50;
  const caratX = 200;
  const colorX = 250;
  const clarityX = 300;
  const labX = 350;
  const reportX = 400;
  const amountX = 480;
  
  doc.text('Description', itemX, tableTop);
  doc.text('Carat', caratX, tableTop);
  doc.text('Color', colorX, tableTop);
  doc.text('Clarity', clarityX, tableTop);
  doc.text('Lab', labX, tableTop);
  doc.text('Report #', reportX, tableTop);
  doc.text('Amount', amountX, tableTop);
  
  doc.moveDown();
  const itemTableY = doc.y;
  
  // Item row
  doc.text(invoice.description || 'Diamond', itemX, itemTableY);
  doc.text(invoice.carat.toString(), caratX, itemTableY);
  doc.text(invoice.color, colorX, itemTableY);
  doc.text(invoice.clarity, clarityX, itemTableY);
  doc.text(invoice.lab, labX, itemTableY);
  doc.text(invoice.reportNo, reportX, itemTableY);
  doc.text(`$${invoice.totalAmount.toFixed(2)}`, amountX, itemTableY);
  
  doc.moveDown(2);
  
  // Total
  doc.text(`Total Amount: $${invoice.totalAmount.toFixed(2)}`, { align: 'right' });
  doc.text(`Amount in Words: ${invoice.amountInWords}`, { align: 'right' });
  
  doc.moveDown(2);
  
  // Payment details
  doc.text('Account Details:');
  doc.text('Bank Name: ICICI Bank');
  doc.text('Account Name: Crystal Diamonds');
  doc.text('Account Number: 123456789012');
  doc.text('IFSC Code: ICIC0001234');
  doc.text('Swift Code: ICICI123');
  
  doc.moveDown(2);
  
  // Signatures
  doc.text('Customer Signature', 100, 700);
  doc.text('For Crystal Diamonds', 400, 700);
  
  doc.moveDown(3);
  
  // Footer
  doc.fontSize(10).text('Thank you for your business!', { align: 'center' });
  doc.text('This is a computer-generated invoice. No signature required.', { align: 'center' });
}