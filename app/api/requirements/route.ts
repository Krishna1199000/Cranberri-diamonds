import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import {
  formatRequirementSpecSummary,
  parseRequirementDescription,
  type RequirementSpec,
  expandSpecField,
} from '@/lib/requirements/types';
import { CLARITY_GRADES, WHITE_COLOURS, FANCY_COLOURS } from '@/lib/requirements/constants';

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error == null) return 'Unknown error';
  return String(error);
}

function isSchemaOutOfDateError(error: unknown): boolean {
  const msg = errorMessage(error).toLowerCase();
  return (
    msg.includes('column') ||
    msg.includes('person_name') ||
    msg.includes('requirement_date') ||
    msg.includes('does not exist') ||
    msg.includes('p2022')
  );
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
  const { specs, spec, legacySummary } = parseRequirementDescription(req.description);
  const displayPersonName = req.personName?.trim() || req.country?.trim() || '';
  const summary = specs && specs.length > 0
    ? specs.map(formatRequirementSpecSummary).join(' ; ')
    : legacySummary || req.description;

  return {
    ...req,
    personName: displayPersonName,
    date: req.requirementDate?.toISOString() ?? req.createdAt.toISOString(),
    requirementDate: req.requirementDate?.toISOString() ?? req.createdAt.toISOString(),
    spec,
    specs,
    summary,
    isLegacy: !specs,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || (session.role !== 'admin' && session.role !== 'employee')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeIds = searchParams.get('employeeIds')?.split(',').filter(Boolean) || [];
    const companies = searchParams.get('companies')?.split(',').filter(Boolean) || [];
    const states = searchParams.get('states')?.split(',').filter(Boolean) || [];
    const shapes = searchParams.get('shapes')?.split(',').filter(Boolean) || [];
    const colors = searchParams.get('colors')?.split(',').filter(Boolean) || [];
    const clarities = searchParams.get('clarities')?.split(',').filter(Boolean) || [];
    const labs = searchParams.get('labs')?.split(',').filter(Boolean) || [];
    const caratMin = searchParams.get('caratMin');
    const caratMax = searchParams.get('caratMax');
    const dateStart = searchParams.get('dateStart');
    const dateEnd = searchParams.get('dateEnd');

    const whereClause: Prisma.RequirementWhereInput = {};

    if (session.role === 'employee') {
      whereClause.employeeId = session.userId as string;
    } else if (session.role === 'admin' && employeeIds.length > 0) {
      whereClause.employeeId = { in: employeeIds };
    }

    if (companies.length > 0) {
      whereClause.customerName = { in: companies };
    }

    if (states.length > 0) {
      whereClause.state = { in: states };
    }

    if (dateStart || dateEnd) {
      whereClause.requirementDate = {};
      if (dateStart) {
        whereClause.requirementDate.gte = new Date(dateStart);
      }
      if (dateEnd) {
        const endDate = new Date(dateEnd);
        endDate.setHours(23, 59, 59, 999);
        whereClause.requirementDate.lte = endDate;
      }
    }

    const requirements = await prisma.requirement.findMany({
      where: whereClause,
      include: {
        employee: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { requirementDate: 'desc' },
    });

    let filtered = requirements.map(enrichRequirement);

    if (shapes.length || colors.length || clarities.length || labs.length || caratMin || caratMax) {
      filtered = filtered.filter((req) => {
        if (!req.specs || req.specs.length === 0) return false;
        return req.specs.some((spec: RequirementSpec) => {
          if (shapes.length && spec.shape && !shapes.includes(spec.shape)) return false;
          
          // Expand clarity ranges
          const expandedClarity = expandSpecField(spec.clarity, CLARITY_GRADES);
          if (clarities.length && expandedClarity.length) {
            if (!expandedClarity.some((c: string) => clarities.includes(c))) return false;
          }
          
          // Expand color ranges
          const colorList = spec.colorType === 'white' ? WHITE_COLOURS : FANCY_COLOURS;
          const expandedColors = expandSpecField(
            spec.colorType === 'white' ? spec.colorWhite : spec.colorFancy,
            colorList
          );
          if (colors.length && expandedColors.length) {
            if (!expandedColors.some((c: string) => colors.includes(c))) return false;
          }
          
          if (labs.length && spec.lab && spec.lab !== 'Any' && !labs.includes(spec.lab)) {
            return false;
          }
          const min = caratMin ? parseFloat(caratMin) : null;
          const max = caratMax ? parseFloat(caratMax) : null;
          if (min != null && spec.caratMax != null && spec.caratMax < min) return false;
          if (max != null && spec.caratMin != null && spec.caratMin > max) return false;
          return true;
        });
      });
    }

    return NextResponse.json({ success: true, requirements: filtered });
  } catch (error) {
    console.error('Error fetching requirements:', errorMessage(error));
    if (isSchemaOutOfDateError(error)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Requirements table is missing new columns. Run: npx prisma db push (or npx prisma migrate dev)',
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Failed to fetch requirements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || (session.role !== 'employee' && session.role !== 'admin')) {
      return NextResponse.json(
        { success: false, message: 'Only employees and admins can create requirements' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      masterId,
      customerName,
      personName,
      state,
      country,
      phoneNumber,
      email,
      requirementDate,
      notes,
      budget,
      spec,
      specs,
    } = body;

    if (!customerName?.trim() || !personName?.trim() || !state?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Company name, person name, and state are required' },
        { status: 400 }
      );
    }

    const finalSpecs = specs || (spec ? [spec] : []);
    if (finalSpecs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid requirement specification' },
        { status: 400 }
      );
    }

    for (const s of finalSpecs) {
      if (!s || s.version !== 2) {
        return NextResponse.json(
          { success: false, message: 'Invalid requirement specification' },
          { status: 400 }
        );
      }
      if (!s.shape?.trim()) {
        return NextResponse.json(
          { success: false, message: 'Shape is required' },
          { status: 400 }
        );
      }
    }

    const requirement = await prisma.requirement.create({
      data: {
        customerName: customerName.trim(),
        personName: personName.trim(),
        description: JSON.stringify(finalSpecs),
        state: state.trim(),
        country: country?.trim() || '',
        phoneNumber: phoneNumber?.trim() || null,
        email: email?.trim() || null,
        masterId: masterId || null,
        requirementDate: requirementDate ? new Date(requirementDate) : new Date(),
        notes: notes?.trim() || null,
        budget: budget != null && budget !== '' ? Number(budget) : null,
        employeeId: session.userId as string,
      },
      include: {
        employee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      requirement: enrichRequirement(requirement),
    });
  } catch (error) {
    console.error('Error creating requirement:', errorMessage(error));
    if (isSchemaOutOfDateError(error)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Requirements table is missing new columns. Run: npx prisma db push (or npx prisma migrate dev)',
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Failed to create requirement' },
      { status: 500 }
    );
  }
}
