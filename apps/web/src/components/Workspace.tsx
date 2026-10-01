import type React from "react";
import { NorthStarsSection } from "./NorthStarsSection";
import { ShiftsArea } from "./ShiftsArea";
import type { Workspace as WorkspaceModel } from "#lib/workspace";
import type { ConfirmState, ModalKind, Selected } from "#lib/kinds";
import type { BlueshiftStar } from "@proj/shared";

export function Workspace({
  workspace,
  selected,
  modal,
  confirm,
  setSelected,
  setModal,
  confirmDelete,
}: {
  readonly workspace: WorkspaceModel;
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
        northStars={workspace.northStars}
        inFocusCount={workspace.northStarsError ? "—" : `${workspace.northStars.length.toString()} in focus`}
        starError={workspace.errors.latestStar("blueshift")}
        onSelect={(star: BlueshiftStar) => {
          setSelected({ kind: "blueshift", id: star.blueshiftId });
        }}
        onToggle={(star: BlueshiftStar, completed: boolean) => {
          workspace.ops.updateStar("blueshift", star.id, { completed });
        }}
        onDelete={(star: BlueshiftStar) => {
          confirmDelete(`Delete ${star.title}?`, () => {
            workspace.ops.deleteStar("blueshift", star.id);
          });
        }}
      />
      <ShiftsArea
        workspace={workspace}
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
