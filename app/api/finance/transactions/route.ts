import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const transactions = await prisma.cardTransaction.findMany({
      include: {
        cardHolder: {
          select: {
            id: true,
            name: true,
            last4: true
          }
        }
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const { date, balance, usedBalance, dueDate, emiDate, charges, note, cardId } = await request.json();
    
    if (!date || balance === undefined || usedBalance === undefined || !dueDate || !emiDate || charges === undefined || !cardId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const transaction = await prisma.cardTransaction.create({
      data: {
        date: new Date(date),
        balance: parseFloat(balance),
        usedBalance: parseFloat(usedBalance),
        dueDate: new Date(dueDate),
        emiDate: new Date(emiDate),
        charges: parseFloat(charges),
        note: note || null,
        cardId,
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
    console.error('Create transaction error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
