import type React from "react";
import { TrashIcon } from "./icons";
import type { Kind } from "#lib/kinds";

export function ShiftRow({
  kind,
  name,
  goal,
  selected,
  onSelect,
  onDelete,
}: {
  readonly kind: Kind;
  readonly name: string;
  readonly goal: string | null;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly onDelete: () => void;
}): React.JSX.Element {
  const isRedshift = kind === "redshift";
  const selectedClass = isRedshift ? "bg-red/10 text-red" : "bg-blue/10 text-blue";
  const dotClass = isRedshift ? "bg-red" : "bg-blue";
  return (
    <div className={`group flex items-start gap-2 rounded-2xl p-3 ${selected ? selectedClass : "hover:bg-surface"}`}>
      <span className={`mt-2 size-2 shrink-0 rounded-full ${dotClass}`} />
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onSelect}>
        <strong className="block truncate">{name}</strong>
        {goal !== null && goal.length > 0 && <span className="mt-1 block truncate text-xs text-muted">{goal}</span>}
      </button>
      <button
        type="button"
        aria-label={`Delete ${name}`}
        title={`Delete ${isRedshift ? "Redshift" : "Blueshift"}`}
        onClick={onDelete}
        className="px-1 text-muted opacity-60 hover:text-accent"
      >
        <TrashIcon />
      </button>
    </div>
  );
}
