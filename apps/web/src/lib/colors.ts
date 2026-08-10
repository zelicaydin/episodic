export interface Tier { min: number; bg: string; text: string; label: string; standout: boolean; }

export const TIERS: Tier[] = [
  { min: 9.5, bg: "#22c55e", text: "#052e16", label: "9.5+", standout: true },
  { min: 9.0, bg: "#14532d", text: "#86efac", label: "9 to 9.5", standout: false },
  { min: 8.5, bg: "#166534", text: "#86efac", label: "8.5 to 9", standout: false },
  { min: 8.0, bg: "#3f6212", text: "#bef264", label: "8 to 8.5", standout: false },
  { min: 7.0, bg: "#713f12", text: "#fde68a", label: "7 to 8", standout: false },
  { min: 6.0, bg: "#7f1d1d", text: "#fca5a5", label: "6 to 7", standout: false },
  { min: 5.0, bg: "#831843", text: "#f9a8d4", label: "5 to 6", standout: false },
  { min: 0, bg: "#4c1d95", text: "#c4b5fd", label: "< 5 ☠", standout: false },
];

export function tierFor(rating: number | null): Tier | null {
  if (rating === null) return null;
  return TIERS.find((t) => rating >= t.min) ?? null;
}
