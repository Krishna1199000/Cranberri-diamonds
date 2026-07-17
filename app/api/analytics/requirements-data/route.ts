import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { startOfDay, endOfDay, format } from 'date-fns';
import {
  parseRequirementDescription,
  type RequirementSpec,
  expandSpecField,
} from '@/lib/requirements/types';
import { CLARITY_GRADES, WHITE_COLOURS, FANCY_COLOURS } from '@/lib/requirements/constants';
import { requireAdminAnalytics } from '@/lib/analytics/filters';

type ParsedRow = {
  id: string;
  customerName: string;
  createdAt: Date;
  specs: RequirementSpec[] | null;
  spec: RequirementSpec | null;
};

function specsMatchFilters(
  specs: RequirementSpec[] | null,
  shapes: string[],
  caratRange: { min?: number | null; max?: number | null },
  clarityGrades: string[],
  colourWhite: string[],
  colourFancy: string[],
  labs: string[]
): boolean {
  if (!specs || specs.length === 0) return false;
  return specs.some((spec) => {
    if (shapes.length && spec.shape && !shapes.includes(spec.shape)) return false;
    
    const expandedClarity = expandSpecField(spec.clarity, CLARITY_GRADES);
    if (clarityGrades.length && expandedClarity.length) {
      if (!expandedClarity.some((c) => clarityGrades.includes(c))) return false;
    }
    
    const colorsList = spec.colorType === 'white' ? WHITE_COLOURS : FANCY_COLOURS;
    const expandedColors = expandSpecField(
      spec.colorType === 'white' ? spec.colorWhite : spec.colorFancy,
      colorsList
    );
    const colourFilter = [...colourWhite, ...colourFancy];
    if (colourFilter.length && expandedColors.length) {
      if (!expandedColors.some((c) => colourFilter.includes(c))) return false;
    }
    
    if (labs.length && spec.lab && spec.lab !== 'Any' && !labs.includes(spec.lab)) return false;
    const min = caratRange.min ?? null;
    const max = caratRange.max ?? null;
    if (min != null && spec.caratMax != null && spec.caratMax < min) return false;
    if (max != null && spec.caratMin != null && spec.caratMin > max) return false;
    return true;
  });
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
        const { specs, spec } = parseRequirementDescription(r.description);
        return { id: r.id, customerName: r.customerName, createdAt: r.createdAt, specs, spec };
      })
      .filter((r) =>
        specsMatchFilters(
          r.specs,
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
      (row.specs || [row.spec]).filter(Boolean).forEach((spec) => {
        const shape = spec?.shape || 'Unknown';
        if (!shapeBreakdown[shape]) shapeBreakdown[shape] = { name: shape, count: 0 };
        shapeBreakdown[shape].count += 1;
      });
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
        const specs = row.specs || (row.spec ? [row.spec] : []);
        return specs.some((spec) => {
          const carat = avgCarat(spec);
          if (carat == null) return false;
          return carat >= range.min && carat < range.max;
        });
      }).length,
    }));

    const colourBreakdown: Record<string, { name: string; count: number }> = {};
    parsed.forEach((row) => {
      (row.specs || (row.spec ? [row.spec] : [])).forEach((spec) => {
        const colors =
          spec?.colorType === 'white'
            ? (spec.colorWhite ?? [])
            : (spec?.colorFancy ?? []);
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
    });

    const clarityBreakdown: Record<string, { name: string; count: number }> = {};
    parsed.forEach((row) => {
      (row.specs || (row.spec ? [row.spec] : [])).forEach((spec) => {
        const clarities = spec?.clarity?.length ? spec.clarity : ['Any'];
        clarities.forEach((clarity) => {
          if (!clarityBreakdown[clarity]) clarityBreakdown[clarity] = { name: clarity, count: 0 };
          clarityBreakdown[clarity].count += 1;
        });
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
      .flatMap((r) => (r.specs || (r.spec ? [r.spec] : [])).map(avgCarat))
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
