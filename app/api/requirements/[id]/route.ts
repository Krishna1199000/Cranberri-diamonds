import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import {
  formatRequirementSpecSummary,
  parseRequirementDescription,
  type RequirementSpec,
} from '@/lib/requirements/types';

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error == null) return 'Unknown error';
  return String(error);
}

function enrichRequirement(req: {
  id: string;
  customerName: string;
  description: string;
  state: string;
  country: string;
  personName?: string;
  phoneNumber: string | null;
  email: string | null;
  masterId: string | null;
  requirementDate?: Date;
  notes: string | null;
  budget: number | null;
  isCompleted: boolean;
  employeeId: string;
  createdAt: Date;
  updatedAt: Date;
  employee: { id: string; name: string; email: string };
}) {
  const { spec, legacySummary } = parseRequirementDescription(req.description);
  const displayPersonName = req.personName?.trim() || req.country?.trim() || '';
  const summary = spec
    ? formatRequirementSpecSummary(spec)
    : legacySummary || req.description;

  return {
    ...req,
    personName: displayPersonName,
    date: req.requirementDate?.toISOString() ?? req.createdAt.toISOString(),
    requirementDate: req.requirementDate?.toISOString() ?? req.createdAt.toISOString(),
    spec,
    summary,
    isLegacy: !spec,
  };
}

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
    const {
      customerName,
      personName,
      state,
      country,
      isCompleted,
      requirementDate,
      phoneNumber,
      email,
      notes,
      budget,
      spec,
      description,
    } = body;

    const existingRequirement = await prisma.requirement.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingRequirement) {
      return NextResponse.json(
        { success: false, message: 'Requirement not found' },
        { status: 404 }
      );
    }

    if (session.role === 'employee' && existingRequirement.employeeId !== session.userId) {
      return NextResponse.json(
        { success: false, message: 'You can only edit your own requirements' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (customerName !== undefined) updateData.customerName = customerName;
    if (personName !== undefined) updateData.personName = personName;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
    if (requirementDate !== undefined) updateData.requirementDate = new Date(requirementDate);
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null;
    if (email !== undefined) updateData.email = email || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (budget !== undefined) {
      updateData.budget = budget != null && budget !== '' ? Number(budget) : null;
    }
    if (spec?.version === 2) {
      updateData.description = JSON.stringify(spec as RequirementSpec);
    } else if (description !== undefined) {
      updateData.description = description;
    }

    const updatedRequirement = await prisma.requirement.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        employee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      requirement: enrichRequirement(updatedRequirement),
    });
  } catch (error) {
    console.error('Error updating requirement:', errorMessage(error));
    return NextResponse.json(
      { success: false, message: 'Failed to update requirement' },
      { status: 500 }
    );
  }
}

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

    const existingRequirement = await prisma.requirement.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingRequirement) {
      return NextResponse.json(
        { success: false, message: 'Requirement not found' },
        { status: 404 }
      );
    }

    if (session.role === 'employee' && existingRequirement.employeeId !== session.userId) {
      return NextResponse.json(
        { success: false, message: 'You can only delete your own requirements' },
        { status: 403 }
      );
    }

    await prisma.requirement.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Requirement deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting requirement:', errorMessage(error));
    return NextResponse.json(
      { success: false, message: 'Failed to delete requirement' },
      { status: 500 }
    );
  }
}
