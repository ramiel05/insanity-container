import type React from "react";
import { SelectedPanel } from "./SelectedPanel";
import { ShiftColumn } from "./ShiftColumn";
import type { Workspace } from "#lib/workspace";
import type { Kind, Selected } from "#lib/kinds";
import type { Magnitude } from "@proj/shared";

export function MainGrid({
  workspace,
  selected,
  onSelect,
  onDeleteShift,
  onSetMagnitude,
  onCreateStar,
  onCreateRedshiftStar,
  onToggleStar,
  onToggleRedshiftStar,
  onNorthStar,
  onDeleteStar,
  onDeleteRedshiftStar,
}: {
  readonly workspace: Workspace;
  readonly selected: Selected;
  readonly onSelect: (kind: Kind, id: string) => void;
  readonly onDeleteShift: (kind: Kind, id: string, name: string) => void;
  readonly onSetMagnitude: (kind: Kind, id: string, magnitude: Magnitude) => void;
  readonly onCreateStar: (title: string) => void;
  readonly onCreateRedshiftStar: (title: string) => void;
  readonly onToggleStar: (starId: string, completed: boolean) => void;
  readonly onToggleRedshiftStar: (starId: string, completed: boolean) => void;
  readonly onNorthStar: (starId: string, northStar: boolean) => void;
  readonly onDeleteStar: (starId: string, title: string) => void;
  readonly onDeleteRedshiftStar: (starId: string, title: string) => void;
}): React.JSX.Element {
  const starErrors = {
    blueshift: {
      latest: workspace.errors.latestStar("blueshift"),
      create: workspace.errors.createStar("blueshift"),
    },
    redshift: {
      latest: workspace.errors.latestStar("redshift"),
      create: workspace.errors.createStar("redshift"),
    },
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)_16rem]">
      <ShiftColumn
        kind="redshift"
        shifts={workspace.redshifts}
        selected={selected}
        onSelect={onSelect}
        onDelete={onDeleteShift}
        onMagnitude={onSetMagnitude}
        deleteError={workspace.errors.deleteShift("redshift")}
        className="order-1 lg:col-start-1 lg:order-none"
      />
      <section className="order-3 rounded-3xl border border-line bg-paper p-5 sm:p-7 lg:col-start-2 lg:order-none">
        <SelectedPanel
          selectedBlueshift={workspace.selectedBlueshift}
          selectedRedshift={workspace.selectedRedshift}
          stars={workspace.stars}
          redshiftStars={workspace.redshiftStars}
          timeZone={workspace.timeZone}
          starErrors={starErrors}
          onCreateStar={onCreateStar}
          onCreateRedshiftStar={onCreateRedshiftStar}
          onToggleStar={onToggleStar}
          onToggleRedshiftStar={onToggleRedshiftStar}
          onNorthStar={onNorthStar}
          onDeleteStar={onDeleteStar}
          onDeleteRedshiftStar={onDeleteRedshiftStar}
        />
      </section>
      <ShiftColumn
        kind="blueshift"
        shifts={workspace.blueshifts}
        selected={selected}
        onSelect={onSelect}
        onDelete={onDeleteShift}
        onMagnitude={onSetMagnitude}
        deleteError={workspace.errors.deleteShift("blueshift")}
        className="order-2 lg:col-start-3 lg:order-none"
      />
    </div>
  );
}
