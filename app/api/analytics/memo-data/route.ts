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
    const whereClause: Prisma.MemoWhereInput = {};

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

    // State filter (using memo state field)
    if (states.length > 0) {
      whereClause.state = { in: states };
    }

    // Diamond-specific filters for items
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

    // Add item filters if any exist
    if (Object.keys(itemFilters).length > 0) {
      whereClause.items = {
        some: itemFilters
      };
    }

    // Fetch memo data with backward compatibility
    let memoData;
    try {
      // Try with new memoStatus field first
      memoData = await prisma.memo.findMany({
        where: {
          ...whereClause,
          memoStatus: { not: 'DISMISSED' } // Exclude dismissed memos
        },
        include: {
          items: true
        },
        orderBy: {
          date: 'asc'
        }
      });
    } catch {
      // Fallback for schemas without memoStatus
      memoData = await prisma.memo.findMany({
        where: whereClause,
        include: {
          items: true
        },
        orderBy: {
          date: 'asc'
        }
      });
    }

    // Process data for different chart types

    // 1. Memos over time (time series)
    const memoTimeSeries = memoData.reduce((acc: any[], memo) => {
      const dateKey = format(new Date(memo.date), 'yyyy-MM-dd');
      const existingEntry = acc.find(entry => entry.date === dateKey);
      
      if (existingEntry) {
        existingEntry.value += 1;
        existingEntry.totalValue += memo.totalAmount;
      } else {
        acc.push({
          date: dateKey,
          value: 1,
          totalValue: memo.totalAmount
        });
      }
      
      return acc;
    }, []);

    // 2. Active vs Expired memos
    const now = new Date();
    let activeMemos = 0;
    let expiredMemos = 0;

    memoData.forEach(memo => {
      try {
        // Try to use memoTerms if available
        const memoTerms = (memo as any).memoTerms || 30;
        const expiryDate = new Date(memo.date);
        expiryDate.setDate(expiryDate.getDate() + memoTerms);
        
        if (now > expiryDate) {
          expiredMemos++;
        } else {
          activeMemos++;
        }
      } catch {
        // Fallback: assume 30 days if memoTerms not available
        const expiryDate = new Date(memo.date);
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        if (now > expiryDate) {
          expiredMemos++;
        } else {
          activeMemos++;
        }
      }
    });

    const activeVsExpired = [
      { name: 'Active', value: activeMemos },
      { name: 'Expired', value: expiredMemos }
    ];

    // 3. Memo value distribution by shape
    const shapeDistribution = memoData.reduce((acc: any, memo) => {
      memo.items.forEach((item: any) => {
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

    // 4. Summary statistics
    const totalMemos = memoData.length;
    const totalValue = memoData.reduce((sum, memo) => sum + memo.totalAmount, 0);
    const avgMemoValue = totalMemos > 0 ? totalValue / totalMemos : 0;
    const totalStones = memoData.reduce((sum, memo) => sum + memo.items.length, 0);

    return NextResponse.json({
      timeSeries: memoTimeSeries,
      activeVsExpired,
      shapeDistribution: shapeChartData,
      summary: {
        totalMemos,
        totalValue,
        avgMemoValue,
        totalStones,
        activeMemos,
        expiredMemos
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching memo analytics data: ${errorMessage}`);
    return NextResponse.json(
      { error: 'Failed to fetch memo data' },
      { status: 500 }
    );
  }
}