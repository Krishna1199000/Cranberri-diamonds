import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getSession } from '@/lib/session';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function POST(req: Request) {
  // Remove sensitive logging in production
  if (process.env.NODE_ENV === 'development') {
    console.log('POST /api/sales - Starting request processing');
  }
  
  try {
    const session = await getSession();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Session data:', session);
    }
    
    if (!session || (session.role !== 'employee' && session.role !== 'admin')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Unauthorized access attempt:', { session });
      }
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Received form data:', data);
    }
    
    // Validate required fields for non-no-sale entries
    if (!data.isNoSale) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Validating required fields for regular sale');
      }
      if (!data.companyName || !data.totalSaleValue || !data.saleItems || data.saleItems.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Missing required fields:', {
            hasCompanyName: !!data.companyName,
            hasTotalSaleValue: !!data.totalSaleValue,
            hasSaleItems: !!data.saleItems,
            saleItemsLength: data.saleItems?.length || 0
          });
        }
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
      state: data.state || null,
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
            shape: item.shape || null,
            lab: item.lab || null,
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
  console.log("--- GET /api/sales START ---");
  try {
    const session = await getSession();
    console.log("GET /api/sales - Session:", session);
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '7';
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const employeeIdsParam = searchParams.get('employeeIds'); // comma-separated
    const companyNamesParam = searchParams.get('companies'); // comma-separated
    const statesParam = searchParams.get('states'); // comma-separated
    const colorsParam = searchParams.get('colors');
    const claritiesParam = searchParams.get('clarities');
    const labsParam = searchParams.get('labs');
    const shapesParam = searchParams.get('shapes');
    const caratMinParam = searchParams.get('caratMin');
    const caratMaxParam = searchParams.get('caratMax');
    console.log("GET /api/sales - Params:", { period, start, end, employeeIdsParam, companyNamesParam, statesParam, colorsParam, claritiesParam, labsParam, shapesParam, caratMinParam, caratMaxParam });
    
    if (!session) {
      console.log("GET /api/sales - Unauthorized (No session)");
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

    // Build filters
    const employeeIds = employeeIdsParam
      ? employeeIdsParam.split(',').map(id => id.trim()).filter(Boolean)
      : [];
    const companies = companyNamesParam
      ? companyNamesParam.split(',').map(c => c.trim()).filter(Boolean)
      : [];
    const states = statesParam
      ? statesParam.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const colors = colorsParam ? colorsParam.split(',').map(c => c.trim()).filter(Boolean) : [];
    const clarities = claritiesParam ? claritiesParam.split(',').map(c => c.trim()).filter(Boolean) : [];
    const labs = labsParam ? labsParam.split(',').map(c => c.trim()).filter(Boolean) : [];
    const shapes = shapesParam ? shapesParam.split(',').map(c => c.trim()).filter(Boolean) : [];
    const caratMin = caratMinParam ? parseFloat(caratMinParam) : undefined;
    const caratMax = caratMaxParam ? parseFloat(caratMaxParam) : undefined;

    const where: Prisma.SalesEntryWhereInput = {
      saleDate: dateFilter,
      ...(session.role === 'employee' && employeeIds.length === 0 ? { employeeId: session.userId as string } : {}),
      ...(employeeIds.length > 0 && !employeeIds.includes('all') ? { employeeId: { in: employeeIds } } : {}),
      ...(companies.length > 0 ? { companyName: { in: companies } } : {}),
      ...(states.length > 0 ? { state: { in: states } } : {}),
      ...(colors.length > 0 || clarities.length > 0 || labs.length > 0 || shapes.length > 0 || caratMin !== undefined || caratMax !== undefined
        ? {
            saleItems: {
              some: {
                ...(colors.length > 0 ? { color: { in: colors } } : {}),
                ...(clarities.length > 0 ? { clarity: { in: clarities } } : {}),
                ...(labs.length > 0 ? { lab: { in: labs } } : {}),
                ...(shapes.length > 0 ? { shape: { in: shapes } } : {}),
                ...(caratMin !== undefined || caratMax !== undefined
                  ? {
                      carat: {
                        ...(caratMin !== undefined ? { gte: caratMin } : {}),
                        ...(caratMax !== undefined ? { lte: caratMax } : {}),
                      },
                    }
                  : {}),
              },
            },
          }
        : {}),
    };
    console.log("GET /api/sales - Prisma WHERE clause:", JSON.stringify(where));

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
    console.log(`GET /api/sales - Found ${entries.length} entries.`);

    console.log("GET /api/sales - Returning success response.");
    return NextResponse.json({ success: true, entries });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET /api/sales - Error caught:', { message: errorMessage, error });
    
    console.log("GET /api/sales - Returning error response.");
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sales entries' },
      { status: 500 }
    );
  } finally {
      console.log("--- GET /api/sales END ---");
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
        state: data.state || null,
        saleItems: data.isNoSale ? undefined : {
          create: saleItems.map(item => ({
            carat: item.carat ? parseFloat(item.carat) : null,
            color: item.color || null,
            clarity: item.clarity || null,
            shape: item.shape || null,
            lab: item.lab || null,
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