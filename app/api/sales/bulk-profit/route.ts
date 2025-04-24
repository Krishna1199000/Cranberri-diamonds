// app/api/sales/bulk-profit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || (session.role !== 'admin' && session.role !== 'employee')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { entries } = await request.json();
    
    if (!Array.isArray(entries)) {
      return NextResponse.json(
        { success: false, message: 'Invalid entries data' },
        { status: 400 }
      );
    }
    
    // Perform bulk update using transaction
    const results = await prisma.$transaction(
      entries.map(entry => 
        prisma.salesEntry.update({
          where: { id: entry.id },
          data: {
            profit: entry.profit,
            profitMargin: entry.profitMargin,
            updatedAt: new Date()
          }
        })
      )
    );

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${results.length} entries`
    });
  } catch (error) {
    console.error('Error updating profit calculations in bulk:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update profit calculations' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}