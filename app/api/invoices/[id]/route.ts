import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient} from '@prisma/client';
 // Import getSession

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    try {
       
        const invoice = await prisma.invoice.findUnique({
            where: { id: resolvedParams.id },
            include: { 
                items: true, // Include related items
                user: { // Optionally include user details if needed
                    select: { id: true, name: true, email: true }
                }
            }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
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

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    const invoiceId = resolvedParams.id;

    try {
        // Optional: Add session/authorization check if needed
        // const session = await getSession();
        // if (!session || session.role !== 'admin') { // Example: Only allow admins
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        // }

        // Use a transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // 1. Delete associated InvoiceItems first
            await tx.invoiceItem.deleteMany({
                where: { invoiceId: invoiceId },
            });

            // 2. Delete the Invoice itself
            await tx.invoice.delete({
                where: { id: invoiceId },
            });
        });

        console.log(`Successfully deleted invoice and associated items: ${invoiceId}`);
        return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error deleting invoice ${invoiceId}:`, errorMessage);
        
        // Check if the error is because the invoice didn't exist (e.g., from delete operation failing)
        // Prisma might throw a specific error code (P2025) if record to delete is not found
       
        
        // Handle other potential errors (like db connection issues, etc.)
        // The previous constraint error check might be less relevant now as we delete items first
        return NextResponse.json({ error: `Failed to delete invoice: ${errorMessage}` }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
} 