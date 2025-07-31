import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, found: false, count: 0, results: [], message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchTerm, searchType } = await request.json();

    if (!searchTerm || !searchType) {
      return NextResponse.json(
        { success: false, found: false, count: 0, results: [], message: 'Missing search parameters' },
        { status: 400 }
      );
    }

    // Build the search where clause based on searchType
    let whereCondition: Record<string, unknown> = {};

    switch (searchType) {
      case 'companyName':
        whereCondition = {
          companyName: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        };
        break;
      case 'phoneNumber':
        whereCondition = {
          phoneNo: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        };
        break;
      case 'email':
        whereCondition = {
          email: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        };
        break;
      case 'website':
        whereCondition = {
          website: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        };
        break;
      default:
        return NextResponse.json(
          { success: false, found: false, count: 0, results: [], message: 'Invalid search type' },
          { status: 400 }
        );
    }

    // Only search companies created by the current employee if they're not an admin
    if (session.role === 'employee') {
      whereCondition.userId = session.userId as string;
    }

    console.log('🔍 Company Search:', { searchTerm, searchType, whereCondition });

    // Search for shipments that match the criteria
    const shipments = await prisma.shipment.findMany({
      where: whereCondition,
      select: {
        id: true,
        companyName: true,
        phoneNo: true,
        email: true,
        website: true,
        ownerName: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        createdAt: true
      },
      orderBy: {
        companyName: 'asc'
      },
      take: 50 // Limit results to prevent too many results
    });

    console.log(`✅ Company Search: Found ${shipments.length} results`);

    // Transform the results to match the expected format
    const results = shipments.map(shipment => ({
      id: shipment.id,
      companyName: shipment.companyName,
      phoneNo: shipment.phoneNo,
      email: shipment.email,
      website: shipment.website || undefined,
      ownerName: shipment.ownerName || undefined,
      addressLine1: shipment.addressLine1,
      addressLine2: shipment.addressLine2 || undefined,
      city: shipment.city,
      state: shipment.state,
      country: shipment.country,
      postalCode: shipment.postalCode,
      createdAt: shipment.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      found: results.length > 0,
      count: results.length,
      results
    });

  } catch (error) {
    console.error('❌ Company search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        found: false, 
        count: 0, 
        results: [], 
        message: 'Search failed' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 