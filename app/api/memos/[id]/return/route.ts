import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoId } = await params;
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get admin user info for audit trail
    const adminUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true }
    });

    // Update memo status and record return information.
    // If migration isn't applied yet, return a clear actionable message.
    let updatedMemo;
    try {
      updatedMemo = await prisma.memo.update({
        where: { id: memoId },
        data: {
          memoStatus: 'RETURNED',
          returnDate: new Date(),
          processedBy: adminUser?.name || adminUser?.email || 'Admin'
        },
        select: {
          id: true,
          memoNo: true,
          memoStatus: true,
          companyName: true,
          totalAmount: true,
          date: true,
          returnDate: true,
          processedBy: true,
        }
      });
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Memo return columns are not available yet. Run Prisma migration and regenerate client, then retry.'
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      memo: updatedMemo,
      message: `Memo ${updatedMemo.memoNo} marked as returned successfully`
    });

  } catch (error) {
    console.error('Error marking memo as returned:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to mark memo as returned' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}