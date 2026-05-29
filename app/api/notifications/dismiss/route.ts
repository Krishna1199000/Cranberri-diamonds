import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

function parseEntityId(notificationId: string, type: 'invoice' | 'memo'): string {
  const prefix = `${type}-`;
  if (notificationId.startsWith(prefix)) {
    return notificationId.slice(prefix.length);
  }
  return notificationId;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required for permanent dismissal' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { notificationId, type } = body;

    if (!notificationId || !type || !['invoice', 'memo'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid notification ID or type' },
        { status: 400 }
      );
    }

    const entityId = parseEntityId(notificationId, type);

    if (type === 'invoice') {
      const updatedInvoice = await prisma.invoice.update({
        where: { id: entityId },
        data: { paymentStatus: 'PAYMENT_RECEIVED' },
        select: {
          id: true,
          invoiceNo: true,
          companyName: true,
          totalAmount: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Invoice ${updatedInvoice.invoiceNo} marked as payment received — notification permanently dismissed`,
        invoice: updatedInvoice,
      });
    }

    let updatedMemo;
    try {
      updatedMemo = await prisma.memo.update({
        where: { id: entityId },
        data: {
          memoStatus: 'RETURNED',
          returnDate: new Date(),
          processedBy: session.userId,
        },
        select: {
          id: true,
          memoNo: true,
          companyName: true,
          totalAmount: true,
        },
      });
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            'Memo return columns are not available yet. Run Prisma migration and regenerate client, then retry.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Memo ${updatedMemo.memoNo} marked as returned — notification permanently dismissed`,
      memo: updatedMemo,
    });
  } catch (error) {
    console.error('Error permanently dismissing notification:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to permanently dismiss notification',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
