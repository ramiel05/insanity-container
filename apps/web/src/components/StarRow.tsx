import type React from "react";
import { TrashIcon } from "./icons";
import type { BlueshiftStar } from "@proj/shared";

export function StarRow({
  star,
  onToggle,
  onNorthStar,
  onCollapse,
  collapseBlocked = false,
  onSelect,
  onDelete,
  dark = false,
  blackhole = false,
}: {
  readonly star: BlueshiftStar;
  readonly onToggle: (value: boolean) => void;
  readonly onNorthStar?: (value: boolean) => void;
  readonly onCollapse?: () => void;
  readonly collapseBlocked?: boolean;
  readonly onSelect?: () => void;
  readonly onDelete: () => void;
  readonly dark?: boolean;
  readonly blackhole?: boolean;
}): React.JSX.Element {
  const completed = star.completedAt !== null;
  const border = blackhole
    ? "border-[5px] border-black bg-paper/10"
    : dark
      ? "border-paper/15 bg-paper/10"
      : "border-line";
  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-3 ${border}`}>
      <input
        aria-label={`Complete ${star.title}`}
        type="checkbox"
        checked={completed}
        onChange={(event) => {
          onToggle(event.target.checked);
        }}
        className="size-5 accent-blue"
      />
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          className={`min-w-0 flex-1 text-left ${completed ? "text-muted line-through" : ""}`}
        >
          <span className="block truncate">{star.title}</span>
          {blackhole && (
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-paper/50">
              {"Blackhole"}
            </span>
          )}
          {dark && !blackhole && (
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-paper/50">
              {"North Star"}
            </span>
          )}
        </button>
      ) : (
        <span className={`min-w-0 flex-1 ${completed ? "text-muted line-through" : ""}`}>
          <span className="block truncate">{star.title}</span>
        </span>
      )}
      {onNorthStar && (
        <button
          type="button"
          aria-label={star.northStar ? `Remove ${star.title} as North Star` : `Make ${star.title} a North Star`}
          onClick={() => {
            onNorthStar(!star.northStar);
          }}
          className={`text-xl ${star.northStar ? "text-blue" : "text-muted"}`}
        >
          {"★"}
        </button>
      )}
      {onCollapse && !completed && (
        <button
          type="button"
          aria-label={`Collapse ${star.title} into a Blackhole`}
          disabled={collapseBlocked}
          onClick={() => {
            onCollapse();
          }}
          className={`text-xl ${star.blackhole ? (dark ? "text-paper" : "text-ink") : "text-muted"} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {"●"}
        </button>
      )}
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
