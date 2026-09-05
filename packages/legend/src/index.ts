import legendJson from "./legend.json";
import type { LegendEntry } from "./parse";

export { parseGlossary } from "./parse";
export type { LegendEntry } from "./parse";

export const legend = legendJson as LegendEntry[];
