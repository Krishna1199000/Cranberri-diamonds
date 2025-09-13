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
    
    // Handle optional fields
    const cardName = name || '';
    const cardNum = cardNumber || '';
    const last4 = cardNum ? String(cardNum).slice(-4) : '';
    const encrypted = cardNum ? encryptCardNumber(String(cardNum)) : '';

    const holder = await prisma.cardHolder.create({
      data: {
        name: cardName,
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


