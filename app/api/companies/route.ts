import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch both customers (from shipments) and vendors
    const [customerCompanies, vendorCompanies] = await Promise.all([
      // Customer companies from shipments
      prisma.shipment.findMany({
        where: session.role === 'employee' ? {
          userId: session.userId as string
        } : undefined,
        select: {
          id: true,
          companyName: true,
          ownerName: true
        },
        distinct: ['companyName'],
        orderBy: {
          companyName: 'asc'
        }
      }),
      // Vendor companies
      session.role === 'admin' ? prisma.vendor.findMany({
        where: {
          deletedAt: null
        },
        select: {
          id: true,
          companyName: true,
          ownerName: true
        },
        orderBy: {
          companyName: 'asc'
        }
      }) : []
    ]);

    // Combine and deduplicate companies
    const allCompanies = [...customerCompanies, ...vendorCompanies];
    const uniqueCompanies = allCompanies.reduce((acc, current) => {
      const existing = acc.find(company => 
        company.companyName.toLowerCase() === current.companyName.toLowerCase()
      );
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, [] as typeof allCompanies);

    return NextResponse.json(uniqueCompanies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}