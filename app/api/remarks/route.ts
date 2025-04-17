import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Debug cookie information
    const cookieHeader = request.headers.get('cookie');
    console.log('Cookie header in API route:', cookieHeader);
    
    const session = await getSession();
    console.log('Session from getSession in API route:', session);
    
    if (!session || !session.userId || typeof session.userId !== 'string') {
      console.log('Unauthorized: No valid session found');
      return NextResponse.json(
        { success: false, message: 'Unauthorized: No valid session found' },
        { status: 401 }
      );
    }

    const { content, shipmentId } = await request.json();
    console.log('Creating remark with data:', { content, shipmentId, userId: session.userId });
    
    const remark = await prisma.remark.create({
      data: {
        content,
        shipmentId,
        userId: session.userId,
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

    console.log('Remark created successfully:', remark);
    return NextResponse.json({ success: true, remark });
  } catch (error) {
    console.error('Error creating remark:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create remark: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shipmentId = searchParams.get('shipmentId');
    console.log('Fetching remarks for shipmentId:', shipmentId);

    if (!shipmentId) {
      console.log('Shipment ID is required');
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

    console.log(`Found ${remarks.length} remarks for shipment ${shipmentId}`);
    return NextResponse.json({ success: true, remarks });
  } catch (error) {
    console.error('Error fetching remarks:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch remarks: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}