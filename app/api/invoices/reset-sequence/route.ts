import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
    try {
        // Find the latest invoice and update its number to start from 103
        const latestInvoice = await prisma.invoice.findFirst({
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (latestInvoice) {
            // Update the latest invoice to have number 102 so next one will be 103
            const resetNumber = 'CD-0102A/3107'; // This will make the next invoice 103
            
            await prisma.invoice.update({
                where: { id: latestInvoice.id },
                data: { invoiceNo: resetNumber }
            });

            console.log('[Reset Sequence] Updated latest invoice to:', resetNumber);
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Invoice sequence reset to start from 103',
            nextInvoiceNumber: 'CD-0103A/3107'
        });

    } catch (error) {
        console.error('Error resetting invoice sequence:', error);
        return NextResponse.json({ error: 'Failed to reset invoice sequence' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
} 