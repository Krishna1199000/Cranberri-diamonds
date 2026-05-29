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

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function RequirementEntryForm({ spec, onChange, disabled }: RequirementEntryFormProps) {
  const patch = (partial: Partial<RequirementSpec>) => onChange({ ...spec, ...partial });

  const colorOptions = spec.colorType === "white" ? WHITE_COLOURS : FANCY_COLOURS;
  const selectedColors = spec.colorType === "white" ? spec.colorWhite : spec.colorFancy;

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-slate-50/50">
      <h3 className="font-semibold text-sm text-slate-700">Diamond specification (4Cs)</h3>

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

      <div>
        <Label>{spec.colorType === "white" ? "White colours" : "Fancy colours"}</Label>
        <div className="flex flex-wrap gap-1.5 mt-2 max-h-32 overflow-y-auto">
          {colorOptions.map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={selectedColors.includes(c) ? "default" : "outline"}
              className="h-7 px-2 text-xs"
              disabled={disabled}
              onClick={() => {
                if (spec.colorType === "white") {
                  patch({ colorWhite: toggleInList(spec.colorWhite, c) });
                } else {
                  patch({ colorFancy: toggleInList(spec.colorFancy, c) });
                }
              }}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label>Clarity</Label>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {CLARITY_GRADES.map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={spec.clarity.includes(c) ? "default" : "outline"}
              className="h-7 px-2 text-xs"
              disabled={disabled}
              onClick={() => patch({ clarity: toggleInList(spec.clarity, c) })}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

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
