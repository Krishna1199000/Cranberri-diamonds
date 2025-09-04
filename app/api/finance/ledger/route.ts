import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { EntryType } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const type = searchParams.get('type');

    const whereClause: {
      date?: { gte?: Date; lte?: Date };
      type?: EntryType;
    } = {};
    if (from || to) {
      whereClause.date = {};
      if (from) whereClause.date.gte = new Date(from);
      if (to) whereClause.date.lte = new Date(to + 'T23:59:59.999Z');
    }
    if (type && type !== 'all') {
      whereClause.type = type as EntryType;
    }

    const entries = await prisma.ledgerEntry.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc',
      },
    });

    // Calculate stats - always get total values regardless of filter
    const allEntries = await prisma.ledgerEntry.findMany();
    const stats = {
      totalCredit: allEntries
        .filter(entry => entry.type === 'CREDIT')
        .reduce((sum, entry) => sum + entry.amountINR, 0),
      totalDebit: allEntries
        .filter(entry => entry.type === 'DEBIT')
        .reduce((sum, entry) => sum + entry.amountINR, 0),
      netAmount: 0,
    };
    stats.netAmount = stats.totalCredit - stats.totalDebit;

    return NextResponse.json({ entries, stats });
  } catch (error) {
    console.error('Get ledger entries error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const data = await request.json();
    
    const {
      date,
      type,
      amountINR,
      reason,
      counterparty,
    } = data;

    const entry = await prisma.ledgerEntry.create({
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
    console.error('Create ledger entry error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

