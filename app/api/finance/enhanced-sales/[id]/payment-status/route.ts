import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const { paymentReceived } = await request.json();
    const { id: saleId } = await params;

    const updatedSale = await prisma.enhancedSale.update({
      where: { id: saleId },
      data: { paymentReceived },
    });

    return NextResponse.json(updatedSale);
  } catch (error) {
    console.error('Update payment status error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
