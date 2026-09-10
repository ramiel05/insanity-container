import type React from "react";
import { useState } from "react";
import { RedshiftStarRow } from "./RedshiftStarRow";
import type { Redshift, RedshiftStar } from "@proj/shared";

export function RedshiftPanel({
  redshift,
  stars,
  timeZone,
  starError,
  starCreateError,
  onCreateStar,
  onToggle,
  onDelete,
}: {
  readonly redshift: Redshift;
  readonly stars: readonly RedshiftStar[];
  readonly timeZone: string;
  readonly starError?: string;
  readonly starCreateError?: string;
  readonly onCreateStar: (title: string) => void;
  readonly onToggle: (star: RedshiftStar, completed: boolean) => void;
  readonly onDelete: (star: RedshiftStar) => void;
}): React.JSX.Element {
  const [title, setTitle] = useState<string>("");
  const [dismissedCreateError, setDismissedCreateError] = useState<string | null>(null);
  const createError = starCreateError !== null && starCreateError !== dismissedCreateError ? starCreateError : null;
  const error = createError ?? starError;
  const valid = title.trim().length > 0;
  return (
    <>
      <div className="mb-7">
        <p className="font-mono text-xs uppercase tracking-widest text-red">{"Selected Redshift"}</p>
        <h2 className="mt-1 font-display text-3xl font-bold">{redshift.name}</h2>
        {redshift.goal !== null && redshift.goal.length > 0 && (
          <p className="mt-2 max-w-xl text-muted">{redshift.goal}</p>
        )}
      </div>
      {Boolean(error) && (
        <p role="alert" className="mb-4 rounded-xl bg-accent/10 p-3 text-sm text-accent">
          {"Couldn't save a Star: "}
          {error}
        </p>
      )}
      <form
        className="mb-4 flex items-start gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid) return;
          onCreateStar(title.trim());
          setTitle("");
        }}
      >
        <input
          aria-label="New Star title"
          placeholder="New Star title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setDismissedCreateError(starCreateError ?? null);
          }}
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface p-3"
        />
        <button
          type="submit"
          disabled={!valid}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          className="rounded-xl bg-ink px-4 py-3 text-sm font-bold text-paper hover:bg-ink/90 disabled:opacity-50"
        >
          {"Add Star"}
        </button>
      </form>
      <div className="space-y-3">
        {stars.map((star: RedshiftStar) => (
          <RedshiftStarRow
            key={star.id}
            star={star}
            timeZone={timeZone}
            onToggle={(completed: boolean) => {
              onToggle(star, completed);
            }}
            onDelete={() => {
              onDelete(star);
            }}
          />
        ))}
      </div>
    </>
  );
}
