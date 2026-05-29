import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { startOfDay, endOfDay, format, differenceInDays } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required for return memo analytics' },
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

    // Build where clause
    const whereClause: Prisma.MemoWhereInput = {};

    // User filter
    if (users.length > 0) {
      whereClause.userId = { in: users };
    }

    // Company filter (shipment IDs)
    if (companies.length > 0) {
      whereClause.shipmentId = { in: companies };
    }

    // Date range filter (for return date if available, otherwise memo date)
    if (dateRange.startDate || dateRange.endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (dateRange.startDate) {
        dateFilter.gte = startOfDay(new Date(dateRange.startDate));
      }
      if (dateRange.endDate) {
        dateFilter.lte = endOfDay(new Date(dateRange.endDate));
      }
      
      whereClause.OR = [
        { returnDate: dateFilter },
        { date: dateFilter }
      ];
    }

    // State filter
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

    // Fetch returned memo data with backward compatibility
    type MemoWithItems = Awaited<
      ReturnType<
        typeof prisma.memo.findMany<{ include: { items: true } }>
      >
    >[number];
    let returnedMemos: MemoWithItems[] = [];
    let allMemos: MemoWithItems[] = [];

    try {
      // Try with memoStatus field first
      returnedMemos = await prisma.memo.findMany({
        where: {
          ...whereClause,
          memoStatus: 'RETURNED'
        },
        include: {
          items: true
        },
        orderBy: {
          returnDate: 'desc'
        }
      });

      // Also get all memos for return rate calculation
      allMemos = await prisma.memo.findMany({
        where: whereClause,
        include: {
          items: true
        }
      });
    } catch {
      // Fallback: return empty array if memoStatus doesn't exist
      console.log('memoStatus field not available, returning empty results');
      return NextResponse.json({
        timeSeries: [],
        returnRate: { returned: 0, active: 0, rate: 0 },
        valueAnalysis: [],
        summary: {
          totalReturned: 0,
          totalReturnedValue: 0,
          avgReturnValue: 0,
          avgDaysToReturn: 0,
          returnRate: 0
        }
      });
    }

    // Process data for different chart types

    // 1. Returns over time (time series)
    const returnTimeSeries = returnedMemos.reduce((acc: any[], memo) => {
      const returnDate = (memo as any).returnDate;
      if (!returnDate) return acc;
      
      const dateKey = format(new Date(returnDate), 'yyyy-MM-dd');
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

    // 2. Return rate analysis
    const totalMemos = allMemos.length;
    const totalReturned = returnedMemos.length;
    const returnRate = totalMemos > 0 ? (totalReturned / totalMemos) * 100 : 0;

    const returnRateData = {
      returned: totalReturned,
      active: totalMemos - totalReturned,
      rate: returnRate
    };

    // 3. Value analysis of returns by time period
    const monthlyReturnValue = returnedMemos.reduce((acc: any[], memo) => {
      const returnDate = (memo as any).returnDate;
      if (!returnDate) return acc;
      
      const monthKey = format(new Date(returnDate), 'yyyy-MM');
      const existingEntry = acc.find(entry => entry.month === monthKey);
      
      if (existingEntry) {
        existingEntry.count += 1;
        existingEntry.value += memo.totalAmount;
      } else {
        acc.push({
          month: monthKey,
          count: 1,
          value: memo.totalAmount
        });
      }
      
      return acc;
    }, []);

    // 4. Return analysis by shape
    const shapeReturnAnalysis = returnedMemos.reduce((acc: any, memo) => {
      memo.items.forEach((item: any) => {
        const shape = item.shape || 'Unknown';
        if (!acc[shape]) {
          acc[shape] = { name: shape, count: 0, value: 0 };
        }
        acc[shape].count += 1;
        acc[shape].value += item.price || 0;
      });
      return acc;
    }, {});

    const shapeReturnData = Object.values(shapeReturnAnalysis);

    // 5. Time to return analysis
    const timeToReturnData = returnedMemos
      .filter(memo => (memo as any).returnDate)
      .map(memo => {
        const memoDate = new Date(memo.date);
        const returnDate = new Date((memo as { returnDate?: Date | null }).returnDate!);
        const daysToReturn = differenceInDays(returnDate, memoDate);
        return {
          memoNumber: memo.memoNo,
          daysToReturn,
          value: memo.totalAmount
        };
      });

    const avgDaysToReturn = timeToReturnData.length > 0
      ? timeToReturnData.reduce((sum, item) => sum + item.daysToReturn, 0) / timeToReturnData.length
      : 0;

    // 6. Return reasons distribution (if we had reason field)
    // For now, we'll create categories based on return timing
    const returnCategories = timeToReturnData.reduce((acc: any[], item) => {
      let category = '';
      if (item.daysToReturn <= 7) category = 'Quick Return (≤7 days)';
      else if (item.daysToReturn <= 30) category = 'Normal Return (8-30 days)';
      else if (item.daysToReturn <= 90) category = 'Extended Return (31-90 days)';
      else category = 'Long Term Return (>90 days)';

      const existing = acc.find(c => c.name === category);
      if (existing) {
        existing.count += 1;
        existing.value += item.value;
      } else {
        acc.push({ name: category, count: 1, value: item.value });
      }
      return acc;
    }, []);

    // 7. Summary statistics
    const totalReturnedValue = returnedMemos.reduce((sum, memo) => sum + memo.totalAmount, 0);
    const avgReturnValue = totalReturned > 0 ? totalReturnedValue / totalReturned : 0;
    const totalReturnedStones = returnedMemos.reduce((sum, memo) => sum + memo.items.length, 0);

    return NextResponse.json({
      timeSeries: returnTimeSeries,
      returnRate: returnRateData,
      monthlyValue: monthlyReturnValue,
      shapeAnalysis: shapeReturnData,
      timeToReturn: timeToReturnData,
      returnCategories,
      summary: {
        totalReturned,
        totalReturnedValue,
        avgReturnValue,
        avgDaysToReturn,
        returnRate,
        totalReturnedStones,
        quickReturns: timeToReturnData.filter(item => item.daysToReturn <= 7).length,
        extendedReturns: timeToReturnData.filter(item => item.daysToReturn > 30).length
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching return memo analytics data: ${errorMessage}`);
    return NextResponse.json(
      { error: 'Failed to fetch return memo data' },
      { status: 500 }
    );
  }
}