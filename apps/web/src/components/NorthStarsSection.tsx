import type React from "react";
import { StarRow } from "./StarRow";
import type { BlueshiftStar } from "@proj/shared";

export function NorthStarsSection({
  northStars,
  inFocusCount,
  starError,
  onSelect,
  onToggle,
  onDelete,
}: {
  readonly northStars: readonly BlueshiftStar[];
  readonly inFocusCount: string;
  readonly starError?: string;
  readonly onSelect: (star: BlueshiftStar) => void;
  readonly onToggle: (star: BlueshiftStar, completed: boolean) => void;
  readonly onDelete: (star: BlueshiftStar) => void;
}): React.JSX.Element {
  return (
    <section aria-labelledby="north-stars-heading" className="mb-8 rounded-3xl bg-ink p-5 text-paper shadow-xl sm:p-7">
      <div className="mb-5 flex items-center justify-between">
        <h2 id="north-stars-heading" className="font-display text-2xl font-bold">
          {"North Stars"}
        </h2>
        <span className="font-mono text-xs text-paper/60">{inFocusCount}</span>
      </div>
      {Boolean(starError) && (
        <p role="alert" className="mb-4 rounded-xl bg-accent/20 p-3 text-sm text-paper">
          {"Couldn't save a Star: "}
          {starError}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {northStars.map((star: BlueshiftStar) => (
          <StarRow
            key={star.id}
            star={star}
            dark
            onSelect={() => {
              onSelect(star);
            }}
            onToggle={(completed: boolean) => {
              onToggle(star, completed);
            }}
            onDelete={() => {
              onDelete(star);
            }}
          />
        ))}
      </div>
    </section>
  );
}
