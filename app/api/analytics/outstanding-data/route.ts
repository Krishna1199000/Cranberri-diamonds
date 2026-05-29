import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import {
  buildDocumentWhereClause,
  daysOverdueFromDue,
  getMemoExpiryDate,
  isPastDueDate,
  requireAdminAnalytics,
  type AnalyticsFilterInput,
} from '@/lib/analytics/filters';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!requireAdminAnalytics(session.role)) {
      return NextResponse.json(
        { error: 'Admin access required for outstanding analytics' },
        { status: 403 }
      );
    }

    const filters: AnalyticsFilterInput = await req.json();
    const { where: invoiceWhere } = buildDocumentWhereClause(filters);
    const { where: memoWhere } = buildDocumentWhereClause(filters);

    const now = new Date();

    let pendingInvoices: Array<{
      id: string;
      invoiceNo: string;
      companyName: string;
      totalAmount: number;
      dueDate: Date;
    }> = [];
    let paidInvoices: Array<{ totalAmount: number }> = [];
    let activeMemos: Array<{
      id: string;
      memoNo: string;
      companyName: string;
      totalAmount: number;
      date: Date;
      dueDate: Date;
      memoTerms: number;
      paymentTerms: number;
    }> = [];

    try {
      [pendingInvoices, paidInvoices, activeMemos] = await Promise.all([
        prisma.invoice.findMany({
          where: {
            ...invoiceWhere,
            paymentStatus: 'PENDING',
          },
          select: {
            id: true,
            invoiceNo: true,
            companyName: true,
            totalAmount: true,
            dueDate: true,
          },
        }),
        prisma.invoice.findMany({
          where: {
            ...invoiceWhere,
            paymentStatus: 'PAYMENT_RECEIVED',
          },
          select: { totalAmount: true },
        }),
        prisma.memo.findMany({
          where: {
            ...memoWhere,
            memoStatus: 'ACTIVE',
          },
          select: {
            id: true,
            memoNo: true,
            companyName: true,
            totalAmount: true,
            date: true,
            dueDate: true,
            memoTerms: true,
            paymentTerms: true,
          },
        }),
      ]);
    } catch {
      const [allInvoices, allMemos] = await Promise.all([
        prisma.invoice.findMany({
          where: invoiceWhere,
          select: {
            id: true,
            invoiceNo: true,
            companyName: true,
            totalAmount: true,
            dueDate: true,
          },
        }),
        prisma.memo.findMany({
          where: memoWhere,
          select: {
            id: true,
            memoNo: true,
            companyName: true,
            totalAmount: true,
            date: true,
            dueDate: true,
            memoTerms: true,
            paymentTerms: true,
          },
        }),
      ]);
      pendingInvoices = allInvoices;
      paidInvoices = [];
      activeMemos = allMemos;
    }

    const overdueInvoices = pendingInvoices.filter((inv) =>
      isPastDueDate(inv.dueDate, now)
    );

    const overdueMemos = activeMemos.filter((memo) =>
      isPastDueDate(getMemoExpiryDate(memo), now)
    );

    const outstandingItems = [
      ...overdueInvoices.map((invoice) => ({
        id: `invoice-${invoice.id}`,
        clientName: invoice.companyName || 'Unknown',
        documentNumber: invoice.invoiceNo,
        amount: invoice.totalAmount,
        daysOverdue: daysOverdueFromDue(invoice.dueDate, now),
        type: 'invoice' as const,
        dueDate: invoice.dueDate,
      })),
      ...overdueMemos.map((memo) => {
        const expiryDate = getMemoExpiryDate(memo);
        return {
          id: `memo-${memo.id}`,
          clientName: memo.companyName || 'Unknown',
          documentNumber: memo.memoNo,
          amount: memo.totalAmount,
          daysOverdue: daysOverdueFromDue(expiryDate, now),
          type: 'memo' as const,
          dueDate: expiryDate,
        };
      }),
    ].sort((a, b) => b.daysOverdue - a.daysOverdue);

    const totalPaidValue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalOutstandingValue = overdueInvoices.reduce(
      (sum, inv) => sum + inv.totalAmount,
      0
    );

    const criticalOverdue = outstandingItems.filter((item) => item.daysOverdue > 60);
    const highOverdue = outstandingItems.filter(
      (item) => item.daysOverdue > 30 && item.daysOverdue <= 60
    );
    const mediumOverdue = outstandingItems.filter(
      (item) => item.daysOverdue > 7 && item.daysOverdue <= 30
    );
    const recentOverdue = outstandingItems.filter((item) => item.daysOverdue <= 7);

    const clientSummary = Object.values(
      outstandingItems.reduce<
        Record<
          string,
          {
            clientName: string;
            totalAmount: number;
            itemCount: number;
            avgDaysOverdue: number;
          }
        >
      >((acc, item) => {
        if (!acc[item.clientName]) {
          acc[item.clientName] = {
            clientName: item.clientName,
            totalAmount: 0,
            itemCount: 0,
            avgDaysOverdue: 0,
          };
        }
        acc[item.clientName].totalAmount += item.amount;
        acc[item.clientName].itemCount += 1;
        return acc;
      }, {})
    )
      .map((client) => {
        const clientItems = outstandingItems.filter(
          (item) => item.clientName === client.clientName
        );
        client.avgDaysOverdue =
          clientItems.reduce((sum, item) => sum + item.daysOverdue, 0) /
          clientItems.length;
        return client;
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return NextResponse.json({
      outstandingList: outstandingItems.slice(0, 50),
      paymentReceived: {
        totalValue: totalPaidValue,
        count: paidInvoices.length,
      },
      paymentDue: {
        totalValue: totalOutstandingValue,
        count: overdueInvoices.length,
      },
      summary: {
        totalOutstanding: outstandingItems.length,
        totalOutstandingValue: outstandingItems.reduce(
          (sum, item) => sum + item.amount,
          0
        ),
        criticalCount: criticalOverdue.length,
        highCount: highOverdue.length,
        mediumCount: mediumOverdue.length,
        recentCount: recentOverdue.length,
        avgDaysOverdue:
          outstandingItems.length > 0
            ? outstandingItems.reduce((sum, item) => sum + item.daysOverdue, 0) /
              outstandingItems.length
            : 0,
      },
      clientSummary,
      severityBreakdown: [
        {
          name: 'Critical (>60 days)',
          value: criticalOverdue.length,
          amount: criticalOverdue.reduce((sum, item) => sum + item.amount, 0),
        },
        {
          name: 'High (31-60 days)',
          value: highOverdue.length,
          amount: highOverdue.reduce((sum, item) => sum + item.amount, 0),
        },
        {
          name: 'Medium (8-30 days)',
          value: mediumOverdue.length,
          amount: mediumOverdue.reduce((sum, item) => sum + item.amount, 0),
        },
        {
          name: 'Recent (1-7 days)',
          value: recentOverdue.length,
          amount: recentOverdue.reduce((sum, item) => sum + item.amount, 0),
        },
      ],
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching outstanding analytics data: ${errorMessage}`);
    return NextResponse.json(
      { error: 'Failed to fetch outstanding data' },
      { status: 500 }
    );
  }
}
