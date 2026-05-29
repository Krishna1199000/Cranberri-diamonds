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
  spec: RequirementSpec;
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

export function parseRequirementDescription(description: string): {
  spec: RequirementSpec | null;
  legacySummary: string | null;
} {
  if (!description?.trim()) {
    return { spec: null, legacySummary: null };
  }
  try {
    const parsed = JSON.parse(description) as unknown;
    if (parsed && typeof parsed === 'object' && 'version' in parsed && (parsed as RequirementSpec).version === 2) {
      return { spec: parsed as RequirementSpec, legacySummary: null };
    }
    if (Array.isArray(parsed)) {
      const summary = parsed
        .map((item: Record<string, unknown>) => {
          const parts = [item.shape, item.carat, item.color, item.clarity, item.lab, item.stockId, item.lotB]
            .filter(Boolean);
          return parts.join(' · ');
        })
        .filter(Boolean)
        .join('; ');
      return { spec: null, legacySummary: summary || 'Legacy requirement' };
    }
  } catch {
    return { spec: null, legacySummary: description };
  }
  return { spec: null, legacySummary: description };
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
