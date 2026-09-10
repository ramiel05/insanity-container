import type React from "react";
import { SelectedPanel } from "./SelectedPanel";
import { ShiftColumn } from "./ShiftColumn";
import { starErrorsFor } from "#lib/star-hooks";
import type { WorkspaceQueries, ShiftMutations } from "#lib/hooks";
import type { StarMutations } from "#lib/star-hooks";
import type { Kind, Selected } from "#lib/kinds";
import type { BlueshiftStar, Magnitude, RedshiftStar } from "@proj/shared";

export function MainGrid({
  workspace,
  selected,
  shiftMutations,
  starMutations,
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
  readonly workspace: WorkspaceQueries;
  readonly selected: Selected;
  readonly shiftMutations: ShiftMutations;
  readonly starMutations: StarMutations;
  readonly onSelect: (kind: Kind, id: string) => void;
  readonly onDeleteShift: (kind: Kind, id: string, name: string) => void;
  readonly onSetMagnitude: (kind: Kind, id: string, magnitude: Magnitude) => void;
  readonly onCreateStar: (title: string) => void;
  readonly onCreateRedshiftStar: (title: string) => void;
  readonly onToggleStar: (star: BlueshiftStar, completed: boolean) => void;
  readonly onToggleRedshiftStar: (star: RedshiftStar, completed: boolean) => void;
  readonly onNorthStar: (star: BlueshiftStar, northStar: boolean) => void;
  readonly onDeleteStar: (star: BlueshiftStar) => void;
  readonly onDeleteRedshiftStar: (star: RedshiftStar) => void;
}): React.JSX.Element {
  const starErrors = {
    blueshift: starErrorsFor(starMutations.blueshift),
    redshift: starErrorsFor(starMutations.redshift),
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)_16rem]">
      <ShiftColumn
        kind="redshift"
        shifts={workspace.redshifts.data ?? []}
        selected={selected}
        onSelect={onSelect}
        onDelete={onDeleteShift}
        onMagnitude={onSetMagnitude}
        deleteError={shiftMutations.deleteRedshift.error?.message}
        className="order-1 lg:col-start-1 lg:order-none"
      />
      <section className="order-3 rounded-3xl border border-line bg-paper p-5 sm:p-7 lg:col-start-2 lg:order-none">
        <SelectedPanel
          selectedBlueshift={workspace.selectedBlueshift}
          selectedRedshift={workspace.selectedRedshift}
          stars={workspace.stars.data ?? []}
          redshiftStars={workspace.redshiftStars.data ?? []}
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
        shifts={workspace.blueshifts.data ?? []}
        selected={selected}
        onSelect={onSelect}
        onDelete={onDeleteShift}
        onMagnitude={onSetMagnitude}
        deleteError={shiftMutations.deleteBlueshift.error?.message}
        className="order-2 lg:col-start-3 lg:order-none"
      />
    </div>
  );
}
