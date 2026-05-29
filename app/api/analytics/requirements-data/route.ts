import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { startOfDay, endOfDay, format } from 'date-fns';
import {
  parseRequirementDescription,
  type RequirementSpec,
} from '@/lib/requirements/types';
import { requireAdminAnalytics } from '@/lib/analytics/filters';

type ParsedRow = {
  id: string;
  customerName: string;
  createdAt: Date;
  spec: RequirementSpec | null;
};

function specMatchesFilters(
  spec: RequirementSpec | null,
  shapes: string[],
  caratRange: { min?: number | null; max?: number | null },
  clarityGrades: string[],
  colourWhite: string[],
  colourFancy: string[],
  labs: string[]
): boolean {
  if (!spec) return false;
  if (shapes.length && spec.shape && !shapes.includes(spec.shape)) return false;
  if (clarityGrades.length && spec.clarity.length) {
    if (!spec.clarity.some((c) => clarityGrades.includes(c))) return false;
  }
  const colors = spec.colorType === 'white' ? spec.colorWhite : spec.colorFancy;
  const colourFilter = [...colourWhite, ...colourFancy];
  if (colourFilter.length && colors.length) {
    if (!colors.some((c) => colourFilter.includes(c))) return false;
  }
  if (labs.length && spec.lab && spec.lab !== 'Any' && !labs.includes(spec.lab)) return false;
  const min = caratRange.min ?? null;
  const max = caratRange.max ?? null;
  if (min != null && spec.caratMax != null && spec.caratMax < min) return false;
  if (max != null && spec.caratMin != null && spec.caratMin > max) return false;
  return true;
}

function avgCarat(spec: RequirementSpec): number | null {
  if (spec.caratMin != null && spec.caratMax != null) return (spec.caratMin + spec.caratMax) / 2;
  return spec.caratMin ?? spec.caratMax ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!requireAdminAnalytics(session?.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const {
      users = [],
      companies = [],
      states = [],
      shapes = [],
      caratRange = {},
      clarityGrades = [],
      colourWhite = [],
      colourFancy = [],
      dateRange = {},
      labs = [],
    } = await req.json();

    const whereClause: {
      employeeId?: { in: string[] };
      customerName?: { in: string[] };
      state?: { in: string[] };
      requirementDate?: { gte?: Date; lte?: Date };
    } = {};

    if (users.length > 0) {
      whereClause.employeeId = { in: users };
    }

    if (companies.length > 0) {
      whereClause.customerName = { in: companies };
    }

    if (states.length > 0) {
      whereClause.state = { in: states };
    }

    if (dateRange.startDate || dateRange.endDate) {
      whereClause.requirementDate = {};
      if (dateRange.startDate) {
        whereClause.requirementDate.gte = startOfDay(new Date(dateRange.startDate));
      }
      if (dateRange.endDate) {
        whereClause.requirementDate.lte = endOfDay(new Date(dateRange.endDate));
      }
    }

    const raw = await prisma.requirement.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        customerName: true,
        description: true,
        createdAt: true,
      },
    });

    const parsed: ParsedRow[] = raw
      .map((r) => {
        const { spec } = parseRequirementDescription(r.description);
        return { id: r.id, customerName: r.customerName, createdAt: r.createdAt, spec };
      })
      .filter((r) =>
        specMatchesFilters(
          r.spec,
          shapes,
          caratRange,
          clarityGrades,
          colourWhite,
          colourFancy,
          labs
        )
      );

    const requirementsTimeSeries = parsed.reduce(
      (acc: { date: string; value: number }[], row) => {
        const dateKey = format(new Date(row.createdAt), 'yyyy-MM-dd');
        const existing = acc.find((e) => e.date === dateKey);
        if (existing) existing.value += 1;
        else acc.push({ date: dateKey, value: 1 });
        return acc;
      },
      []
    );

    const shapeBreakdown: Record<string, { name: string; count: number }> = {};
    parsed.forEach((row) => {
      const shape = row.spec?.shape || 'Unknown';
      if (!shapeBreakdown[shape]) shapeBreakdown[shape] = { name: shape, count: 0 };
      shapeBreakdown[shape].count += 1;
    });

    const caratRanges = [
      { label: '< 0.5ct', min: 0, max: 0.5 },
      { label: '0.5-1.0ct', min: 0.5, max: 1.0 },
      { label: '1.0-2.0ct', min: 1.0, max: 2.0 },
      { label: '2.0-3.0ct', min: 2.0, max: 3.0 },
      { label: '> 3.0ct', min: 3.0, max: Infinity },
    ];

    const caratBreakdown = caratRanges.map((range) => ({
      name: range.label,
      count: parsed.filter((row) => {
        const carat = row.spec ? avgCarat(row.spec) : null;
        if (carat == null) return false;
        return carat >= range.min && carat < range.max;
      }).length,
    }));

    const colourBreakdown: Record<string, { name: string; count: number }> = {};
    parsed.forEach((row) => {
      const colors =
        row.spec?.colorType === 'white'
          ? row.spec.colorWhite
          : row.spec?.colorFancy ?? [];
      if (!colors.length) {
        const key = 'Any';
        if (!colourBreakdown[key]) colourBreakdown[key] = { name: key, count: 0 };
        colourBreakdown[key].count += 1;
        return;
      }
      colors.forEach((colour) => {
        if (!colourBreakdown[colour]) colourBreakdown[colour] = { name: colour, count: 0 };
        colourBreakdown[colour].count += 1;
      });
    });

    const clarityBreakdown: Record<string, { name: string; count: number }> = {};
    parsed.forEach((row) => {
      const clarities = row.spec?.clarity?.length ? row.spec.clarity : ['Any'];
      clarities.forEach((clarity) => {
        if (!clarityBreakdown[clarity]) clarityBreakdown[clarity] = { name: clarity, count: 0 };
        clarityBreakdown[clarity].count += 1;
      });
    });

    const monthlyTrend = parsed.reduce(
      (acc: { month: string; count: number }[], row) => {
        const monthKey = format(new Date(row.createdAt), 'yyyy-MM');
        const existing = acc.find((e) => e.month === monthKey);
        if (existing) existing.count += 1;
        else acc.push({ month: monthKey, count: 1 });
        return acc;
      },
      []
    );

    const carats = parsed
      .map((r) => (r.spec ? avgCarat(r.spec) : null))
      .filter((c): c is number => c != null);

    const totalRequirements = parsed.length;
    const avgCaratRequested =
      carats.length > 0 ? carats.reduce((a, b) => a + b, 0) / carats.length : 0;
    const uniqueClients = new Set(parsed.map((r) => r.customerName)).size;

    const mostRequestedShape =
      Object.entries(shapeBreakdown).sort(([, a], [, b]) => b.count - a.count)[0]?.[0] || 'N/A';
    const mostRequestedClarity =
      Object.entries(clarityBreakdown).sort(([, a], [, b]) => b.count - a.count)[0]?.[0] || 'N/A';

    return NextResponse.json({
      timeSeries: requirementsTimeSeries,
      shapeBreakdown: Object.values(shapeBreakdown),
      caratBreakdown,
      colourBreakdown: Object.values(colourBreakdown),
      clarityBreakdown: Object.values(clarityBreakdown),
      monthlyTrend,
      summary: {
        totalRequirements,
        avgCaratRequested,
        uniqueClients,
        mostRequestedShape,
        mostRequestedClarity,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching requirements analytics data: ${errorMessage}`);
    return NextResponse.json({ error: 'Failed to fetch requirements data' }, { status: 500 });
  }
}
