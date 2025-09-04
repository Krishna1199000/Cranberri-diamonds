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

    // Create CSV content
    const headers = [
      'Certificate Number',
      'Date',
      'Customer',
      'Sale Price (INR)',
      'Purchase Price (INR)',
      'Gross Profit (INR)',
      'Employee %',
      'Employee Deduction (INR)',
      'Final Profit (INR)',
      'Matched'
    ];

    const csvContent = [
      headers.join(','),
      ...salesWithRecalc.map(sale => [
        `"${sale.certificateNumber}"`,
        new Date(sale.date).toLocaleDateString('en-IN'),
        `"${sale.customerName}"`,
        sale.salePriceINR,
        sale.purchasePriceINR || 0,
        sale.grossProfitINR,
        sale.employeePercent,
        sale.employeeDeduction,
        sale.finalProfitINR,
        sale.matchedPurchaseId ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="profit-loss-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export sales error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}


