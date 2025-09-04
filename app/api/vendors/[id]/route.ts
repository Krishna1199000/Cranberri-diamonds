import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const purchaseFrom = searchParams.get('purchaseFrom');
    const purchaseTo = searchParams.get('purchaseTo');
    const paymentFrom = searchParams.get('paymentFrom');
    const paymentTo = searchParams.get('paymentTo');

    const resolvedParams = await params;
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: resolvedParams.id,
        deletedAt: null,
      },
      include: {
        purchases: {
          where: {
            ...(purchaseFrom || purchaseTo ? {
              date: {
                ...(purchaseFrom ? { gte: new Date(purchaseFrom) } : {}),
                ...(purchaseTo ? { lte: new Date(purchaseTo + 'T23:59:59.999Z') } : {}),
              }
            } : {})
          },
          orderBy: {
            date: 'desc',
          },
        },
        payments: {
          where: {
            ...(paymentFrom || paymentTo ? {
              date: {
                ...(paymentFrom ? { gte: new Date(paymentFrom) } : {}),
                ...(paymentTo ? { lte: new Date(paymentTo + 'T23:59:59.999Z') } : {}),
              }
            } : {})
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!vendor) {
      return new NextResponse('Vendor not found', { status: 404 });
    }

    // Calculate totals
    const totalBusiness = vendor.purchases.reduce((sum, purchase) => sum + purchase.inrPrice, 0);
    const totalPayments = vendor.payments.reduce((sum, payment) => sum + payment.amountINR, 0);
    const balanceDue = totalBusiness - totalPayments;

    return NextResponse.json({
      ...vendor,
      totalBusiness,
      balanceDue,
    });
  } catch (error) {
    console.error('Get vendor error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const resolvedParams = await params;
    const data = await request.json();
    
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

    // Check if another vendor with this company name exists
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        companyName,
        deletedAt: null,
        id: { not: resolvedParams.id },
      },
    });

    if (existingVendor) {
      return NextResponse.json(
        { error: 'A vendor with this company name already exists' },
        { status: 400 }
      );
    }

    await prisma.vendor.update({
      where: { id: resolvedParams.id },
      data: {
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
      },
    });

    return NextResponse.json({ message: 'Vendor updated successfully' });
  } catch (error) {
    console.error('Update vendor error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.userId || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const resolvedParams = await params;
    // Soft delete by setting deletedAt
    await prisma.vendor.update({
      where: { id: resolvedParams.id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Delete vendor error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

