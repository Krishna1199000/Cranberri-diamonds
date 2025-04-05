import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only fetch companies created by the current employee if they're not an admin
    const companies = await prisma.shipment.findMany({
      where: session.role === 'employee' ? {
        userId: session.userId as string
      } : undefined,
      select: {
        id: true,
        companyName: true
      },
      distinct: ['companyName'],
      orderBy: {
        companyName: 'asc'
      }
    });

    return NextResponse.json({ success: true, companies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}