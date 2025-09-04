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
    const minProfit = searchParams.get('minProfit');
    const maxProfit = searchParams.get('maxProfit');

    const whereClause: {
      date?: { gte?: Date; lte?: Date };
      finalProfit?: { gte?: number; lte?: number };
    } = {};
    if (from || to) {
      whereClause.date = {};
      if (from) whereClause.date.gte = new Date(from);
      if (to) whereClause.date.lte = new Date(to + 'T23:59:59.999Z');
    }
    if (minProfit || maxProfit) {
      whereClause.finalProfit = {};
      if (minProfit) whereClause.finalProfit.gte = parseFloat(minProfit);
      if (maxProfit) whereClause.finalProfit.lte = parseFloat(maxProfit);
    }

    const sales = await prisma.enhancedSale.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Get enhanced sales error:', error);
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
    

    
    const sale = await prisma.enhancedSale.create({
      data: {
        date: new Date(data.date),
        companyName: data.companyName,
        ownerName: data.ownerName,
        vendorCompany: data.vendorCompany,
        shape: data.shape,
        carat: data.carat,
        color: data.color,
        clarity: data.clarity,
        lab: data.lab,
        certificateNumber: data.certificateNumber,
        totalPriceSoldINR: data.totalPriceSoldINR,
        totalPricePurchasedINR: data.totalPricePurchasedINR,
        // gstPercentage: gstPercentage,
        // gstAmountINR: gstAmountINR,
        // finalSalePriceINR: finalSalePriceINR,
        shippingCharge: data.shippingCharge,
        employeeProfitPercent: data.employeeProfitPercent,
        finalProfit: data.finalProfit,
        dueDate: new Date(data.dueDate),
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Create enhanced sale error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
