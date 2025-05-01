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