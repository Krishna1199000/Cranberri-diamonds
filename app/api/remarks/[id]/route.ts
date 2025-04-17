import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { content } = await request.json();
    
    const remark = await prisma.remark.update({
      where: {
        id: resolvedParams.id
      },
      data: { content },
      include: {
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, remark });
  } catch (error) {
    console.error('Error updating remark:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update remark' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await prisma.remark.delete({
      where: {
        id: resolvedParams.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting remark:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete remark' },
      { status: 500 }
    );
  }
}