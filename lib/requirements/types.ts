export type ColorType = 'white' | 'fancy';

export interface RequirementSpec {
  version: 2;
  shape: string;
  caratMin: number | null;
  caratMax: number | null;
  colorType: ColorType;
  colorWhite: string[];
  colorFancy: string[];
  clarity: string[];
  cut: string;
  polish: string;
  symmetry: string;
  fluorescence: string;
  lab: string;
}

export interface RequirementCreatePayload {
  masterId?: string | null;
  customerName: string;
  personName: string;
  state: string;
  country?: string;
  phoneNumber?: string;
  email?: string;
  requirementDate: string;
  notes?: string;
  budget?: number | null;
  spec: RequirementSpec; // Keep for compatibility if needed, though we will store an array
  specs?: RequirementSpec[];
}

export function defaultRequirementSpec(): RequirementSpec {
  return {
    version: 2,
    shape: '',
    caratMin: null,
    caratMax: null,
    colorType: 'white',
    colorWhite: [],
    colorFancy: [],
    clarity: [],
    cut: '',
    polish: '',
    symmetry: '',
    fluorescence: 'N/A',
    lab: 'Any',
  };
}

export function parseRange(value: string): { start: string; end: string } | null {
  if (!value) return null;
  const parts = value.split(/\s*-\s*/);
  if (parts.length === 2) {
    return { start: parts[0], end: parts[1] };
  }
  if (parts.length === 1) {
    return { start: parts[0], end: parts[0] };
  }
  return null;
}

export function expandRange(start: string, end: string, list: string[]): string[] {
  const startIndex = list.indexOf(start);
  const endIndex = list.indexOf(end);
  if (startIndex === -1 || endIndex === -1) {
    return [];
  }
  const minIndex = Math.min(startIndex, endIndex);
  const maxIndex = Math.max(startIndex, endIndex);
  return list.slice(minIndex, maxIndex + 1);
}

export function expandSpecField(values: string[], list: readonly string[] | string[]): string[] {
  if (!values || values.length === 0) return [];
  const expanded = new Set<string>();
  for (const val of values) {
    const range = parseRange(val);
    if (range) {
      const rangeList = expandRange(range.start, range.end, list as string[]);
      rangeList.forEach(item => expanded.add(item));
    } else {
      expanded.add(val);
    }
  }
  return Array.from(expanded);
}

export function parseRequirementDescription(description: string): {
  specs: RequirementSpec[] | null;
  spec: RequirementSpec | null;
  legacySummary: string | null;
} {
  if (!description?.trim()) {
    return { specs: null, spec: null, legacySummary: null };
  }
  try {
    const parsed = JSON.parse(description) as unknown;
    if (parsed && typeof parsed === 'object') {
      if ('version' in parsed && (parsed as RequirementSpec).version === 2) {
        const spec = parsed as RequirementSpec;
        return { specs: [spec], spec, legacySummary: null };
      }
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && parsed[0] && typeof parsed[0] === 'object' && 'version' in parsed[0] && parsed[0].version === 2) {
          const specs = parsed as RequirementSpec[];
          return { specs, spec: specs[0] || null, legacySummary: null };
        }
        const summary = parsed
          .map((item: Record<string, unknown>) => {
            const parts = [item.shape, item.carat, item.color, item.clarity, item.lab, item.stockId, item.lotB]
              .filter(Boolean);
            return parts.join(' · ');
          })
          .filter(Boolean)
          .join('; ');
        return { specs: null, spec: null, legacySummary: summary || 'Legacy requirement' };
      }
    }
  } catch {
    return { specs: null, spec: null, legacySummary: description };
  }
  return { specs: null, spec: null, legacySummary: description };
}

export function formatRequirementSpecSummary(spec: RequirementSpec): string {
  const colors =
    spec.colorType === 'white'
      ? spec.colorWhite.join(', ') || 'Any white'
      : spec.colorFancy.join(', ') || 'Any fancy';
  const carat =
    spec.caratMin != null && spec.caratMax != null
      ? `${spec.caratMin}–${spec.caratMax} ct`
      : spec.caratMin != null
        ? `${spec.caratMin}+ ct`
        : spec.caratMax != null
          ? `up to ${spec.caratMax} ct`
          : 'Any carat';
  return [
    spec.shape || 'Any shape',
    carat,
    colors,
    spec.clarity.length ? spec.clarity.join(', ') : 'Any clarity',
    spec.lab,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function formatRequirementSpecsSummary(specs: RequirementSpec[]): string {
  return specs.map(formatRequirementSpecSummary).join(' ; ');
}
