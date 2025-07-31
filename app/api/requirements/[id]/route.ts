import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session';

const prisma = new PrismaClient();

// PUT - Update a requirement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await getSession();
    
    if (!session || (session.role !== 'admin' && session.role !== 'employee')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { customerName, description, state, country, isCompleted } = body;

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

    // Permission check:
    // - Admin can edit any requirement
    // - Employee can only edit their own requirements
    if (session.role === 'employee' && existingRequirement.employeeId !== session.userId) {
      return NextResponse.json(
        { success: false, message: 'You can only edit your own requirements' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (customerName !== undefined) updateData.customerName = customerName;
    if (description !== undefined) updateData.description = description;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

    const updatedRequirement = await prisma.requirement.update({
      where: { id: resolvedParams.id },
      data: updateData,
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
      requirement: updatedRequirement
    });

  } catch (error) {
    console.error('Error updating requirement:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, message: 'Failed to update requirement' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete a requirement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const session = await getSession();
    
    if (!session || (session.role !== 'admin' && session.role !== 'employee')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
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

    // Permission check:
    // - Admin can delete any requirement
    // - Employee can only delete their own requirements
    if (session.role === 'employee' && existingRequirement.employeeId !== session.userId) {
      return NextResponse.json(
        { success: false, message: 'You can only delete your own requirements' },
        { status: 403 }
      );
    }

    await prisma.requirement.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Requirement deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting requirement:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, message: 'Failed to delete requirement' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 