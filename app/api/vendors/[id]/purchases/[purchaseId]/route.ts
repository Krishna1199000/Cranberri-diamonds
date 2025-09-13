import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// Function to fetch USD to INR exchange rate
import { getFreshUSDToINRRate } from '@/lib/exchangeRate';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; purchaseId: string }> }
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

    const purchase = await prisma.purchase.update({
      where: { id: resolvedParams.purchaseId },
      data: {
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
    console.error('Update purchase error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; purchaseId: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const resolvedParams = await params;
    await prisma.purchase.delete({
      where: { id: resolvedParams.purchaseId },
    });

    return NextResponse.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    console.error('Delete purchase error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
