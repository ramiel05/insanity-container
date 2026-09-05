export interface LegendEntry {
  section: string;
  term: string;
  definition: string;
}

const headingPattern = /^(#{1,6})\s+(.+)$/;
const termPattern = /^\*\*(.+?)\*\*:\s*$/;
const avoidPattern = /^_Avoid_:\s*(.*)$/;

/**
 * Parses the glossary from CONTEXT.md into an ordered list of Legend entries.
 * `_Avoid_` lines are editorial guidance and are excluded from the output.
 */
export function parseGlossary(source: string): LegendEntry[] {
  const entries: LegendEntry[] = [];
  let section = "";
  let term: string | null = null;
  let definitionLines: string[] = [];

  const flush = () => {
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
      section = heading[2].trim();
      continue;
    }
    const termMatch = termPattern.exec(line);
    if (termMatch) {
      flush();
      term = termMatch[1].trim();
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
