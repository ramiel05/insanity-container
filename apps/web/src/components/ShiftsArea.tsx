import type React from "react";
import { AppModals } from "./AppModals";
import { MainGrid } from "./MainGrid";
import type { WorkspaceQueries, ShiftMutations, StarMutations } from "#lib/hooks";
import type { ConfirmState, Kind, ModalKind, Selected } from "#lib/kinds";
import type { BlueshiftStar, RedshiftStar } from "@proj/shared";

export function ShiftsArea({
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
      <MainGrid
        workspace={workspace}
        selected={selected}
        shiftMutations={shiftMutations}
        starMutations={starMutations}
        onSelect={(kind: Kind, id: string) => {
          setSelected({ kind, id });
        }}
        onDeleteShift={(kind: Kind, id: string, name: string) => {
          const mutation = kind === "blueshift" ? shiftMutations.deleteBlueshift : shiftMutations.deleteRedshift;
          confirmDelete(`Delete the ${kind === "blueshift" ? "Blueshift" : "Redshift"} "${name}"?`, () => {
            mutation.mutate(id);
          });
        }}
        onCreateStar={(title: string) => {
          const blueshift = workspace.selectedBlueshift;
          if (!blueshift) throw new Error("Cannot create a Star without a selected Blueshift");
          starMutations.blueshift.createStar.mutate({ id: blueshift.id, title });
        }}
        onCreateRedshiftStar={(title: string) => {
          const redshift = workspace.selectedRedshift;
          if (!redshift) throw new Error("Cannot create a Star without a selected Redshift");
          starMutations.redshift.createStar.mutate({ id: redshift.id, title });
        }}
        onToggleStar={(star: BlueshiftStar, completed: boolean) => {
          starMutations.blueshift.updateStar.mutate({ id: star.id, completed });
        }}
        onToggleRedshiftStar={(star: RedshiftStar, completed: boolean) => {
          starMutations.redshift.updateStar.mutate({ id: star.id, completed });
        }}
        onNorthStar={(star: BlueshiftStar, northStar: boolean) => {
          starMutations.blueshift.updateStar.mutate({ id: star.id, northStar });
        }}
        onDeleteStar={(star: BlueshiftStar) => {
          confirmDelete(`Delete the Star "${star.title}"?`, () => {
            starMutations.blueshift.deleteStar.mutate(star.id);
          });
        }}
        onDeleteRedshiftStar={(star: RedshiftStar) => {
          confirmDelete(`Delete the Star "${star.title}"?`, () => {
            starMutations.redshift.deleteStar.mutate(star.id);
          });
        }}
      />
      <AppModals
        modal={modal}
        settings={workspace.settings.data}
        confirm={confirm}
        shiftMutations={shiftMutations}
        onClose={() => {
          setModal(null);
        }}
      />
    </>
  );
}
