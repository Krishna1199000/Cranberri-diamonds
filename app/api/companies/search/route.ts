import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, companies: [], message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all companies for dropdown
    const shipments = await prisma.shipment.findMany({
      select: {
        id: true,
        companyName: true,
        ownerName: true,
        phoneNo: true,
        email: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
      },
      orderBy: {
        companyName: 'asc'
      },
    });

    // Transform to unique companies (group by company name)
    const companies = shipments.reduce((acc: any[], shipment) => {
      const existing = acc.find(c => c.name === shipment.companyName);
      if (!existing) {
        acc.push({
          id: shipment.id,
          name: shipment.companyName,
          ownerName: shipment.ownerName || undefined,
          phoneNo: shipment.phoneNo || undefined,
          email: shipment.email || undefined,
          addressLine1: shipment.addressLine1,
          addressLine2: shipment.addressLine2,
          city: shipment.city,
          state: shipment.state,
          country: shipment.country,
          postalCode: shipment.postalCode,
        });
      }
      return acc;
    }, []);

    return NextResponse.json({
      success: true,
      companies
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching companies: ${errorMessage}`);
    return NextResponse.json(
      { 
        success: false, 
        companies: [], 
        message: 'Failed to fetch companies' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

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

    // Allow employees to search all companies (remove restriction)
    // No need to filter by userId for employees

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Company search error: ${errorMessage}`);
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