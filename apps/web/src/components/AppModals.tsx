import type React from "react";
import { ShiftModal } from "./ShiftModal";
import { SettingsModal } from "./SettingsModal";
import { ConfirmModal } from "./ConfirmModal";
import type { ConfirmState, ModalKind } from "#lib/kinds";
import type { Workspace } from "#lib/workspace";

export function AppModals({
  workspace,
  modal,
  confirm,
  onClose,
}: {
  readonly workspace: Workspace;
  readonly modal: ModalKind;
  readonly confirm?: ConfirmState | null;
  readonly onClose: () => void;
}): React.JSX.Element {
  return (
    <>
      {modal === "blueshift" && (
        <ShiftModal
          label="Blueshift"
          error={workspace.errors.createShift("blueshift")}
          onClose={onClose}
          onSubmit={(input) => {
            workspace.ops.createShift("blueshift", input);
          }}
        />
      )}
      {modal === "redshift" && (
        <ShiftModal
          label="Redshift"
          error={workspace.errors.createShift("redshift")}
          onClose={onClose}
          onSubmit={(input) => {
            workspace.ops.createShift("redshift", input);
          }}
        />
      )}
      {modal === "settings" && workspace.settings && (
        <SettingsModal
          timezone={workspace.settings.timezone}
          error={workspace.errors.settings}
          onClose={onClose}
          onSubmit={(timezone: string | null) => {
            workspace.ops.updateSettings({ timezone });
          }}
        />
      )}
      {modal === "confirm" && confirm && <ConfirmModal state={confirm} onClose={onClose} />}
    </>
  );
}
