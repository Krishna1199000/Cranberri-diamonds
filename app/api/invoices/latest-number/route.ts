import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Fetch the invoice with the highest creation date
        const latestInvoice = await prisma.invoice.findFirst({
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                invoiceNo: true,
                createdAt: true
            }
        });

        const latestInvoiceNo = latestInvoice?.invoiceNo || null;

        console.log('[Latest Invoice API] Latest invoice found:', {
            invoiceNo: latestInvoiceNo,
            createdAt: latestInvoice?.createdAt
        });

        // Add cache-control headers to prevent caching
        const headers = new Headers();
        headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        headers.set('Pragma', 'no-cache');
        headers.set('Expires', '0');

        return NextResponse.json({ lastInvoiceNo: latestInvoiceNo }, { headers });

    } catch (error) {
        console.error('Error fetching latest invoice number:', error);
        return NextResponse.json({ error: 'Failed to fetch latest invoice number' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
