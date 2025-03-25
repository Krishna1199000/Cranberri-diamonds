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

    const companies = await prisma.shipment.findMany({
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