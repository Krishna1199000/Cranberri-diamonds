import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

import { getFreshUSDToINRRate } from '@/lib/exchangeRate';

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
    const payments = await prisma.vendorPayment.findMany({
      where: {
        vendorId: resolvedParams.id,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
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
      amountINR,
      amountUSD,
      mode,
      note,
    } = data;

    let amountInInr = amountINR as number | undefined;
    if (!amountInInr && amountUSD) {
      const rate = await getFreshUSDToINRRate();
      amountInInr = (amountUSD as number) * rate;
    }

    if (!amountInInr || amountInInr <= 0) {
      return new NextResponse('Invalid amount', { status: 400 });
    }

    const payment = await prisma.vendorPayment.create({
      data: {
        vendorId: resolvedParams.id,
        date: new Date(date),
        amountINR: amountInInr,
        mode,
        note,
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
