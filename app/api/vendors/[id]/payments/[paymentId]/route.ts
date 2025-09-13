import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getFreshUSDToINRRate } from '@/lib/exchangeRate';


export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
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

    const payment = await prisma.vendorPayment.update({
      where: { id: resolvedParams.paymentId },
      data: {
        date: new Date(date),
        amountINR: amountInInr,
        mode,
        note,
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Update payment error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const resolvedParams = await params;
    await prisma.vendorPayment.delete({
      where: { id: resolvedParams.paymentId },
    });

    return NextResponse.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Delete payment error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
