import type React from "react";
import { SelectedPanel } from "./SelectedPanel";
import { Sidebar } from "./Sidebar";
import { starErrorsFor } from "#lib/hooks";
import type { WorkspaceQueries, ShiftMutations, StarMutations } from "#lib/hooks";
import type { Kind, Selected } from "#lib/kinds";
import type { BlueshiftStar, RedshiftStar } from "@proj/shared";

export function MainGrid({
  workspace,
  selected,
  shiftMutations,
  starMutations,
  onSelect,
  onDeleteShift,
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
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <Sidebar
        blueshifts={workspace.blueshifts.data ?? []}
        redshifts={workspace.redshifts.data ?? []}
        selected={selected}
        onSelect={onSelect}
        onDelete={onDeleteShift}
        deleteErrors={{
          blueshift: shiftMutations.deleteBlueshift.error?.message,
          redshift: shiftMutations.deleteRedshift.error?.message,
        }}
      />
      <section className="rounded-3xl border border-line bg-paper p-5 sm:p-7">
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
    </div>
  );
}
