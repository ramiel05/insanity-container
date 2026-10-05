import type React from "react";
import { useWorkspace } from "#lib/workspace";
import { StarRow } from "./StarRow";

export function BlackholeSection(): React.JSX.Element | null {
  const workspace = useWorkspace();
  const blackhole = workspace.blackholes[0];
  if (!blackhole) return null;
  return (
    <section aria-labelledby="blackhole-heading" className="mb-8 rounded-3xl bg-ink p-5 text-paper shadow-xl sm:p-7">
      <h2 id="blackhole-heading" className="mb-5 font-display text-2xl font-bold">
        {"Blackhole"}
      </h2>
      <div className="flex justify-center">
        <StarRow
          key={blackhole.id}
          star={blackhole}
          dark
          blackhole
          onSelect={() => {
            workspace.select("blueshift", blackhole.blueshiftId);
          }}
          onToggle={(completed: boolean) => {
            workspace.ops.updateStar("blueshift", blackhole.id, { completed });
          }}
          onDelete={() => {
            workspace.confirmDelete(`Delete the Star "${blackhole.title}"?`, () => {
              workspace.ops.deleteStar("blueshift", blackhole.id);
            });
          }}
        />
      </div>
    </section>
  );
}
