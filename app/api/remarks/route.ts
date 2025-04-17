import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || typeof session.id !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { content, shipmentId } = await request.json();
    
    const remark = await prisma.remark.create({
      data: {
        content,
        shipmentId,
        userId: session.id,
      },
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
    console.error('Error creating remark:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create remark' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shipmentId = searchParams.get('shipmentId');

    if (!shipmentId) {
      return NextResponse.json(
        { success: false, message: 'Shipment ID is required' },
        { status: 400 }
      );
    }

    const remarks = await prisma.remark.findMany({
      where: { shipmentId },
      include: {
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, remarks });
  } catch (error) {
    console.error('Error fetching remarks:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch remarks' },
      { status: 500 }
    );
  }
}