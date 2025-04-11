import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    console.log('GET request to /api/performance/admin started');
    const session = await getSession();
    
    console.log('Session data:', session);
    
    if (!session || session.role !== 'admin') {
      console.log('Unauthorized access attempt:', session);
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    console.log('Query params - employeeId:', employeeId);

    const where = employeeId ? { userId: employeeId } : {};
    console.log('Where clause:', where);

    const reports = await prisma.performanceReport.findMany({
      where,
      orderBy: {
        date: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log(`Found ${reports.length} reports`);
    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error('Error fetching performance reports:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { success: false, message: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    console.log('POST request to /api/performance/admin started');
    const session = await getSession();
    
    console.log('Session data:', session);
    
    if (!session || session.role !== 'admin') {
      console.log('Unauthorized access attempt:', session);
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Reading request body...');
    const data = await req.json();
    console.log('Request data:', data);
    
    // Validate the required fields
    if (!data.userId) {
      console.error('Missing required field: userId');
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the user exists
    console.log('Checking if user exists:', data.userId);
    const userExists = await prisma.user.findUnique({
      where: { id: data.userId }
    });
    
    if (!userExists) {
      console.error('User not found:', data.userId);
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('Creating performance report...');
    const reportData = {
      userId: data.userId,
      totalCalls: parseInt(data.totalCalls) || 0,
      totalEmails: parseInt(data.totalEmails) || 0,
      requirementsReceived: parseInt(data.requirementsReceived) || 0,
      memo: data.memo || null,
      invoice: data.invoice || null
    };
    
    console.log('Report data to insert:', reportData);
    
    const report = await prisma.performanceReport.create({
      data: reportData,
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log('Report created successfully:', report.id);
    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Error creating performance report:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error type:', Object.prototype.toString.call(error));
    
    return NextResponse.json(
      { success: false, message: 'Failed to create report' },
      { status: 500 }
    );
  }
}