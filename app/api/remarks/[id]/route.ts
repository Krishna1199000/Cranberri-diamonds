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
    // Debug cookie information
    const cookieHeader = request.headers.get('cookie');
    console.log('Cookie header in PUT route:', cookieHeader);
    
    const session = await getSession();
    console.log('Session from getSession in PUT route:', session);
    
    if (!session || !session.userId) {
      console.log('Unauthorized: No valid session found');
      return NextResponse.json(
        { success: false, message: 'Unauthorized: No valid session found' },
        { status: 401 }
      );
    }

    // Continue only if admin or if user is editing their own remark
    const remark = await prisma.remark.findUnique({
      where: { id: resolvedParams.id },
      include: { user: true }
    });

    if (!remark) {
      return NextResponse.json(
        { success: false, message: 'Remark not found' },
        { status: 404 }
      );
    }

    // Check if user is admin or the owner of the remark
    if (session.role !== 'admin' && remark.userId !== session.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You can only edit your own remarks' },
        { status: 403 }
      );
    }

    const { content } = await request.json();
    console.log('Updating remark with data:', { id: resolvedParams.id, content });
    
    const updatedRemark = await prisma.remark.update({
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

    console.log('Remark updated successfully:', updatedRemark);
    return NextResponse.json({ success: true, remark: updatedRemark });
  } catch (error) {
    console.error('Error updating remark:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update remark: ' + (error instanceof Error ? error.message : 'Unknown error') },
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
    // Debug cookie information
    const cookieHeader = request.headers.get('cookie');
    console.log('Cookie header in DELETE route:', cookieHeader);
    
    const session = await getSession();
    console.log('Session from getSession in DELETE route:', session);
    
    if (!session || !session.userId) {
      console.log('Unauthorized: No valid session found');
      return NextResponse.json(
        { success: false, message: 'Unauthorized: No valid session found' },
        { status: 401 }
      );
    }

    // Continue only if admin or if user is deleting their own remark
    const remark = await prisma.remark.findUnique({
      where: { id: resolvedParams.id },
      include: { user: true }
    });

    if (!remark) {
      return NextResponse.json(
        { success: false, message: 'Remark not found' },
        { status: 404 }
      );
    }

    // Check if user is admin or the owner of the remark
    if (session.role !== 'admin' && remark.userId !== session.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You can only delete your own remarks' },
        { status: 403 }
      );
    }

    console.log('Deleting remark:', resolvedParams.id);
    await prisma.remark.delete({
      where: {
        id: resolvedParams.id
      }
    });

    console.log('Remark deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting remark:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete remark: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}