import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

/** Minimal master (shipment) record for a new sales lead from Requirements panel */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.userId || (session.role !== 'admin' && session.role !== 'employee')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyName,
      personName,
      phoneNumber,
      email,
      state,
      country,
      addressLine1,
      city,
      postalCode,
    } = body;

    if (!companyName?.trim() || !personName?.trim() || !state?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Company name, person name, and state are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true },
    });

    const salesExecutive = user?.name || 'Requirements';
    const accountManager = user?.name || session.email || 'Admin';

    const shipment = await prisma.shipment.create({
      data: {
        companyName: companyName.trim(),
        ownerName: personName.trim(),
        addressLine1: addressLine1?.trim() || 'Address pending',
        addressLine2: null,
        country: country?.trim() || 'India',
        state: state.trim(),
        city: city?.trim() || state.trim(),
        postalCode: postalCode?.trim() || '000000',
        phoneNo: phoneNumber?.trim() || '0000000000',
        faxNo: null,
        email: email?.trim() || `${companyName.replace(/\s+/g, '').toLowerCase()}@lead.local`,
        website: null,
        paymentTerms: '30',
        carrier: 'Other',
        organizationType: 'Client',
        businessType: 'Retail',
        businessRegNo: 'N/A',
        panNo: 'N/A',
        sellerPermitNo: null,
        cstTinNo: null,
        tradeBodyMembership: [],
        referenceType: 'Requirements Panel',
        referenceNotes: 'Created via Add New Lead',
        references: [],
        authorizedBy: accountManager,
        accountManager,
        brokerName: null,
        partyGroup: 'Customer',
        salesExecutive,
        leadSource: 'Requirements Panel',
        limit: 0,
        lastUpdatedBy: session.email || accountManager,
        userId: session.userId,
      },
      select: {
        id: true,
        companyName: true,
        ownerName: true,
        phoneNo: true,
        email: true,
        state: true,
        country: true,
        city: true,
        addressLine1: true,
        postalCode: true,
      },
    });

    // Also create a Vendor record with source='lead' for categorization
    try {
      await prisma.vendor.upsert({
        where: { companyName: companyName.trim() },
        update: {}, // Don't overwrite if already exists
        create: {
          companyName: companyName.trim(),
          ownerName: personName.trim(),
          contactNumber: phoneNumber?.trim() || '0000000000',
          address: addressLine1?.trim() || 'Address pending',
          gstNumber: '',
          accountNumber: '',
          ifscCode: '',
          bankName: '',
          accountHolderName: personName.trim(),
          location: `${city?.trim() || state.trim()}, ${state.trim()}`,
          businessType: 'Retail',
          source: 'lead',
        },
      });
    } catch (vendorError) {
      // Don't fail the lead creation if vendor creation fails (e.g. unique constraint)
      console.warn('Could not create vendor for lead:', vendorError);
    }

    return NextResponse.json({
      success: true,
      lead: {
        id: shipment.id,
        companyName: shipment.companyName,
        ownerName: shipment.ownerName,
        phoneNo: shipment.phoneNo,
        email: shipment.email,
        state: shipment.state,
        country: shipment.country,
        city: shipment.city,
        addressLine1: shipment.addressLine1,
        postalCode: shipment.postalCode,
      },
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to register new lead' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
