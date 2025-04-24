// app/api/sales/[id]/profit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session || (session.role !== 'admin' && session.role !== 'employee')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { profit, profitMargin } = await request.json();
    
    if (typeof profit !== 'number' || isNaN(profit) || 
        typeof profitMargin !== 'number' || isNaN(profitMargin)) {
      return NextResponse.json(
        { success: false, message: 'Invalid profit values' },
        { status: 400 }
      );
    }
    
    const entry = await prisma.salesEntry.update({
      where: { id: params.id },
      data: { 
        profit: profit,
        profitMargin: profitMargin,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Error updating profit calculation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update profit calculation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}