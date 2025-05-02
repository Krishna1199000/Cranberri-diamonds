import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient} from '@prisma/client';
import { getSession } from '@/lib/session'; // Import getSession

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    try {
    
        const session = await getSession();
    
        const userRole = session?.role as string | undefined;

        if (!session?.userId || !userRole) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        
        const invoice = await prisma.invoice.findUnique({
            where: { id: resolvedParams.id },
            include: { 
                items: true,
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Authorization check: Allow admins OR if employee owns the invoice
        if (userRole !== 'admin' && invoice.userId !== resolvedParams.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Add no-cache headers similar to other GET routes
        const headers = new Headers();
        headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        headers.set('Pragma', 'no-cache');
        headers.set('Expires', '0');

        return NextResponse.json({ invoice }, { headers });

    } catch (error) {
        console.error(`Error fetching invoice ${resolvedParams.id}:`, error);
        return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

interface InvoiceItem {
    description: string;
    carat: number;
    color: string;
    clarity: string;
    lab: string;
    reportNo: string;
    pricePerCarat: number;
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    try {
        const session = await getSession();
        const userRole = session?.role as string | undefined;

        // Authorization check: Only allow admins to update invoices
        if (userRole !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Only admins can update invoices' }, { status: 403 });
        }

        // Check if invoice exists before attempting update
        const existingInvoice = await prisma.invoice.findUnique({
            where: { id: resolvedParams.id },
            include: { items: true }
        });

        if (!existingInvoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        const body = await request.json();

        // Transaction to handle updates to invoice and its items
        await prisma.$transaction(async (tx) => {
            // Delete existing items to replace with updated ones
            await tx.invoiceItem.deleteMany({
                where: { invoiceId: resolvedParams.id }
            });

            // Update the invoice data
            await tx.invoice.update({
                where: { id: resolvedParams.id },
                data: {
                    date: body.date,
                    dueDate: body.dueDate,
                    paymentTerms: Number(body.paymentTerms) || 0,
                    description: body.description || "",
                    discount: Number(body.discount) || 0,
                    crPayment: Number(body.crPayment) || 0,
                    shipmentCost: Number(body.shipmentCost) || 0,
                    // Calculate subtotal from items
                    subtotal: body.items.reduce((sum: number, item: { carat: number; pricePerCarat: number }) => {
                        const itemTotal = (Number(item.carat) || 0) * (Number(item.pricePerCarat) || 0);
                        return sum + itemTotal;
                    }, 0),
                    // Calculate total amount
                    totalAmount: body.items.reduce((sum: number, item: InvoiceItem) => {
                        const itemTotal = (Number(item.carat) || 0) * (Number(item.pricePerCarat) || 0);
                        return sum + itemTotal;
                    }, 0) - Number(body.discount || 0) - Number(body.crPayment || 0) + Number(body.shipmentCost || 0),
                    // Create the updated invoice items
                    items: {
                        create: body.items.map((item: InvoiceItem) => ({
                            description: item.description,
                            carat: Number(item.carat) || 0,
                            color: item.color,
                            clarity: item.clarity,
                            lab: item.lab,
                            reportNo: item.reportNo,
                            pricePerCarat: Number(item.pricePerCarat) || 0,
                            total: Number(((Number(item.carat) || 0) * (Number(item.pricePerCarat) || 0)).toFixed(2))
                        }))
                    }
                },
                include: { items: true }
            });
        });

        // Fetch the updated invoice to return
        const updatedInvoice = await prisma.invoice.findUnique({
            where: { id: resolvedParams.id },
            include: { items: true }
        });

        return NextResponse.json({ 
            message: 'Invoice updated successfully',
            invoice: updatedInvoice 
        });

    } catch (error) {
        console.error(`Error updating invoice ${resolvedParams.id}:`, error);
        return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function DELETE(
    req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    try {
        const session = await getSession();
        const userRole = session?.role as string | undefined;

        // Authorization check: Only allow admins to delete
        if (userRole !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Only admins can delete invoices' }, { status: 403 });
        }

        // Check if invoice exists before attempting deletion
        const existingInvoice = await prisma.invoice.findUnique({
            where: { id: resolvedParams.id },
        });

        if (!existingInvoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        await prisma.invoice.delete({
            where: { id: resolvedParams.id },
        });

        return NextResponse.json({ message: 'Invoice deleted successfully' });

    } catch (error) {
        console.error(`Error deleting invoice ${resolvedParams.id}:`, error);
        return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}