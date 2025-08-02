// app/api/invoices/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

        // Use the consistent jsPDF generation method
        const { generateInvoicePDFBufferJsPDF } = await import('@/lib/pdf-utils-jspdf');
        const pdfBuffer = await generateInvoicePDFBufferJsPDF(invoice);
        
        // Set response headers for PDF download
        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        // Sanitize filename - replace slashes which are invalid in filenames
        const safeInvoiceNo = invoice.invoiceNo.replace(/\/|\?/g, '-');
        headers.set('Content-Disposition', `inline; filename="Invoice-${safeInvoiceNo}.pdf"`);

        // Return the PDF as the response
        return new NextResponse(pdfBuffer, {
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