import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

// GET - Fetch all requirements
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || (session.role !== 'admin' && session.role !== 'employee')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch requirements with employee information
    const requirements = await prisma.requirement.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      requirements
    });

  } catch (error) {
    console.error('Error fetching requirements:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, message: 'Failed to fetch requirements' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create a new requirement (employees only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'employee') {
      return NextResponse.json(
        { success: false, message: 'Only employees can create requirements' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { customerName, description, state, country } = body;

    if (!customerName || !description || !state || !country) {
      return NextResponse.json(
        { success: false, message: 'Customer name, description, state, and country are required' },
        { status: 400 }
      );
    }

    const requirement = await prisma.requirement.create({
      data: {
        customerName,
        description,
        state,
        country,
        employeeId: session.userId as string
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      requirement
    });

  } catch (error) {
    console.error('Error creating requirement:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, message: 'Failed to create requirement' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 