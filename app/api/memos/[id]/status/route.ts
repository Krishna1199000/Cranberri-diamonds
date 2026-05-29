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

    const { memoStatus } = await request.json();

    if (!memoStatus || !['ACTIVE', 'RETURNED', 'DISMISSED'].includes(memoStatus)) {
      return NextResponse.json(
        { success: false, message: 'Invalid memo status' },
        { status: 400 }
      );
    }

    const existingMemo = await prisma.memo.findUnique({
      where: { id: id },
      select: { id: true, memoStatus: true, memoNo: true },
    });

    if (!existingMemo) {
      return NextResponse.json(
        { success: false, message: 'Memo not found' },
        { status: 404 }
      );
    }

    if (existingMemo.memoStatus === 'RETURNED') {
      return NextResponse.json(
        {
          success: false,
          message:
            'Returned memos are permanent audit records. Status cannot be changed. Use Return History to view the record.',
        },
        { status: 403 }
      );
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true },
    });

    const updateData: {
      memoStatus: typeof memoStatus;
      returnDate?: Date;
      processedBy?: string;
    } = { memoStatus };

    if (memoStatus === 'RETURNED') {
      updateData.returnDate = new Date();
      updateData.processedBy = adminUser?.name || adminUser?.email || 'Admin';
    }

    const updatedMemo = await prisma.memo.update({
      where: { id: id },
      data: updateData,
      select: {
        id: true,
        memoNo: true,
        memoStatus: true,
        companyName: true,
        totalAmount: true,
        date: true,
        memoTerms: true,
        returnDate: true,
        processedBy: true,
      },
    });

    return NextResponse.json({
      success: true,
      memo: updatedMemo,
      message: `Memo status updated to ${memoStatus.toLowerCase()}`,
    });
  } catch (error) {
    console.error('Error updating memo status:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update memo status',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
