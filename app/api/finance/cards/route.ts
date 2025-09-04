import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { encryptCardNumber } from '@/lib/crypto';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const holders = await prisma.cardHolder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        transactions: {
          orderBy: { date: 'desc' }
        }
      }
    });
    return NextResponse.json(holders);
  } catch (error) {
    console.error('Get card holders error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const { name, cardNumber } = await request.json();
    if (!name || !cardNumber) {
      return new NextResponse('Missing fields', { status: 400 });
    }
    const last4 = String(cardNumber).slice(-4);
    const encrypted = encryptCardNumber(String(cardNumber));

    const holder = await prisma.cardHolder.create({
      data: {
        name,
        cardNumber: encrypted,
        last4,
      },
      include: {
        transactions: {
          orderBy: { date: 'desc' }
        }
      }
    });
    return NextResponse.json(holder);
  } catch (error) {
    console.error('Create card holder error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}


