import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { startOfDay, endOfDay, format, subDays, startOfMonth, endOfMonth } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required for overall analytics' },
        { status: 403 }
      );
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

    // Build base where clauses
    const buildInvoiceBaseWhere = (): Prisma.InvoiceWhereInput => {
      const where: Prisma.InvoiceWhereInput = {};

      if (users.length > 0) {
        where.userId = { in: users };
      }

      if (companies.length > 0) {
        where.shipmentId = { in: companies };
      }

      if (states.length > 0) {
        where.state = { in: states };
      }

      return where;
    };

    const buildMemoBaseWhere = (): Prisma.MemoWhereInput => {
      const where: Prisma.MemoWhereInput = {};

      if (users.length > 0) {
        where.userId = { in: users };
      }

      if (companies.length > 0) {
        where.shipmentId = { in: companies };
      }

      if (states.length > 0) {
        where.state = { in: states };
      }

      return where;
    };

    const buildInvoiceItemFilters = () => {
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

      return itemFilters;
    };

    const buildMemoItemFilters = () => {
      const itemFilters: Prisma.MemoItemWhereInput = {};

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

      return itemFilters;
    };

    // Date range setup
    const startDate = dateRange.startDate ? new Date(dateRange.startDate) : subDays(new Date(), 365);
    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : new Date();

    const dateFilter = {
      gte: startOfDay(startDate),
      lte: endOfDay(endDate),
    };

    // Build where clauses for different entities
    const invoiceWhere: Prisma.InvoiceWhereInput = {
      ...buildInvoiceBaseWhere(),
      date: dateFilter,
    };

    const memoWhere: Prisma.MemoWhereInput = {
      ...buildMemoBaseWhere(),
      date: dateFilter,
    };

    const requirementWhere: any = {
      employeeId: users.length > 0 ? { in: users } : undefined,
      createdAt: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate)
      }
    };

    // Add item filters if they exist
    const invoiceItemFilters = buildInvoiceItemFilters();
    if (Object.keys(invoiceItemFilters).length > 0) {
      invoiceWhere.items = { some: invoiceItemFilters };
    }

    const memoItemFilters = buildMemoItemFilters();
    if (Object.keys(memoItemFilters).length > 0) {
      memoWhere.items = { some: memoItemFilters };
    }

    // Fetch all data in parallel
    const [invoices, memos, requirements] = await Promise.all([
      prisma.invoice.findMany({
        where: invoiceWhere,
        select: {
          id: true,
          invoiceNo: true,
          date: true,
          dueDate: true,
          companyName: true,
          totalAmount: true,
          items: {
            select: {
              shape: true,
              clarity: true,
              color: true,
              carat: true,
              total: true,
            }
          }
        },
        orderBy: { date: 'asc' }
      }),
      prisma.memo.findMany({
        where: memoWhere,
        select: {
          id: true,
          memoNo: true,
          date: true,
          dueDate: true,
          companyName: true,
          totalAmount: true,
          items: {
            select: {
              shape: true,
              clarity: true,
              color: true,
              carat: true,
              total: true,
            }
          }
        },
        orderBy: { date: 'asc' }
      }),
      prisma.requirement.findMany({
        where: requirementWhere,
        orderBy: { createdAt: 'asc' }
      })
    ]);

    // 1. Combined business overview metrics
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    
    // Revenue analysis
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const recentRevenue = invoices
      .filter(inv => new Date(inv.date) >= thirtyDaysAgo)
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    const memoValue = memos.reduce((sum, memo) => sum + memo.totalAmount, 0);
    const recentMemoValue = memos
      .filter(memo => new Date(memo.date) >= thirtyDaysAgo)
      .reduce((sum, memo) => sum + memo.totalAmount, 0);

    // Transaction counts
    const totalTransactions = invoices.length + memos.length;
    const recentTransactions = invoices.filter(inv => new Date(inv.date) >= thirtyDaysAgo).length +
                               memos.filter(memo => new Date(memo.date) >= thirtyDaysAgo).length;

    // 2. Combined timeline showing all activities
    const combinedTimeline: Array<{
      date: string;
      invoices: number;
      invoiceValue: number;
      memos: number;
      memoValue: number;
      requirements: number;
    }> = [];

    // Add invoice data
    invoices.forEach(invoice => {
      const dateKey = format(new Date(invoice.date), 'yyyy-MM-dd');
      let existing = combinedTimeline.find(item => item.date === dateKey);
      
      if (!existing) {
        existing = {
          date: dateKey,
          invoices: 0,
          invoiceValue: 0,
          memos: 0,
          memoValue: 0,
          requirements: 0
        };
        combinedTimeline.push(existing);
      }
      
      existing.invoices += 1;
      existing.invoiceValue += invoice.totalAmount;
    });

    // Add memo data
    memos.forEach(memo => {
      const dateKey = format(new Date(memo.date), 'yyyy-MM-dd');
      let existing = combinedTimeline.find(item => item.date === dateKey);
      
      if (!existing) {
        existing = {
          date: dateKey,
          invoices: 0,
          invoiceValue: 0,
          memos: 0,
          memoValue: 0,
          requirements: 0
        };
        combinedTimeline.push(existing);
      }
      
      existing.memos += 1;
      existing.memoValue += memo.totalAmount;
    });

    // Add requirement data
    requirements.forEach(req => {
      const dateKey = format(new Date(req.createdAt), 'yyyy-MM-dd');
      let existing = combinedTimeline.find(item => item.date === dateKey);
      
      if (!existing) {
        existing = {
          date: dateKey,
          invoices: 0,
          invoiceValue: 0,
          memos: 0,
          memoValue: 0,
          requirements: 0
        };
        combinedTimeline.push(existing);
      }
      
      existing.requirements += 1;
    });

    // Sort timeline by date
    combinedTimeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 3. Business performance metrics
    const avgInvoiceValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;
    const avgMemoValue = memos.length > 0 ? memoValue / memos.length : 0;
    
    // Calculate conversion metrics (if we had leads data)
    const conversionRate = requirements.length > 0 ? (invoices.length / requirements.length) * 100 : 0;

    // 4. Top clients analysis
    const clientAnalysis = {};
    
    [...invoices, ...memos].forEach(doc => {
      const clientName = doc.companyName || 'Unknown';
      if (!clientAnalysis[clientName]) {
        clientAnalysis[clientName] = {
          name: clientName,
          invoices: 0,
          memos: 0,
          totalValue: 0,
          lastActivity: null
        };
      }
      
      if ('invoiceNo' in doc) {
        clientAnalysis[clientName].invoices += 1;
        clientAnalysis[clientName].lastActivity = doc.date;
      } else {
        clientAnalysis[clientName].memos += 1;
        clientAnalysis[clientName].lastActivity = doc.date;
      }
      
      clientAnalysis[clientName].totalValue += doc.totalAmount;
    });

    const topClients = Object.values(clientAnalysis)
      .sort((a: any, b: any) => b.totalValue - a.totalValue)
      .slice(0, 10);

    // 5. Product performance (diamonds)
    const productAnalysis = {};
    
    [...invoices, ...memos].forEach(doc => {
      doc.items.forEach((item: any) => {
        const key = `${item.shape}-${item.clarity}-${item.color}`;
        if (!productAnalysis[key]) {
          productAnalysis[key] = {
            shape: item.shape || 'Unknown',
            clarity: item.clarity || 'Unknown',
            colour: item.color || 'Unknown',
            count: 0,
            totalValue: 0,
            avgCarat: 0,
            totalCarat: 0
          };
        }
        
        productAnalysis[key].count += 1;
        productAnalysis[key].totalValue += item.total || 0;
        productAnalysis[key].totalCarat += item.carat || 0;
        productAnalysis[key].avgCarat = productAnalysis[key].totalCarat / productAnalysis[key].count;
      });
    });

    const topProducts = Object.values(productAnalysis)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);

    // 6. Monthly performance comparison
    const monthlyComparison: Array<{
      month: string;
      invoices: number;
      invoiceValue: number;
      memos: number;
      memoValue: number;
      requirements: number;
    }> = [];
    const startMonth = startOfMonth(startDate);
    const endMonth = endOfMonth(endDate);
    
    let currentMonth = startMonth;
    while (currentMonth <= endMonth) {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      const monthInvoices = invoices.filter(inv => 
        new Date(inv.date) >= monthStart && new Date(inv.date) <= monthEnd
      );
      
      const monthMemos = memos.filter(memo => 
        new Date(memo.date) >= monthStart && new Date(memo.date) <= monthEnd
      );
      
      const monthRequirements = requirements.filter(req => 
        new Date(req.createdAt) >= monthStart && new Date(req.createdAt) <= monthEnd
      );
      
      monthlyComparison.push({
        month: format(currentMonth, 'yyyy-MM'),
        invoices: monthInvoices.length,
        invoiceValue: monthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        memos: monthMemos.length,
        memoValue: monthMemos.reduce((sum, memo) => sum + memo.totalAmount, 0),
        requirements: monthRequirements.length
      });
      
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    }

    // 7. Outstanding analysis
    let outstandingValue = 0;
    let overdueCount = 0;
    
    try {
      // Try with paymentStatus if available
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          ...invoiceWhere,
          paymentStatus: 'PENDING',
          dueDate: { lt: now }
        }
      });
      
      outstandingValue = overdueInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      overdueCount = overdueInvoices.length;
    } catch {
      // Fallback: assume all invoices are outstanding
      outstandingValue = totalRevenue;
      overdueCount = invoices.length;
    }

    return NextResponse.json({
      overview: {
        totalRevenue,
        recentRevenue,
        memoValue,
        recentMemoValue,
        totalTransactions,
        recentTransactions,
        avgInvoiceValue,
        avgMemoValue,
        conversionRate,
        outstandingValue,
        overdueCount
      },
      timeline: combinedTimeline,
      topClients,
      topProducts,
      monthlyComparison,
      summary: {
        totalInvoices: invoices.length,
        totalMemos: memos.length,
        totalRequirements: requirements.length,
        totalBusinessValue: totalRevenue + memoValue,
        uniqueClients: Object.keys(clientAnalysis).length,
        avgTransactionValue: totalTransactions > 0 ? (totalRevenue + memoValue) / totalTransactions : 0
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching overall analytics data: ${errorMessage}`);
    return NextResponse.json(
      { error: 'Failed to fetch overall data' },
      { status: 500 }
    );
  }
}