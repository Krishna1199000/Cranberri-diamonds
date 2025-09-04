import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }
    const resolvedParams = await params;
    const tx = await prisma.cardTransaction.findMany({
      where: { cardId: resolvedParams.id },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(tx);
  } catch (error) {
    console.error('Get transactions error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }
    const resolvedParams = await params;
    const { date, balance, usedBalance, dueDate, emiDate, charges, note } = await request.json();
    const tx = await prisma.cardTransaction.create({
      data: {
        cardId: resolvedParams.id,
        date: new Date(date),
        balance,
        usedBalance,
        dueDate: new Date(dueDate),
        emiDate: new Date(emiDate),
        charges,
        note,
      },
    });
    return NextResponse.json(tx);
  } catch (error) {
    console.error('Create transaction error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}




