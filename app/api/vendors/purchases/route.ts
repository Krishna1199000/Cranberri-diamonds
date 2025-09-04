import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const purchases = await prisma.purchase.findMany({
      where: {
        vendor: {
          deletedAt: null // Only include purchases from non-deleted vendors
        }
      },
      include: {
        vendor: {
          select: {
            companyName: true
          }
        }
      },
      orderBy: { date: 'desc' },
    });

    // Format the data for the dropdown
    const formattedPurchases = purchases.map(purchase => ({
      id: purchase.id,
      certificate: purchase.certificate,
      companyName: purchase.vendor.companyName,
      shape: purchase.shape,
      color: purchase.color,
      clarity: purchase.clarity,
      lab: purchase.lab,
      pricePerCaratUSD: purchase.pricePerCaratUSD,
      totalPriceUSD: purchase.totalPriceUSD,
      usdInrRate: purchase.usdInrRate,
      inrPrice: purchase.inrPrice,
    }));

    return NextResponse.json(formattedPurchases);
  } catch (error) {
    console.error('Get vendor purchases error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
