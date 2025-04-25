import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getSession } from '@/lib/session';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function POST(req: Request) {
  console.log('POST /api/sales - Starting request processing');
  try {
    const session = await getSession();
    console.log('Session data:', session);
    
    if (!session || (session.role !== 'employee' && session.role !== 'admin')) {
      console.log('Unauthorized access attempt:', { session });
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    console.log('Received form data:', data);
    
    // Validate required fields for non-no-sale entries
    if (!data.isNoSale) {
      console.log('Validating required fields for regular sale');
      if (!data.companyName || !data.totalSaleValue || !data.saleItems || data.saleItems.length === 0) {
        console.log('Missing required fields:', {
          hasCompanyName: !!data.companyName,
          hasTotalSaleValue: !!data.totalSaleValue,
          hasSaleItems: !!data.saleItems,
          saleItemsLength: data.saleItems?.length || 0
        });
        return NextResponse.json(
          { success: false, message: 'Missing required fields' },
          { status: 400 }
        );
      }
    }

    // Format the data before creating the entry
    const formattedData = {
      employeeId: typeof session.userId === 'string' ? session.userId : String(session.userId),
      saleDate: new Date(data.saleDate),
      isNoSale: data.isNoSale || false,
      companyName: data.companyName || null,
      trackingId: data.trackingId || null,
      shipmentCarrier: data.shipmentCarrier || null,
      totalSaleValue: data.totalSaleValue ? parseFloat(data.totalSaleValue) : null,
      description: data.description || null
    };

    console.log('Formatted data for database:', formattedData);

    // Create the sales entry with related sale items
    const entry = await prisma.salesEntry.create({
      data: {
        ...formattedData,
        saleItems: data.isNoSale ? undefined : {
          create: data.saleItems.map(item => ({
            carat: item.carat ? parseFloat(item.carat) : null,
            color: item.color || null,
            clarity: item.clarity || null,
            certificateNo: item.certificateNo || null,
            pricePerCarat: item.pricePerCarat ? parseFloat(item.pricePerCarat) : null,
            totalValue: item.totalValue ? parseFloat(item.totalValue) : null
          }))
        }
      },
      include: {
        saleItems: true
      }
    });

    console.log('Successfully created sales entry:', entry);

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error creating sales entry:', {
      message: errorMessage,
      stack: errorStack
    });

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { success: false, message: 'Database error', error: errorMessage },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Failed to create sales entry' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '7';
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const employeeId = searchParams.get('employeeId');
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    let dateFilter: Prisma.DateTimeFilter = {};
    if (start && end) {
      dateFilter = {
        gte: new Date(start),
        lte: new Date(end)
      };
    } else {
      const filterDate = new Date();
      filterDate.setDate(filterDate.getDate() - parseInt(period));
      dateFilter = {
        gte: filterDate
      };
    }

    const where = {
      saleDate: dateFilter,
      ...(session.role === 'employee' ? { employeeId: session.userId as string } : {}),
      ...(employeeId && employeeId !== 'all' ? { employeeId: employeeId as string } : {})
    };

    const entries = await prisma.salesEntry.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true
          }
        },
        saleItems: true
      },
      orderBy: {
        saleDate: 'desc'
      }
    });

    return NextResponse.json({ success: true, entries });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('Error fetching sales entries:', {
      message: errorMessage
    });

    return NextResponse.json(
      { success: false, message: 'Failed to fetch sales entries' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await req.json();
    
    await prisma.salesEntry.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('Error deleting sales entry:', {
      message: errorMessage
    });

    return NextResponse.json(
      { success: false, message: 'Failed to delete sales entry' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, saleItems, ...data } = await req.json();

    // First, delete all existing sale items
    await prisma.saleItem.deleteMany({
      where: { salesEntryId: id }
    });
    
    // Then update the sales entry with new data and create new sale items
    const entry = await prisma.salesEntry.update({
      where: { id },
      data: {
        ...data,
        saleDate: data.saleDate ? new Date(data.saleDate) : undefined,
        totalSaleValue: data.totalSaleValue ? parseFloat(data.totalSaleValue) : null,
        trackingId: data.trackingId || null,
        shipmentCarrier: data.shipmentCarrier || null,
        companyName: data.companyName || null,
        saleItems: data.isNoSale ? undefined : {
          create: saleItems.map(item => ({
            carat: item.carat ? parseFloat(item.carat) : null,
            color: item.color || null,
            clarity: item.clarity || null,
            certificateNo: item.certificateNo || null,
            pricePerCarat: item.pricePerCarat ? parseFloat(item.pricePerCarat) : null,
            totalValue: item.totalValue ? parseFloat(item.totalValue) : null
          }))
        }
      },
      include: {
        saleItems: true
      }
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('Error updating sales entry:', {
      message: errorMessage
    });

    return NextResponse.json(
      { success: false, message: 'Failed to update sales entry' },
      { status: 500 }
    );
  }
}