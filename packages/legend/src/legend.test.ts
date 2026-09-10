import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { legend } from "./index";
import { parseGlossary } from "./parse";

const repoRoot = join(import.meta.dir, "..", "..", "..");
const glossary = readFileSync(join(repoRoot, "CONTEXT.md"), "utf8");
const generated: unknown = JSON.parse(readFileSync(join(import.meta.dir, "legend.json"), "utf8"));

describe("parseGlossary", () => {
  test("emits ordered entries tagged by section", () => {
    const entries = parseGlossary(
      [
        "# Title",
        "",
        "Intro prose is ignored.",
        "",
        "## Language",
        "",
        "**Thing**:",
        "First line of the definition",
        "continues on a second line.",
        "_Avoid_: Nope, nope",
        "",
        "**Other**:",
        "Short definition.",
        "_Avoid_: Nope",
        "",
        "### Meta",
        "",
        "**Meta-Thing**:",
        "A meta definition.",
        "_Avoid_: Nope",
        "",
      ].join("\n"),
    );

    expect(entries).toEqual([
      { section: "Language", term: "Thing", definition: "First line of the definition continues on a second line." },
      { section: "Language", term: "Other", definition: "Short definition." },
      { section: "Meta", term: "Meta-Thing", definition: "A meta definition." },
    ]);
  });

  test("excludes _Avoid_ lines and ignores prose outside terms", () => {
    const entries = parseGlossary("## S\n\n**A**:\nDef.\n_Avoid_: Bad\n\nLoose prose.\n");
    expect(entries).toEqual([{ section: "S", term: "A", definition: "Def." }]);
  });
});

describe("drift guard", () => {
  test("checked-in legend.json exactly matches a fresh parse of the glossary", () => {
    expect(generated).toEqual(parseGlossary(glossary));
  });

  test("generated artifact covers domain and meta concepts", () => {
    const terms = legend.map((entry) => entry.term);
    for (const domain of ["Blueshift", "Star", "North Star"]) {
      expect(terms).toContain(domain);
    }
    for (const meta of ["Atlas", "Legend", "Guide"]) {
      expect(terms).toContain(meta);
    }
    expect(new Set(legend.map((entry) => entry.section))).toEqual(new Set(["Language", "Atlas"]));
  });
});
