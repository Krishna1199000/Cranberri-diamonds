// app/api/sales/[id]/purchase-value/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Properly access the id from context params
    const id = resolvedParams.id;
    
    const session = await getSession();
    
    if (!session || (session.role !== 'admin' && session.role !== 'employee')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { purchaseValue } = await request.json();
    
    if (typeof purchaseValue !== 'number' || isNaN(purchaseValue)) {
      return NextResponse.json(
        { success: false, message: 'Invalid purchase value' },
        { status: 400 }
      );
    }
    
    const entry = await prisma.salesEntry.update({
      where: { id },
      data: { 
        purchaseValue: purchaseValue,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Error updating purchase value:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update purchase value' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}