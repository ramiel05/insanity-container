import type { Magnitude } from "@proj/shared";

export const MAGNITUDE_ORDER: readonly Magnitude[] = [1, 2, 3, 4];

const MAGNITUDE_LABELS: Readonly<Record<Magnitude, string>> = {
  1: "First Magnitude",
  2: "Second Magnitude",
  3: "Third Magnitude",
  4: "Fourth Magnitude",
};

const MAGNITUDE_SHORT_LABELS: Readonly<Record<Magnitude, string>> = {
  1: "First",
  2: "Second",
  3: "Third",
  4: "Fourth",
};

export function magnitudeLabel(magnitude: Magnitude): string {
  const label = MAGNITUDE_LABELS[magnitude];
  if (typeof label !== "string") throw new Error(`Unknown Magnitude: ${magnitude}`);
  return label;
}

export function magnitudeShortLabel(magnitude: Magnitude): string {
  const label = MAGNITUDE_SHORT_LABELS[magnitude];
  if (typeof label !== "string") throw new Error(`Unknown Magnitude: ${magnitude}`);
  return label;
}
