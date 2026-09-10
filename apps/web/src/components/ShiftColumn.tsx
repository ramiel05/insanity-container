import type React from "react";
import { ShiftRow } from "./ShiftRow";
import { magnitudeLabel, MAGNITUDE_ORDER } from "#lib/magnitude";
import type { Kind, Selected } from "#lib/kinds";
import type { Blueshift, Magnitude, Redshift } from "@proj/shared";

type Shift = Blueshift | Redshift;

export function ShiftColumn({
  kind,
  shifts,
  selected,
  onSelect,
  onDelete,
  onMagnitude,
  deleteError,
  className,
}: {
  readonly kind: Kind;
  readonly shifts: readonly Shift[];
  readonly selected: Selected;
  readonly onSelect: (kind: Kind, id: string) => void;
  readonly onDelete: (kind: Kind, id: string, name: string) => void;
  readonly onMagnitude: (kind: Kind, id: string, magnitude: Magnitude) => void;
  readonly deleteError?: string;
  readonly className?: string;
}): React.JSX.Element {
  const isRedshift = kind === "redshift";
  const title = isRedshift ? "Redshifts" : "Blueshifts";
  const headingClass = isRedshift ? "text-red" : "text-blue";
  const errorClass = isRedshift ? "bg-red/10 text-red" : "bg-blue/10 text-blue";
  return (
    <aside className={`rounded-3xl border border-line bg-paper p-5 ${className ?? ""}`} aria-label={title}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className={`font-display text-xl font-bold ${headingClass}`}>{title}</h2>
        <span className="font-mono text-xs text-muted">{shifts.length}</span>
      </div>
      <div className="space-y-4">
        {MAGNITUDE_ORDER.map((magnitude) => {
          const inTier = shifts.filter((shift) => shift.magnitude === magnitude);
          if (inTier.length === 0) return null;
          return (
            <section key={magnitude} aria-label={magnitudeLabel(magnitude)}>
              <h3 className="mb-1 font-mono text-xs uppercase tracking-widest text-muted">
                {magnitudeLabel(magnitude)}
              </h3>
              <div className="space-y-2">
                {inTier.map((shift) => (
                  <ShiftRow
                    key={shift.id}
                    kind={kind}
                    name={shift.name}
                    goal={shift.goal}
                    magnitude={shift.magnitude}
                    selected={selected?.kind === kind && selected.id === shift.id}
                    onSelect={() => {
                      onSelect(kind, shift.id);
                    }}
                    onDelete={() => {
                      onDelete(kind, shift.id, shift.name);
                    }}
                    onMagnitude={(next) => {
                      onMagnitude(kind, shift.id, next);
                    }}
                  />
                ))}
              </div>
            </section>
          );
        })}
        {shifts.length === 0 && <p className="text-sm text-muted">{"None yet."}</p>}
      </div>
      {Boolean(deleteError) && (
        <p role="alert" className={`mt-4 rounded-xl p-3 text-sm ${errorClass}`}>
          {`Couldn't delete the ${isRedshift ? "Redshift" : "Blueshift"}: `}
          {deleteError}
        </p>
      )}
    </aside>
  );
}
