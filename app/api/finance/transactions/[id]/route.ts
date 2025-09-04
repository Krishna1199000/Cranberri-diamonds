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
    const { date, balance, usedBalance, dueDate, emiDate, charges, note } = await request.json();
    
    if (!date || balance === undefined || usedBalance === undefined || !dueDate || !emiDate || charges === undefined) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const transaction = await prisma.cardTransaction.update({
      where: { id: resolvedParams.id },
      data: {
        date: new Date(date),
        balance: parseFloat(balance),
        usedBalance: parseFloat(usedBalance),
        dueDate: new Date(dueDate),
        emiDate: new Date(emiDate),
        charges: parseFloat(charges),
        note: note || null,
      },
      include: {
        cardHolder: {
          select: {
            id: true,
            name: true,
            last4: true
          }
        }
      }
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
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

    await prisma.cardTransaction.delete({
      where: { id: resolvedParams.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
