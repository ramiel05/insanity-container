import { legend } from "@proj/legend";

const DOMAIN_SECTION = "Language";

export default function Legend() {
  const entries = legend.filter((entry) => entry.section === DOMAIN_SECTION);
  return (
    <section aria-labelledby="legend-heading" className="mb-8 rounded-3xl border border-line bg-paper p-5">
      <h2 id="legend-heading" className="font-display text-xl font-bold">Legend</h2>
      <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {entries.map((entry) => (
          <div key={entry.term}>
            <dt className="text-sm font-bold">{entry.term}</dt>
            <dd className="mt-0.5 text-sm text-muted">{entry.definition}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
