import type React from "react";
import { useState } from "react";
import { useWorkspace } from "#lib/workspace";
import { StarRow } from "./StarRow";

export function BlueshiftPanel(): React.JSX.Element {
  const workspace = useWorkspace();
  const [title, setTitle] = useState<string>("");
  const [dismissedCreateError, setDismissedCreateError] = useState<string | null>(null);
  const blueshift = workspace.selectedShift("blueshift");
  if (!blueshift) throw new Error("BlueshiftPanel rendered without a selected Blueshift");
  const stars = workspace.starsOf("blueshift");
  const starError = workspace.errors.latestStar("blueshift");
  const starCreateError = workspace.errors.createStar("blueshift");
  const createError = starCreateError !== null && starCreateError !== dismissedCreateError ? starCreateError : null;
  const error = createError ?? starError;
  const valid = title.trim().length > 0;
  return (
    <>
      <div className="mb-7">
        <p className="font-mono text-xs uppercase tracking-widest text-blue">{"Selected Blueshift"}</p>
        <h2 className="mt-1 font-display text-3xl font-bold">{blueshift.name}</h2>
        {blueshift.goal !== null && blueshift.goal.length > 0 && (
          <p className="mt-2 max-w-xl text-muted">{blueshift.goal}</p>
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
          workspace.ops.createStar("blueshift", blueshift.id, title.trim());
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
        {stars.map((star) => (
          <StarRow
            key={star.id}
            star={star}
            onToggle={(completed: boolean) => {
              workspace.ops.updateStar("blueshift", star.id, { completed });
            }}
            onNorthStar={(northStar: boolean) => {
              workspace.ops.updateStar("blueshift", star.id, { northStar });
            }}
            onDelete={() => {
              workspace.confirmDelete(`Delete the Star "${star.title}"?`, () => {
                workspace.ops.deleteStar("blueshift", star.id);
              });
            }}
          />
        ))}
      </div>
    </>
  );
}
