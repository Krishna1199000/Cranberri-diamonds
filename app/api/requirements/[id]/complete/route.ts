import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

// POST - Mark requirement as completed (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only admins can mark requirements as completed' },
        { status: 403 }
      );
    }

    // Check if requirement exists
    const existingRequirement = await prisma.requirement.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!existingRequirement) {
      return NextResponse.json(
        { success: false, message: 'Requirement not found' },
        { status: 404 }
      );
    }

    const updatedRequirement = await prisma.requirement.update({
      where: { id: resolvedParams.id },
      data: { isCompleted: true },
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
      requirement: updatedRequirement,
      message: 'Requirement marked as completed'
    });

  } catch (error) {
    console.error('Error marking requirement as completed:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, message: 'Failed to mark requirement as completed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 