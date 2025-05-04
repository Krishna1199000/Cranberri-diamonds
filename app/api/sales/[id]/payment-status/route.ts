import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function PUT(
    request: NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    console.log(`PUT /api/sales/${resolvedParams.id}/payment-status - Request received`);
    try {
        const session = await getSession();
        console.log("Session data:", session);

        // --- Authorization: Only Admins can update payment status ---
        if (!session || session.role !== 'admin') {
            console.log('Unauthorized attempt to update payment status.');
            return NextResponse.json(
                { success: false, message: 'Unauthorized: Admin access required.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { paymentReceived } = body;

        // --- Basic Validation ---
        if (typeof paymentReceived !== 'boolean') {
            console.log('Invalid input: paymentReceived must be a boolean.', body);
            return NextResponse.json(
                { success: false, message: 'Invalid input: paymentReceived must be a boolean.' },
                { status: 400 }
            );
        }

        // --- Fetch Sale Entry to check existence ---
        const existingEntry = await prisma.salesEntry.findUnique({
            where: { id: resolvedParams.id },
        });

        if (!existingEntry) {
            console.log(`Sale entry not found: ${resolvedParams.id}`);
            return NextResponse.json(
                { success: false, message: 'Sale entry not found.' },
                { status: 404 }
            );
        }

        // --- Update the Sale Entry ---
        console.log(`Attempting to update payment status for ${resolvedParams.id} to ${paymentReceived}`);
        const updatedSaleEntry = await prisma.salesEntry.update({
            where: { id: resolvedParams.id },
            data: {
                paymentReceived: paymentReceived,
            },
        });
        console.log(`Payment status updated successfully for ${resolvedParams.id}`);

        return NextResponse.json({ success: true, updatedSaleEntry });

    } catch (error) {
        console.error(`Error updating payment status for sale ${resolvedParams?.id}:`, error);
        return NextResponse.json(
            { success: false, message: 'Internal server error while updating payment status.' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
        console.log(`PUT /api/sales/[id]/payment-status - Connection closed for ${resolvedParams?.id}`);
    }
} 