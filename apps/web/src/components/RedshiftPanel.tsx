import type React from "react";
import { useState } from "react";
import { useWorkspace } from "#lib/workspace";
import { Dimmed } from "./Dimmed";
import { RedshiftStarRow } from "./RedshiftStarRow";

export function RedshiftPanel(): React.JSX.Element {
  const workspace = useWorkspace();
  const [title, setTitle] = useState<string>("");
  const [fixed, setFixed] = useState<boolean>(true);
  const [dismissedCreateError, setDismissedCreateError] = useState<string | null>(null);
  const redshift = workspace.selectedShift("redshift");
  if (!redshift) throw new Error("RedshiftPanel rendered without a selected Redshift");
  const stars = workspace.starsOf("redshift");
  const starError = workspace.errors.latestStar("redshift");
  const starCreateError = workspace.errors.createStar("redshift");
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
      <Dimmed>
        <form
          className="mb-4 flex items-start gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!valid) return;
            workspace.ops.createStar("redshift", redshift.id, { title: title.trim(), fixed });
            setTitle("");
            setFixed(true);
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
          <label className="flex shrink-0 items-center gap-2 rounded-xl border border-line bg-surface p-3 text-sm">
            <input
              aria-label="Fixed"
              type="checkbox"
              checked={fixed}
              onChange={(event) => {
                setFixed(event.target.checked);
              }}
              className="size-5 accent-red"
            />
            {"Fixed"}
          </label>
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
            <RedshiftStarRow
              key={star.id}
              star={star}
              timeZone={workspace.timeZone}
              onToggle={(completed: boolean) => {
                workspace.ops.updateStar("redshift", star.id, { completed });
              }}
              onDelete={() => {
                workspace.confirmDelete(`Delete the Star "${star.title}"?`, () => {
                  workspace.ops.deleteStar("redshift", star.id);
                });
              }}
            />
          ))}
        </div>
      </Dimmed>
    </>
  );
}
