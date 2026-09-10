import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseGlossary } from "./parse";

const glossaryPath = join(import.meta.dir, "..", "..", "..", "CONTEXT.md");
const outputPath = join(import.meta.dir, "legend.json");

const entries = parseGlossary(readFileSync(glossaryPath, "utf8"));
writeFileSync(outputPath, `${JSON.stringify(entries, null, 2)}\n`);
process.stdout.write(`Wrote ${entries.length} legend entries to packages/legend/src/legend.json\n`);
