import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const payments = await prisma.vendorPayment.findMany({
      where: {
        vendor: {
          deletedAt: null, // Only include payments from non-deleted vendors
        },
      },
      include: {
        vendor: {
          select: {
            companyName: true,
            ownerName: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Get overview payments error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
