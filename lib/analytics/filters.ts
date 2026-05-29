import { startOfDay, endOfDay, differenceInDays } from 'date-fns';

export interface AnalyticsFilterInput {
  users?: string[];
  companies?: string[];
  states?: string[];
  shapes?: string[];
  caratRange?: { min?: number | null; max?: number | null };
  clarityGrades?: string[];
  colourWhite?: string[];
  colourFancy?: string[];
  dateRange?: { startDate?: string | Date | null; endDate?: string | Date | null };
  labs?: string[];
}

export function requireAdminAnalytics(role: string | undefined): boolean {
  return role === 'admin';
}

export function buildDocumentWhereClause(filters: AnalyticsFilterInput) {
  const where: Record<string, unknown> = {};
  const itemFilters: Record<string, unknown> = {};

  const users = filters.users ?? [];
  const companies = filters.companies ?? [];
  const states = filters.states ?? [];

  if (users.length > 0) {
    where.userId = { in: users };
  }

  if (companies.length > 0) {
    where.shipmentId = { in: companies };
  }

  if (states.length > 0) {
    where.OR = [
      { state: { in: states } },
      { country: { in: states } },
    ];
  }

  const { dateRange } = filters;
  if (dateRange?.startDate || dateRange?.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (dateRange.startDate) {
      dateFilter.gte = startOfDay(new Date(dateRange.startDate));
    }
    if (dateRange.endDate) {
      dateFilter.lte = endOfDay(new Date(dateRange.endDate));
    }
    where.date = dateFilter;
  }

  const shapes = filters.shapes ?? [];
  if (shapes.length > 0) {
    itemFilters.shape = { in: shapes };
  }

  const caratRange = filters.caratRange ?? {};
  if (caratRange.min != null || caratRange.max != null) {
    const carat: Record<string, number> = {};
    if (caratRange.min != null) carat.gte = caratRange.min;
    if (caratRange.max != null) carat.lte = caratRange.max;
    itemFilters.carat = carat;
  }

  const clarityGrades = filters.clarityGrades ?? [];
  if (clarityGrades.length > 0) {
    itemFilters.clarity = { in: clarityGrades };
  }

  const colourWhite = filters.colourWhite ?? [];
  const colourFancy = filters.colourFancy ?? [];
  if (colourWhite.length > 0 || colourFancy.length > 0) {
    itemFilters.color = { in: [...colourWhite, ...colourFancy] };
  }

  const labs = filters.labs ?? [];
  if (labs.length > 0) {
    itemFilters.lab = { in: labs };
  }

  if (Object.keys(itemFilters).length > 0) {
    where.items = { some: itemFilters };
  }

  return { where, itemFilters };
}

export function toDateOnly(d: Date): Date {
  return startOfDay(new Date(d));
}

export function isPastDueDate(dueDate: Date, now = new Date()): boolean {
  return toDateOnly(now) > toDateOnly(dueDate);
}

export function daysOverdueFromDue(dueDate: Date, now = new Date()): number {
  return Math.max(0, differenceInDays(toDateOnly(now), toDateOnly(dueDate)));
}

export function getMemoExpiryDate(memo: {
  date: Date;
  dueDate?: Date | null;
  memoTerms?: number | null;
  paymentTerms?: number | null;
}): Date {
  if (memo.dueDate) return new Date(memo.dueDate);
  const expiry = new Date(memo.date);
  expiry.setDate(expiry.getDate() + (memo.memoTerms ?? memo.paymentTerms ?? 30));
  return expiry;
}
