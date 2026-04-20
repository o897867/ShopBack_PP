import type { LinkType } from "../types";

export const STROKE_COLORS: Record<LinkType, string> = {
  evolution: "#6366f1",
  causation: "#059669",
  contrast: "#d97706",
  resonance: "#e11d48",
};

export const TYPE_LABELS: Record<LinkType, string> = {
  evolution: "演化",
  causation: "因果",
  contrast: "对照",
  resonance: "共振",
};

export function dashArray(type: LinkType): string {
  switch (type) {
    case "evolution": return "none";
    case "causation": return "none";
    case "contrast":  return "6,4";
    case "resonance": return "2,3";
  }
}

export function hasArrow(type: LinkType): boolean {
  return type === "causation";
}

export function strengthOpacity(strength: number): number {
  if (strength >= 3) return 0.7;
  if (strength === 2) return 0.5;
  return 0.35;
}
