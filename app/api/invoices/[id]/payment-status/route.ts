import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { paymentStatus } = await request.json();

    if (!paymentStatus || !['PENDING', 'PAYMENT_RECEIVED'].includes(paymentStatus)) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment status' },
        { status: 400 }
      );
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { paymentStatus },
      select: {
        id: true,
        invoiceNo: true,
        paymentStatus: true,
        companyName: true,
        totalAmount: true,
        dueDate: true,
      }
    });

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      message: `Payment status updated to ${paymentStatus.replace('_', ' ').toLowerCase()}`
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update payment status' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}