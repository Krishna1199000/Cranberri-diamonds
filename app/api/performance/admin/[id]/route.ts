import { NextResponse,NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params; 
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    const report = await prisma.performanceReport.update({
      where: {
        id: resolvedParams.id
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

export async function DELETE(request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params; 
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await prisma.performanceReport.delete({
      where: {
        id: resolvedParams.id
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