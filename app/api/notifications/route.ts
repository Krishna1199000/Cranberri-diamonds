import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isOverdue(expiryDate: Date, currentDateOnly: Date): boolean {
  return currentDateOnly > toDateOnly(expiryDate);
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json(
        { success: false, notifications: [], message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.role !== 'admin' && session.role !== 'employee') {
      return NextResponse.json({ success: true, notifications: [] });
    }

    const isEmployee = session.role === 'employee';
    const ownerFilter = isEmployee ? { userId: session.userId } : {};

    const currentDate = new Date();
    const currentDateOnly = toDateOnly(currentDate);
    const notifications: Array<{
      id: string;
      type: 'invoice' | 'memo';
      title: string;
      clientName: string;
      documentNumber: string;
      stoneSummary: string;
      issueDate: Date;
      daysOverdue: number;
      amount: number;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    const invoiceDelegate = prisma.invoice as unknown as {
      findMany: (args: unknown) => Promise<unknown[]>;
    };
    let pendingInvoices: unknown[] = [];
    try {
      pendingInvoices = await invoiceDelegate.findMany({
        where: { paymentStatus: 'PENDING', ...ownerFilter },
        select: {
          id: true,
          invoiceNo: true,
          companyName: true,
          totalAmount: true,
          date: true,
          dueDate: true,
          items: {
            select: {
              description: true,
              carat: true,
              color: true,
              clarity: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      });
    } catch {
      pendingInvoices = await prisma.invoice.findMany({
        where: ownerFilter,
        select: {
          id: true,
          invoiceNo: true,
          companyName: true,
          totalAmount: true,
          date: true,
          dueDate: true,
          items: {
            select: {
              description: true,
              carat: true,
              color: true,
              clarity: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      });
    }

    const overdueInvoices = pendingInvoices.filter((invoice) => {
      const typed = invoice as { dueDate: Date };
      return typed.dueDate && isOverdue(new Date(typed.dueDate), currentDateOnly);
    });

    const memoDelegate = prisma.memo as unknown as {
      findMany: (args: unknown) => Promise<unknown[]>;
    };
    let activeMemos: unknown[] = [];
    try {
      activeMemos = await memoDelegate.findMany({
        where: { memoStatus: 'ACTIVE', ...ownerFilter },
        select: {
          id: true,
          memoNo: true,
          companyName: true,
          totalAmount: true,
          date: true,
          dueDate: true,
          memoTerms: true,
          paymentTerms: true,
          items: {
            select: {
              description: true,
              carat: true,
              color: true,
              clarity: true,
            },
          },
        },
        orderBy: { date: 'asc' },
      });
    } catch {
      activeMemos = await prisma.memo.findMany({
        where: ownerFilter,
        select: {
          id: true,
          memoNo: true,
          companyName: true,
          totalAmount: true,
          date: true,
          dueDate: true,
          memoTerms: true,
          paymentTerms: true,
          items: {
            select: {
              description: true,
              carat: true,
              color: true,
              clarity: true,
            },
          },
        },
        orderBy: { date: 'asc' },
      });
    }

    const getMemoExpiryDate = (memo: {
      date: Date;
      dueDate?: Date;
      memoTerms?: number;
      paymentTerms?: number;
    }) => {
      if (memo.dueDate) return new Date(memo.dueDate);
      const expiry = new Date(memo.date);
      expiry.setDate(expiry.getDate() + (memo.memoTerms ?? memo.paymentTerms ?? 0));
      return expiry;
    };

    const overdueMemos = activeMemos.filter((memo) => {
      const typed = memo as {
        date: Date;
        dueDate?: Date;
        memoTerms?: number;
        paymentTerms?: number;
      };
      return isOverdue(getMemoExpiryDate(typed), currentDateOnly);
    });

    overdueInvoices.forEach((invoice) => {
      const typedInvoice = invoice as {
        id: string;
        invoiceNo: string;
        companyName: string;
        totalAmount: number;
        date: Date;
        dueDate: Date;
        items: Array<{ carat: number; color: string; clarity: string }>;
      };
      const dueDateOnly = toDateOnly(new Date(typedInvoice.dueDate));
      const daysOverdue = Math.floor(
        (currentDateOnly.getTime() - dueDateOnly.getTime()) / (1000 * 60 * 60 * 24)
      );

      notifications.push({
        id: `invoice-${typedInvoice.id}`,
        type: 'invoice',
        title: `Overdue Invoice — ${typedInvoice.invoiceNo}`,
        clientName: typedInvoice.companyName,
        documentNumber: typedInvoice.invoiceNo,
        stoneSummary: '',
        issueDate: typedInvoice.date,
        daysOverdue,
        amount: typedInvoice.totalAmount,
        priority: daysOverdue > 30 ? 'high' : daysOverdue > 15 ? 'medium' : 'low',
      });
    });

    overdueMemos.forEach((memo) => {
      const typedMemo = memo as {
        id: string;
        memoNo: string;
        companyName: string;
        totalAmount: number;
        date: Date;
        dueDate?: Date;
        memoTerms?: number;
        paymentTerms?: number;
        items: Array<{ carat: number; color: string; clarity: string }>;
      };
      const memoExpiryDate = getMemoExpiryDate(typedMemo);
      const daysOverdue = Math.floor(
        (currentDateOnly.getTime() - toDateOnly(memoExpiryDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const stoneSummary = typedMemo.items
        .map((item) => `${item.carat}ct ${item.color} ${item.clarity}`)
        .join(', ');

      notifications.push({
        id: `memo-${typedMemo.id}`,
        type: 'memo',
        title: `Overdue Memo — ${typedMemo.memoNo}`,
        clientName: typedMemo.companyName,
        documentNumber: typedMemo.memoNo,
        stoneSummary,
        issueDate: typedMemo.date,
        daysOverdue,
        amount: typedMemo.totalAmount,
        priority: daysOverdue > 30 ? 'high' : daysOverdue > 15 ? 'medium' : 'low',
      });
    });

    // Latest issue date first, then oldest
    notifications.sort(
      (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
    );

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching notifications: ${errorMessage}`);
    return NextResponse.json(
      {
        success: false,
        notifications: [],
        message: 'Failed to fetch notifications',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
