import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const resolvedParams = await params;
    const data = await request.json();
    
    const {
      certificateNumber,
      date,
      customerName,
      salePriceINR,
      purchasePriceINR,
      employeePercent,
    } = data;

    // Try to find matching purchase if no manual purchase price provided
    let finalPurchasePrice = purchasePriceINR;
    let matchedPurchaseId: string | null = null;

    if (!finalPurchasePrice) {
      const matchedPurchase = await prisma.purchase.findFirst({
        where: {
          certificate: certificateNumber,
        },
        orderBy: {
          date: 'desc',
        },
      });

      if (matchedPurchase) {
        finalPurchasePrice = matchedPurchase.inrPrice;
        matchedPurchaseId = matchedPurchase.id;
      }
    }

    // Calculate profit/loss
    const grossProfit = salePriceINR - (finalPurchasePrice || 0);
    const employeeDeduction = grossProfit > 0 ? grossProfit * (employeePercent / 100) : 0;
    const finalProfit = grossProfit - employeeDeduction;

    const sale = await prisma.sale.update({
      where: { id: resolvedParams.id },
      data: {
        certificateNumber,
        date: new Date(date),
        customerName,
        salePriceINR,
        purchasePriceINR: finalPurchasePrice,
        employeePercent,
        grossProfitINR: grossProfit,
        employeeDeduction,
        finalProfitINR: finalProfit,
        matchedPurchaseId: matchedPurchaseId || null,
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Update sale error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const resolvedParams = await params;
    await prisma.sale.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Delete sale error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}


