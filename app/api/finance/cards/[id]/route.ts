import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { encryptCardNumber } from '@/lib/crypto';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }
    
    const resolvedParams = await params;
    const { name, cardNumber } = await request.json();
    const updateData: { name?: string; cardNumber?: string; last4?: string } = {};
    if (name) updateData.name = name;
    if (cardNumber) {
      updateData.cardNumber = encryptCardNumber(String(cardNumber));
      updateData.last4 = String(cardNumber).slice(-4);
    }
    const holder = await prisma.cardHolder.update({ 
      where: { id: resolvedParams.id }, 
      data: updateData,
      include: {
        transactions: {
          orderBy: { date: 'desc' }
        }
      }
    });
    return NextResponse.json(holder);
  } catch (error) {
    console.error('Update card holder error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }
    
    const resolvedParams = await params;
    await prisma.cardTransaction.deleteMany({ where: { cardId: resolvedParams.id } });
    await prisma.cardHolder.delete({ where: { id: resolvedParams.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete card holder error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}


