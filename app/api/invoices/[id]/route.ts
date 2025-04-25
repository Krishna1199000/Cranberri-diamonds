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