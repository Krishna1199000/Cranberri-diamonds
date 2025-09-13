import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const resolvedParams = await params;
    const purchases = await prisma.purchase.findMany({
      where: {
        vendorId: resolvedParams.id,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error('Get purchases error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(
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
      date,
      companyName,
      contactPerson,
      mobileNumber,
      shape,
      color,
      clarity,
      lab,
      certificate,
      pricePerCaratUSD,
      totalPriceUSD,
      gstPercentage,
      gstAmountUSD,
      finalPriceUSD,
      dueDate,
      usdInrRate,
    } = data;
    
    // Use finalPriceUSD if provided, otherwise calculate it
    const finalPrice = finalPriceUSD || (totalPriceUSD + (gstAmountUSD || 0));
    const inrPrice = finalPrice * usdInrRate;

    const purchase = await prisma.purchase.create({
      data: {
        vendorId: resolvedParams.id,
        date: new Date(date),
        companyName,
        contactPerson,
        mobileNumber,
        shape,
        color,
        clarity,
        lab,
        certificate,
        pricePerCaratUSD,
        totalPriceUSD,
        gstPercentage: gstPercentage || 0,
        gstAmountUSD: gstAmountUSD || 0,
        finalPriceUSD: finalPrice,
        usdInrRate,
        inrPrice,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json(purchase);
  } catch (error) {
    console.error('Create purchase error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
