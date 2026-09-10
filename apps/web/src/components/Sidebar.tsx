import type React from "react";
import { ShiftRow } from "./ShiftRow";
import type { Blueshift, Redshift } from "@proj/shared";
import type { Kind, Selected } from "#lib/kinds";

export function Sidebar({
  blueshifts,
  redshifts,
  selected,
  onSelect,
  onDelete,
  deleteErrors,
}: {
  readonly blueshifts: readonly Blueshift[];
  readonly redshifts: readonly Redshift[];
  readonly selected: Selected;
  readonly onSelect: (kind: Kind, id: string) => void;
  readonly onDelete: (kind: Kind, id: string, name: string) => void;
  readonly deleteErrors: { readonly blueshift?: string; readonly redshift?: string };
}): React.JSX.Element {
  return (
    <aside className="rounded-3xl border border-line bg-paper p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-blue">{"Blueshifts"}</h2>
        <span className="font-mono text-xs text-muted">{blueshifts.length}</span>
      </div>
      <div className="space-y-2">
        {blueshifts.map((item: Blueshift) => (
          <ShiftRow
            key={item.id}
            kind="blueshift"
            name={item.name}
            goal={item.goal}
            selected={selected?.kind === "blueshift" && selected.id === item.id}
            onSelect={() => {
              onSelect("blueshift", item.id);
            }}
            onDelete={() => {
              onDelete("blueshift", item.id, item.name);
            }}
          />
        ))}
        {blueshifts.length === 0 && <p className="text-sm text-muted">{"None yet."}</p>}
      </div>
      {Boolean(deleteErrors.blueshift) && (
        <p role="alert" className="mt-4 rounded-xl bg-blue/10 p-3 text-sm text-blue">
          {"Couldn't delete the Blueshift: "}
          {deleteErrors.blueshift}
        </p>
      )}
      <div className="mb-4 mt-7 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-red">{"Redshifts"}</h2>
        <span className="font-mono text-xs text-muted">{redshifts.length}</span>
      </div>
      <div className="space-y-2">
        {redshifts.map((item: Redshift) => (
          <ShiftRow
            key={item.id}
            kind="redshift"
            name={item.name}
            goal={item.goal}
            selected={selected?.kind === "redshift" && selected.id === item.id}
            onSelect={() => {
              onSelect("redshift", item.id);
            }}
            onDelete={() => {
              onDelete("redshift", item.id, item.name);
            }}
          />
        ))}
        {redshifts.length === 0 && <p className="text-sm text-muted">{"None yet."}</p>}
      </div>
      {Boolean(deleteErrors.redshift) && (
        <p role="alert" className="mt-4 rounded-xl bg-red/10 p-3 text-sm text-red">
          {"Couldn't delete the Redshift: "}
          {deleteErrors.redshift}
        </p>
      )}
    </aside>
  );
}
