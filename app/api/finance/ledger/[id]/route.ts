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
    
    const {
      date,
      type,
      amountINR,
      reason,
      counterparty,
    } = data;

    const entry = await prisma.ledgerEntry.update({
      where: { id: resolvedParams.id },
      data: {
        date: new Date(date),
        type,
        amountINR,
        reason,
        counterparty,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Update ledger entry error:', error);
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
    await prisma.ledgerEntry.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Delete ledger entry error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}


