"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { RequirementSpec, ColorType } from "@/lib/requirements/types";
import {
  REQUIREMENT_SHAPES,
  CLARITY_GRADES,
  WHITE_COLOURS,
  FANCY_COLOURS,
  LAB_OPTIONS,
  GRADE_OPTIONS,
  FLUORESCENCE_OPTIONS,
} from "@/lib/requirements/constants";

interface RequirementEntryFormProps {
  spec: RequirementSpec;
  onChange: (spec: RequirementSpec) => void;
  disabled?: boolean;
}

/** Parse a stored range value like "D-G" into { start: "D", end: "G" } */
function parseStoredRange(stored: string[]): { start: string; end: string } {
  if (stored.length === 1 && stored[0].includes("-")) {
    const [s, e] = stored[0].split("-");
    return { start: s?.trim() ?? "", end: e?.trim() ?? "" };
  }
  if (stored.length === 2) {
    return { start: stored[0], end: stored[1] };
  }
  if (stored.length === 1) {
    return { start: stored[0], end: stored[0] };
  }
  return { start: "", end: "" };
}

/** Build the compact range value to store: "D-G" if start !== end, else ["D"] */
function buildRangeValue(start: string, end: string): string[] {
  if (!start && !end) return [];
  if (!start) return [end];
  if (!end) return [start];
  if (start === end) return [start];
  return [`${start}-${end}`];
}

export function RequirementEntryForm({ spec, onChange, disabled }: RequirementEntryFormProps) {
  const patch = (partial: Partial<RequirementSpec>) => onChange({ ...spec, ...partial });

  const whiteList = WHITE_COLOURS as readonly string[];
  const fancyList = FANCY_COLOURS as readonly string[];
  const clarityList = CLARITY_GRADES as readonly string[];

  // Parse current stored range values for display
  const whiteRange = parseStoredRange(spec.colorWhite);
  const fancyRange = parseStoredRange(spec.colorFancy);
  const clarityRange = parseStoredRange(spec.clarity);

  const handleWhiteStart = (val: string) => {
    const end = whiteRange.end || val;
    patch({ colorWhite: buildRangeValue(val, end) });
  };
  const handleWhiteEnd = (val: string) => {
    const start = whiteRange.start || val;
    patch({ colorWhite: buildRangeValue(start, val) });
  };
  const handleFancyStart = (val: string) => {
    const end = fancyRange.end || val;
    patch({ colorFancy: buildRangeValue(val, end) });
  };
  const handleFancyEnd = (val: string) => {
    const start = fancyRange.start || val;
    patch({ colorFancy: buildRangeValue(start, val) });
  };
  const handleClarityStart = (val: string) => {
    const end = clarityRange.end || val;
    patch({ clarity: buildRangeValue(val, end) });
  };
  const handleClarityEnd = (val: string) => {
    const start = clarityRange.start || val;
    patch({ clarity: buildRangeValue(start, val) });
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-slate-50/50">
      <h3 className="font-semibold text-sm text-slate-700">Diamond specification (4Cs)</h3>

      {/* Shape */}
      <div>
        <Label>Shape *</Label>
        <Select
          value={spec.shape || ""}
          onValueChange={(v) => patch({ shape: v })}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select shape" />
          </SelectTrigger>
          <SelectContent>
            {REQUIREMENT_SHAPES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Carat */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Carat min</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={spec.caratMin ?? ""}
            onChange={(e) =>
              patch({ caratMin: e.target.value === "" ? null : parseFloat(e.target.value) })
            }
            disabled={disabled}
            placeholder="e.g. 0.50"
          />
        </div>
        <div>
          <Label>Carat max</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={spec.caratMax ?? ""}
            onChange={(e) =>
              patch({ caratMax: e.target.value === "" ? null : parseFloat(e.target.value) })
            }
            disabled={disabled}
            placeholder="e.g. 2.00"
          />
        </div>
      </div>

      {/* Colour Type */}
      <div>
        <Label>Colour type</Label>
        <div className="flex gap-2 mt-1">
          {(["white", "fancy"] as ColorType[]).map((t) => (
            <Button
              key={t}
              type="button"
              size="sm"
              variant={spec.colorType === t ? "default" : "outline"}
              disabled={disabled}
              onClick={() =>
                patch({
                  colorType: t,
                  colorWhite: t === "white" ? spec.colorWhite : [],
                  colorFancy: t === "fancy" ? spec.colorFancy : [],
                })
              }
            >
              {t === "white" ? "White" : "Fancy"}
            </Button>
          ))}
        </div>
      </div>

      {/* White Colour Range */}
      {spec.colorType === "white" && (
        <div>
          <Label>White colour range</Label>
          <div className="grid grid-cols-2 gap-3 mt-1">
            <div>
              <span className="text-xs text-muted-foreground mb-1 block">From</span>
              <Select
                value={whiteRange.start || ""}
                onValueChange={handleWhiteStart}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Start" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {whiteList.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <span className="text-xs text-muted-foreground mb-1 block">To</span>
              <Select
                value={whiteRange.end || ""}
                onValueChange={handleWhiteEnd}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="End" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {whiteList.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {spec.colorWhite.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Selected: <span className="font-medium text-foreground">{spec.colorWhite.join(", ")}</span>
            </p>
          )}
        </div>
      )}

      {/* Fancy Colour Range */}
      {spec.colorType === "fancy" && (
        <div>
          <Label>Fancy colour range</Label>
          <div className="grid grid-cols-2 gap-3 mt-1">
            <div>
              <span className="text-xs text-muted-foreground mb-1 block">From</span>
              <Select
                value={fancyRange.start || ""}
                onValueChange={handleFancyStart}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Start" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {fancyList.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <span className="text-xs text-muted-foreground mb-1 block">To</span>
              <Select
                value={fancyRange.end || ""}
                onValueChange={handleFancyEnd}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="End" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {fancyList.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {spec.colorFancy.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Selected: <span className="font-medium text-foreground">{spec.colorFancy.join(", ")}</span>
            </p>
          )}
        </div>
      )}

      {/* Clarity Range */}
      <div>
        <Label>Clarity range</Label>
        <div className="grid grid-cols-2 gap-3 mt-1">
          <div>
            <span className="text-xs text-muted-foreground mb-1 block">From</span>
            <Select
              value={clarityRange.start || ""}
              onValueChange={handleClarityStart}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Start" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {clarityList.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className="text-xs text-muted-foreground mb-1 block">To</span>
            <Select
              value={clarityRange.end || ""}
              onValueChange={handleClarityEnd}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="End" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {clarityList.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {spec.clarity.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Selected: <span className="font-medium text-foreground">{spec.clarity.join(", ")}</span>
          </p>
        )}
      </div>

      {/* Cut / Polish / Symmetry */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label>Cut</Label>
          <Select value={spec.cut || "N/A"} onValueChange={(v) => patch({ cut: v })} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Cut" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_OPTIONS.map((g) => (
                <SelectItem key={`cut-${g}`} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Polish</Label>
          <Select
            value={spec.polish || "N/A"}
            onValueChange={(v) => patch({ polish: v })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Polish" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_OPTIONS.map((g) => (
                <SelectItem key={`pol-${g}`} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Symmetry</Label>
          <Select
            value={spec.symmetry || "N/A"}
            onValueChange={(v) => patch({ symmetry: v })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Symmetry" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_OPTIONS.map((g) => (
                <SelectItem key={`sym-${g}`} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fluorescence / Lab */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Fluorescence</Label>
          <Select
            value={spec.fluorescence || "N/A"}
            onValueChange={(v) => patch({ fluorescence: v })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FLUORESCENCE_OPTIONS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Lab</Label>
          <Select value={spec.lab || "Any"} onValueChange={(v) => patch({ lab: v })} disabled={disabled}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LAB_OPTIONS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
