import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userIds } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid user IDs provided' }, { status: 400 });
    }

    // Get companies from invoices and memos created by the specified users
    const [invoiceCompanies, memoCompanies] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          userId: { in: userIds }
        },
        select: {
          shipmentId: true,
          companyName: true
        },
        distinct: ['shipmentId']
      }),
      prisma.memo.findMany({
        where: {
          userId: { in: userIds }
        },
        select: {
          shipmentId: true,
          companyName: true
        },
        distinct: ['shipmentId']
      })
    ]);

    // Combine and deduplicate companies
    const companyMap = new Map();
    
    [...invoiceCompanies, ...memoCompanies].forEach(doc => {
      if (doc.shipmentId && doc.companyName) {
        companyMap.set(doc.shipmentId, {
          id: doc.shipmentId,
          name: doc.companyName
        });
      }
    });

    const companies = Array.from(companyMap.values());

    return NextResponse.json(companies);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching companies by users: ${errorMessage}`);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}