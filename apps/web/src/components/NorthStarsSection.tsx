import type React from "react";
import { useWorkspace } from "#lib/workspace";
import { Dimmed } from "./Dimmed";
import { StarRow } from "./StarRow";

export function NorthStarsSection(): React.JSX.Element {
  const workspace = useWorkspace();
  const inFocusCount = workspace.northStarsError ? "—" : `${workspace.northStars.length.toString()} in focus`;
  return (
    <section aria-labelledby="north-stars-heading" className="mb-8 rounded-3xl bg-ink p-5 text-paper shadow-xl sm:p-7">
      <Dimmed>
        <div className="mb-5 flex items-center justify-between">
          <h2 id="north-stars-heading" className="font-display text-2xl font-bold">
            {"North Stars"}
          </h2>
          <span className="font-mono text-xs text-paper/60">{inFocusCount}</span>
        </div>
        {Boolean(workspace.errors.latestStar("blueshift")) && (
          <p role="alert" className="mb-4 rounded-xl bg-accent/20 p-3 text-sm text-paper">
            {"Couldn't save a Star: "}
            {workspace.errors.latestStar("blueshift")}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {workspace.northStars.map((star) => (
            <StarRow
              key={star.id}
              star={star}
              dark
              onSelect={() => {
                workspace.select("blueshift", star.blueshiftId);
              }}
              onToggle={(completed: boolean) => {
                workspace.ops.updateStar("blueshift", star.id, { completed });
              }}
              onCollapse={() => {
                workspace.ops.updateStar("blueshift", star.id, { blackhole: true });
              }}
              collapseBlocked={workspace.blackholes.length > 0}
              onDelete={() => {
                workspace.confirmDelete(`Delete ${star.title}?`, () => {
                  workspace.ops.deleteStar("blueshift", star.id);
                });
              }}
            />
          ))}
        </div>
      </Dimmed>
    </section>
  );
}
