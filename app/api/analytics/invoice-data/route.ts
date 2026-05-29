import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { startOfDay, endOfDay, format } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'employee')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      users = [],
      companies = [],
      states = [],
      shapes = [],
      caratRange = {},
      clarityGrades = [],
      colourWhite = [],
      colourFancy = [],
      dateRange = {},
      labs = []
    } = await req.json();

    // Build where clause
    const whereClause: Prisma.InvoiceWhereInput = {};

    // User filter
    if (users.length > 0) {
      whereClause.userId = { in: users };
    }

    // Company filter
    if (companies.length > 0) {
      whereClause.shipmentId = { in: companies };
    }

    // Date range filter
    if (dateRange.startDate || dateRange.endDate) {
      whereClause.date = {};
      if (dateRange.startDate) {
        whereClause.date.gte = startOfDay(new Date(dateRange.startDate));
      }
      if (dateRange.endDate) {
        whereClause.date.lte = endOfDay(new Date(dateRange.endDate));
      }
    }

    // State filter (using invoice state field)
    if (states.length > 0) {
      whereClause.state = { in: states };
    }

    // Diamond-specific filters for items
    const itemFilters: Prisma.InvoiceItemWhereInput = {};

    if (shapes.length > 0) {
      itemFilters.shape = { in: shapes };
    }

    if (caratRange.min !== null || caratRange.max !== null) {
      itemFilters.carat = {};
      if (caratRange.min !== null) {
        itemFilters.carat.gte = caratRange.min;
      }
      if (caratRange.max !== null) {
        itemFilters.carat.lte = caratRange.max;
      }
    }

    if (clarityGrades.length > 0) {
      itemFilters.clarity = { in: clarityGrades };
    }

    if (colourWhite.length > 0 || colourFancy.length > 0) {
      const colourFilter: string[] = [];
      if (colourWhite.length > 0) colourFilter.push(...colourWhite);
      if (colourFancy.length > 0) colourFilter.push(...colourFancy);
      itemFilters.color = { in: colourFilter };
    }

    if (labs.length > 0) {
      itemFilters.lab = { in: labs };
    }

    // Add item filters if any exist
    if (Object.keys(itemFilters).length > 0) {
      whereClause.items = {
        some: itemFilters
      };
    }

    // Fetch invoice data
    const invoiceData = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        items: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Process data for different chart types

    // 1. Invoices over time (time series)
    const invoiceTimeSeries = invoiceData.reduce((acc: any[], invoice) => {
      const dateKey = format(new Date(invoice.date), 'yyyy-MM-dd');
      const existingEntry = acc.find(entry => entry.date === dateKey);
      
      if (existingEntry) {
        existingEntry.value += 1;
        existingEntry.totalValue += invoice.totalAmount;
      } else {
        acc.push({
          date: dateKey,
          value: 1,
          totalValue: invoice.totalAmount
        });
      }
      
      return acc;
    }, []);

    // 2. Payment status breakdown
    let pendingInvoices = 0;
    let paidInvoices = 0;
    let pendingValue = 0;
    let paidValue = 0;

    invoiceData.forEach(invoice => {
      try {
        // Try to use paymentStatus if available
        const paymentStatus = (invoice as any).paymentStatus || 'PENDING';
        if (paymentStatus === 'PAYMENT_RECEIVED') {
          paidInvoices++;
          paidValue += invoice.totalAmount;
        } else {
          pendingInvoices++;
          pendingValue += invoice.totalAmount;
        }
      } catch {
        // Fallback: assume all pending if paymentStatus not available
        pendingInvoices++;
        pendingValue += invoice.totalAmount;
      }
    });

    const paymentStatusDistribution = [
      { name: 'Pending', value: pendingInvoices, amount: pendingValue },
      { name: 'Paid', value: paidInvoices, amount: paidValue }
    ];

    // 3. Invoice value distribution by shape
    const shapeDistribution = invoiceData.reduce((acc: any, invoice) => {
      invoice.items.forEach((item: any) => {
        const shape = item.shape || 'Unknown';
        if (!acc[shape]) {
          acc[shape] = { name: shape, count: 0, value: 0 };
        }
        acc[shape].count += 1;
        acc[shape].value += item.total || 0;
      });
      return acc;
    }, {});

    const shapeChartData = Object.values(shapeDistribution);

    // 4. Monthly trend analysis
    const monthlyTrend = invoiceData.reduce((acc: any[], invoice) => {
      const monthKey = format(new Date(invoice.date), 'yyyy-MM');
      const existingEntry = acc.find(entry => entry.month === monthKey);
      
      if (existingEntry) {
        existingEntry.count += 1;
        existingEntry.value += invoice.totalAmount;
      } else {
        acc.push({
          month: monthKey,
          count: 1,
          value: invoice.totalAmount
        });
      }
      
      return acc;
    }, []);

    // 5. Summary statistics
    const totalInvoices = invoiceData.length;
    const totalValue = invoiceData.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const avgInvoiceValue = totalInvoices > 0 ? totalValue / totalInvoices : 0;
    const totalStones = invoiceData.reduce((sum, invoice) => sum + invoice.items.length, 0);

    return NextResponse.json({
      timeSeries: invoiceTimeSeries,
      paymentStatus: paymentStatusDistribution,
      shapeDistribution: shapeChartData,
      monthlyTrend,
      summary: {
        totalInvoices,
        totalValue,
        avgInvoiceValue,
        totalStones,
        pendingInvoices,
        paidInvoices,
        pendingValue,
        paidValue
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching invoice analytics data: ${errorMessage}`);
    return NextResponse.json(
      { error: 'Failed to fetch invoice data' },
      { status: 500 }
    );
  }
}