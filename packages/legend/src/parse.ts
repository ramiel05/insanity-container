export interface LegendEntry {
  section: string;
  term: string;
  definition: string;
}

const headingPattern = /^(#{1,6})\s+(.+)$/u;
const termPattern = /^\*\*(.+?)\*\*:\s*$/u;
const avoidPattern = /^_Avoid_:\s*(.*)$/u;

/**
 * Parses the glossary from CONTEXT.md into an ordered list of Legend entries.
 * `_Avoid_` lines are editorial guidance and are excluded from the output.
 */
export function parseGlossary(source: string): LegendEntry[] {
  const entries: LegendEntry[] = [];
  let section = "";
  let term: string | null = null;
  let definitionLines: string[] = [];

  const flush = (): void => {
    if (term !== null && definitionLines.length > 0) {
      entries.push({ section, term, definition: definitionLines.join(" ").trim() });
    }
    term = null;
    definitionLines = [];
  };

  for (const line of source.split("\n")) {
    const heading = headingPattern.exec(line);
    if (heading) {
      flush();
      const title = heading[2];
      if (typeof title !== "string") {
        throw new Error("headingPattern always captures group 2");
      }
      section = title.trim();
      continue;
    }
    const termMatch = termPattern.exec(line);
    if (termMatch) {
      flush();
      const name = termMatch[1];
      if (typeof name !== "string") {
        throw new Error("termPattern always captures group 1");
      }
      term = name.trim();
      continue;
    }
    if (line.trim() === "") {
      continue;
    }
    if (avoidPattern.test(line)) {
      // _Avoid_ lines close the definition and are themselves excluded.
      flush();
      continue;
    }
    if (term === null) {
      // Prose outside any term (intro paragraphs, post-avoid lines) is ignored.
      continue;
    }
    definitionLines.push(line.trim());
  }
  flush();

  return entries;
}
