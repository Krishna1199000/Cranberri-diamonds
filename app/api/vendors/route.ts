import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    const vendors = await prisma.vendor.findMany({
      where: {
        deletedAt: null,
        ...(q
          ? {
              OR: [
                { companyName: { contains: q, mode: 'insensitive' } },
                { ownerName: { contains: q, mode: 'insensitive' } },
                { contactNumber: { contains: q, mode: 'insensitive' } },
                { location: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        purchases: {
          select: {
            inrPrice: true,
          },
        },
        payments: {
          select: {
            amountINR: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate totals for each vendor
    const vendorsWithTotals = vendors.map((vendor) => {
      const totalBusiness = vendor.purchases.reduce((sum, purchase) => sum + purchase.inrPrice, 0);
      const totalPayments = vendor.payments.reduce((sum, payment) => sum + payment.amountINR, 0);
      const balanceDue = totalBusiness - totalPayments;

      return {
        ...vendor,
        totalBusiness,
        balanceDue,
        purchases: undefined, // Remove for response
        payments: undefined, // Remove for response
      };
    });

    return NextResponse.json(vendorsWithTotals);
  } catch (error) {
    console.error('Get vendors error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Check session first
    const session = await getSession();
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.companyName || !data.ownerName || !data.contactNumber || !data.location || !data.businessType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const {
      companyName,
      ownerName,
      contactNumber,
      address,
      gstNumber,
      accountNumber,
      ifscCode,
      bankName,
      accountHolderName,
      location,
      businessType,
    } = data;

    // Check if vendor with this company name already exists
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        companyName,
        deletedAt: null,
      },
    });

    if (existingVendor) {
      return NextResponse.json(
        { error: 'A vendor with this company name already exists' },
        { status: 400 }
      );
    }

    // Create vendor
    const vendor = await prisma.vendor.create({
      data: {
        companyName,
        ownerName,
        contactNumber,
        address: address || '',
        gstNumber: gstNumber || '',
        accountNumber: accountNumber || '',
        ifscCode: ifscCode || '',
        bankName: bankName || '',
        accountHolderName: accountHolderName || '',
        location,
        businessType,
      },
    });

    return NextResponse.json({ data: vendor });
  } catch (error) {
    console.error('Create vendor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}