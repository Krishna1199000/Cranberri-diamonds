// app/api/invoices/latest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    if (request.nextUrl.pathname === '/api/invoices/latest') {
      try {
        const latestInvoice = await prisma.invoice.findFirst({
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true
          }
        });
        
        return NextResponse.json({ lastId: latestInvoice?.id || 0 });
      } catch (error) {
        console.error('Error fetching latest invoice ID:', error);
        return NextResponse.json({ error: 'Failed to fetch latest invoice ID' }, { status: 500 });
      }
    }
}