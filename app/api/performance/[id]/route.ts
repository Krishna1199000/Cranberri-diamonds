import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    
    const report = await prisma.performanceReport.update({
      where: {
        id: params.id,
        userId: session.userId as string
      },
      data: {
        ...data,
        totalCalls: parseInt(data.totalCalls),
        totalEmails: parseInt(data.totalEmails),
        requirementsReceived: parseInt(data.requirementsReceived)
      }
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Error updating performance report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update report' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await prisma.performanceReport.delete({
      where: {
        id: params.id,
        userId: session.userId as string
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting performance report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete report' },
      { status: 500 }
    );
  }
}