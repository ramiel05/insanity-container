import type React from "react";
import { NorthStarsSection } from "./NorthStarsSection";
import { ShiftsArea } from "./ShiftsArea";
import { latestMutationError } from "#lib/star-hooks";
import type { WorkspaceQueries, ShiftMutations } from "#lib/hooks";
import type { StarMutations } from "#lib/star-hooks";
import type { ConfirmState, ModalKind, Selected } from "#lib/kinds";
import type { BlueshiftStar } from "@proj/shared";

export function Workspace({
  workspace,
  shiftMutations,
  starMutations,
  selected,
  modal,
  confirm,
  setSelected,
  setModal,
  confirmDelete,
}: {
  readonly workspace: WorkspaceQueries;
  readonly shiftMutations: ShiftMutations;
  readonly starMutations: StarMutations;
  readonly selected: Selected;
  readonly modal: ModalKind;
  readonly confirm: ConfirmState | null;
  readonly setSelected: (selected: Selected) => void;
  readonly setModal: (modal: ModalKind) => void;
  readonly confirmDelete: (message: string, action: () => void) => void;
}): React.JSX.Element {
  return (
    <>
      <NorthStarsSection
        northStars={workspace.northStars.data ?? []}
        inFocusCount={
          workspace.northStars.isError ? "—" : `${(workspace.northStars.data?.length ?? 0).toString()} in focus`
        }
        starError={latestMutationError(Object.values(starMutations.blueshift))}
        onSelect={(star: BlueshiftStar) => {
          setSelected({ kind: "blueshift", id: star.blueshiftId });
        }}
        onToggle={(star: BlueshiftStar, completed: boolean) => {
          starMutations.blueshift.updateStar.mutate({ id: star.id, completed });
        }}
        onDelete={(star: BlueshiftStar) => {
          confirmDelete(`Delete ${star.title}?`, () => {
            starMutations.blueshift.deleteStar.mutate(star.id);
          });
        }}
      />
      <ShiftsArea
        workspace={workspace}
        shiftMutations={shiftMutations}
        starMutations={starMutations}
        selected={selected}
        modal={modal}
        confirm={confirm}
        setSelected={setSelected}
        setModal={setModal}
        confirmDelete={confirmDelete}
      />
    </>
  );
}
