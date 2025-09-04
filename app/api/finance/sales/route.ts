import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const commission = parseFloat(searchParams.get('commission') || '2.0');

    const whereClause: {
      date?: { gte?: Date; lte?: Date };
    } = {};
    if (from || to) {
      whereClause.date = {};
      if (from) whereClause.date.gte = new Date(from);
      if (to) whereClause.date.lte = new Date(to + 'T23:59:59.999Z');
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc',
      },
    });

    // Recalculate with current commission percentage
    const salesWithRecalc = sales.map(sale => {
      const grossProfit = sale.salePriceINR - (sale.purchasePriceINR || 0);
      const employeeDeduction = grossProfit > 0 ? grossProfit * (commission / 100) : 0;
      const finalProfit = grossProfit - employeeDeduction;

      return {
        ...sale,
        grossProfitINR: grossProfit,
        employeeDeduction,
        finalProfitINR: finalProfit,
      };
    });

    // Calculate stats
    const stats = {
      totalSales: salesWithRecalc.reduce((sum, sale) => sum + sale.salePriceINR, 0),
      totalPurchases: salesWithRecalc.reduce((sum, sale) => sum + (sale.purchasePriceINR || 0), 0),
      grossProfit: salesWithRecalc.reduce((sum, sale) => sum + sale.grossProfitINR, 0),
      employeeDeductions: salesWithRecalc.reduce((sum, sale) => sum + sale.employeeDeduction, 0),
      netProfit: salesWithRecalc.reduce((sum, sale) => sum + sale.finalProfitINR, 0),
      matchedCertificates: salesWithRecalc.filter(sale => sale.matchedPurchaseId).length,
      unmatchedSales: salesWithRecalc.filter(sale => !sale.matchedPurchaseId).length,
    };

    return NextResponse.json({ sales: salesWithRecalc, stats });
  } catch (error) {
    console.error('Get sales error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

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
          vendor: {
            deletedAt: null // Only match with purchases from non-deleted vendors
          }
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

    const sale = await prisma.sale.create({
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
    console.error('Create sale error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}


