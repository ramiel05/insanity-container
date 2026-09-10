import type React from "react";
import { useState } from "react";
import { isTickedToday } from "#lib/day";
import { TrashIcon } from "./icons";
import type { RedshiftStar } from "@proj/shared";

export function RedshiftStarRow({
  star,
  timeZone,
  onToggle,
  onDelete,
}: {
  readonly star: RedshiftStar;
  readonly timeZone: string;
  readonly onToggle: (value: boolean) => void;
  readonly onDelete: () => void;
}): React.JSX.Element {
  const [now] = useState<number>(() => Date.now());
  const completed = isTickedToday(star.completedAt, now, timeZone);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line p-3">
      <input
        aria-label={`Complete ${star.title}`}
        type="checkbox"
        checked={completed}
        onChange={(event) => {
          onToggle(event.target.checked);
        }}
        className="size-5 accent-red"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{star.title}</span>
      </span>
      <button
        type="button"
        aria-label={`Delete ${star.title}`}
        title="Delete Star"
        onClick={onDelete}
        className="px-1 text-muted hover:text-accent"
      >
        <TrashIcon />
      </button>
    </div>
  );
}
