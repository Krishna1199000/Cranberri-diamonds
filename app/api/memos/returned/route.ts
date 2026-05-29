import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.userId;
    const userRole = session?.role;

    if (!userId || !userRole) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const employeeIds = searchParams.get('employeeIds')?.split(',').filter(Boolean) || [];
    const companies = searchParams.get('companies')?.split(',').filter(Boolean) || [];
    const states = searchParams.get('states')?.split(',').filter(Boolean) || [];
    const dateStart = searchParams.get('dateStart');
    const dateEnd = searchParams.get('dateEnd');

    // This endpoint depends on return-management columns.
    // If migration is not applied yet, we gracefully return an empty history.
    const whereClause: Prisma.MemoWhereInput = {};

    // Role-based filtering
    if (userRole === 'employee') {
        whereClause.userId = userId;
    } else if (userRole === 'admin' && employeeIds.length > 0) {
        whereClause.userId = { in: employeeIds };
    }

    // Company filter
    if (companies.length > 0) {
        whereClause.companyName = { in: companies };
    }

    // State filter
    if (states.length > 0) {
        whereClause.state = { in: states };
    }

    // Date range filter (best-effort on issue date for backward compatibility)
    if (dateStart || dateEnd) {
        whereClause.date = {
          ...(dateStart && { gte: new Date(dateStart) }),
          ...(dateEnd && {
            lte: (() => {
              const endDate = new Date(dateEnd);
              endDate.setHours(23, 59, 59, 999);
              return endDate;
            })()
          })
        };
    }

    console.log('Fetching returned memos with whereClause:', JSON.stringify(whereClause, null, 2));

    let memos: any[] = [];
    try {
      whereClause.memoStatus = 'RETURNED';
      memos = await prisma.memo.findMany({
        where: whereClause,
        include: {
          items: {
            select: {
              reportNo: true,
              description: true,
              carat: true,
              color: true,
              clarity: true,
              shape: true,
              lab: true,
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: [
          { returnDate: 'desc' },
          { date: 'desc' }
        ]
      });
    } catch {
      // Schema not migrated yet: no return history available.
      memos = [];
    }

    console.log(`Found ${memos.length} returned memos`);

    return NextResponse.json({ 
        success: true, 
        memos: memos.map(memo => ({
            ...memo,
            processedBy: memo.processedBy || memo.user?.name || 'System'
        }))
    });

  } catch (error) {
    console.error('Error fetching returned memos:', error);
    return NextResponse.json({ error: 'Failed to fetch returned memos' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}