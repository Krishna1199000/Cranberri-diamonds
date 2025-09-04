import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SearchCriteria {
  page?: number;
  stoneId?: string;
  caratRange?: { from?: string; to?: string };
  priceRange?: { from?: string; to?: string };
  shapes?: string[];
  colors?: string[];
  clarities?: string[];
  cuts?: string[];
  labs?: string[];
  polishes?: string[];
  symmetries?: string[];
  locations?: string[];
}

interface WhereCondition {
  stockId?: { contains: string; mode: 'insensitive' };
  size?: { gte?: number; lte?: number };
  finalAmount?: { gte?: number; lte?: number };
  OR?: Array<{ [key: string]: { equals: string; mode: 'insensitive' } }>;
}

interface WhereClause {
  AND: WhereCondition[];
}

export async function POST(request: NextRequest) {
  try {
    let parsed: SearchCriteria = {};
    try {
      parsed = await request.json();
    } catch {
      parsed = {};
    }
    const { page = 1, ...searchCriteria } = parsed;
    const perPage = 40;
    const where = buildWhereClause(searchCriteria);

    const [diamonds, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.inventoryItem.count({ where })
    ]);

    return NextResponse.json({
      diamonds: diamonds.map(d => ({
        ...d,
        certificateNo: d.stockId, // Map stockId to certificateNo for UI compatibility
        size: d.size, // Already matches (carat)
        sym: d.sym, // Already matches
        floro: '', // Not available in inventory
        rapPrice: 0, // Not available in inventory
        rapAmount: 0, // Not available in inventory
        discount: 0, // Not available in inventory
      })),
      pagination: {
        total,
        pages: Math.ceil(total / perPage),
        currentPage: page,
        perPage
      }
    });
  } catch (error) {
    console.error('Search diamonds error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Failed to search diamonds' },
      { status: 500 }
    );
  }
}

function buildWhereClause(criteria: SearchCriteria): WhereClause | Record<string, never> {
  const where: WhereClause = { AND: [] };

  if (criteria.stoneId) {
    where.AND.push({ stockId: { contains: String(criteria.stoneId), mode: 'insensitive' } });
  }

  if (criteria.caratRange?.from || criteria.caratRange?.to) {
    const cond: Record<string, Record<string, number>> = { size: {} };
    if (criteria.caratRange.from) cond.size.gte = parseFloat(criteria.caratRange.from);
    if (criteria.caratRange.to) cond.size.lte = parseFloat(criteria.caratRange.to);
    where.AND.push(cond);
  }

  if (criteria.priceRange?.from || criteria.priceRange?.to) { 
    const cond: Record<string, Record<string, number>> = { finalAmount: {} };
    if (criteria.priceRange.from) cond.finalAmount.gte = parseFloat(criteria.priceRange.from);
    if (criteria.priceRange.to) cond.finalAmount.lte = parseFloat(criteria.priceRange.to);
    where.AND.push(cond);
  }

  // Handle array filters - only include if array has values
  const arrayFilters = {
    shapes: 'shape',
    colors: 'color',
    clarities: 'clarity',
    cuts: 'cut',
    labs: 'lab',
    polishes: 'polish',
    symmetries: 'sym'
  };

  Object.entries(arrayFilters).forEach(([criteriaKey, fieldName]) => {
    const values = criteria[criteriaKey];
    if (Array.isArray(values) && values.length > 0) {
      where.AND.push({ OR: values.map((v: string) => ({ [fieldName]: { equals: v, mode: 'insensitive' } })) });
    }
  });

  if (criteria.locations && Array.isArray(criteria.locations) && criteria.locations.length > 0) {
    where.AND.push({ OR: criteria.locations.map((loc: string) => ({ location: { equals: loc, mode: 'insensitive' } })) });
  }

  // If no AND conditions added, return empty where to fetch all
  if (where.AND.length === 0) {
    return {} as Record<string, never>;
  }
  return where;
}