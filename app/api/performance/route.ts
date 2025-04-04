import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET() {
  try {
    type Session = {
      userId: string;
      // add other fields as needed
    };
    
    const session = await getSession() as Session;
    
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const reports = await prisma.performanceReport.findMany({
      where: {
        userId: session.userId
      },
      orderBy: {
        date: 'desc'
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error('Error fetching performance reports:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch reports' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    
    const report = await prisma.performanceReport.create({
      data: {
        ...data,
        userId: session.userId,
        totalCalls: parseInt(data.totalCalls),
        totalEmails: parseInt(data.totalEmails),
        requirementsReceived: parseInt(data.requirementsReceived)
      }
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Error creating performance report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create report' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}