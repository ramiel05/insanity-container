import type React from "react";
import { BlueshiftPanel } from "./BlueshiftPanel";
import { RedshiftPanel } from "./RedshiftPanel";
import { useWorkspace } from "#lib/workspace";

export function SelectedPanel(): React.JSX.Element {
  const workspace = useWorkspace();
  const selected = workspace.selected;
  if (selected?.kind === "blueshift" && workspace.selectedShift("blueshift")) {
    return <BlueshiftPanel />;
  }
  if (selected?.kind === "redshift" && workspace.selectedShift("redshift")) {
    return <RedshiftPanel />;
  }
  return (
    <div className="flex min-h-64 items-center justify-center" aria-label="No Blueshift or Redshift selected">
      <p className="text-muted">{"Select a Redshift or Blueshift to see its Stars."}</p>
    </div>
  );
}
