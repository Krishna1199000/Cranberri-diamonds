import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const prices = await prisma.parcelGoods.findMany({
      orderBy: {
        sieve: 'asc'
      }
    });

    return NextResponse.json({ success: true, prices });
  } catch (error) {
    console.error('Error fetching parcel goods prices:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch prices' },
      { status: 500 }
    ); // Fixed syntax error - removed extra curly brace
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    
    const price = await prisma.parcelGoods.create({
      data: {
        sieve: data.sieve,
        price: parseFloat(data.price)
      }
    });

    return NextResponse.json({ success: true, price });
  } catch (error) {
    console.error('Error creating parcel goods price:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create price' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}