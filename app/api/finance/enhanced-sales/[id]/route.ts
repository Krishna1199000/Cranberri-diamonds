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
    

    
    const sale = await prisma.enhancedSale.update({
      where: { id: resolvedParams.id },
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
    console.error('Update enhanced sale error:', error);
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

    await prisma.enhancedSale.delete({
      where: { id: resolvedParams.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Delete enhanced sale error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
