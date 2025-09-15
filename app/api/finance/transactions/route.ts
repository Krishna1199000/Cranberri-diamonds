import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { cardTransactionSchema } from '@/lib/validators/credit-card';
import { ZodError } from 'zod';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const body = await request.json();
    const validatedData = cardTransactionSchema.parse(body);

    // Calculate remaining balance
    const remainingBalance = validatedData.balance - validatedData.usedBalance;

    const transaction = await prisma.cardTransaction.create({
      data: {
        ...validatedData,
        date: new Date(validatedData.date),
        dueDate: new Date(validatedData.dueDate),
        emiDate: new Date(validatedData.emiDate),
        remainingBalance,
        cardId: body.cardId,
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');

    const transactions = await prisma.cardTransaction.findMany({
      where: cardId ? { cardId } : undefined,
      orderBy: { date: 'desc' },
      include: {
        cardHolder: {
          select: {
            name: true,
            last4: true,
          },
        },
      },
    });

    // Calculate totals
    const totals = transactions.reduce((acc, transaction) => {
      if (transaction.status === 'ACTIVE') {
        acc.totalBalance += transaction.balance;
        acc.totalUsed += transaction.usedBalance;
        acc.totalRemaining += transaction.remainingBalance;
      }
      return acc;
    }, {
      totalBalance: 0,
      totalUsed: 0,
      totalRemaining: 0,
    });

    return NextResponse.json({ transactions, totals });
  } catch (error) {
    console.error('Get transactions error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}