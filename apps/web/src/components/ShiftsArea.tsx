import type React from "react";
import { AppModals } from "./AppModals";
import { MainGrid } from "./MainGrid";
import type { Workspace } from "#lib/workspace";
import type { ConfirmState, Kind, ModalKind, Selected } from "#lib/kinds";
import type { Magnitude } from "@proj/shared";

export function ShiftsArea({
  workspace,
  selected,
  modal,
  confirm,
  setSelected,
  setModal,
  confirmDelete,
}: {
  readonly workspace: Workspace;
  readonly selected: Selected;
  readonly modal: ModalKind;
  readonly confirm: ConfirmState | null;
  readonly setSelected: (selected: Selected) => void;
  readonly setModal: (modal: ModalKind) => void;
  readonly confirmDelete: (message: string, action: () => void) => void;
}): React.JSX.Element {
  return (
    <>
      <MainGrid
        workspace={workspace}
        selected={selected}
        onSelect={(kind, id) => {
          setSelected({ kind, id });
        }}
        onDeleteShift={(kind, id, name) => {
          confirmDelete(`Delete the ${kind === "blueshift" ? "Blueshift" : "Redshift"} "${name}"?`, () => {
            workspace.ops.deleteShift(kind, id);
          });
        }}
        onSetMagnitude={(kind: Kind, id: string, magnitude: Magnitude) => {
          workspace.ops.updateShift(kind, id, { magnitude });
        }}
        onCreateStar={(title: string) => {
          const blueshift = workspace.selectedBlueshift;
          if (!blueshift) throw new Error("Cannot create a Star without a selected Blueshift");
          workspace.ops.createStar("blueshift", blueshift.id, title);
        }}
        onCreateRedshiftStar={(title: string) => {
          const redshift = workspace.selectedRedshift;
          if (!redshift) throw new Error("Cannot create a Star without a selected Redshift");
          workspace.ops.createStar("redshift", redshift.id, title);
        }}
        onToggleStar={(starId: string, completed: boolean) => {
          workspace.ops.updateStar("blueshift", starId, { completed });
        }}
        onToggleRedshiftStar={(starId: string, completed: boolean) => {
          workspace.ops.updateStar("redshift", starId, { completed });
        }}
        onNorthStar={(starId: string, northStar: boolean) => {
          workspace.ops.updateStar("blueshift", starId, { northStar });
        }}
        onDeleteStar={(starId: string, title: string) => {
          confirmDelete(`Delete the Star "${title}"?`, () => {
            workspace.ops.deleteStar("blueshift", starId);
          });
        }}
        onDeleteRedshiftStar={(starId: string, title: string) => {
          confirmDelete(`Delete the Star "${title}"?`, () => {
            workspace.ops.deleteStar("redshift", starId);
          });
        }}
      />
      <AppModals
        workspace={workspace}
        modal={modal}
        confirm={confirm}
        onClose={() => {
          setModal(null);
        }}
      />
    </>
  );
}
