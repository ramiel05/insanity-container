import type React from "react";
import { ShiftModal } from "./ShiftModal";
import { SettingsModal } from "./SettingsModal";
import { ConfirmModal } from "./ConfirmModal";
import { useWorkspace } from "#lib/workspace";

export function AppModals(): React.JSX.Element {
  const workspace = useWorkspace();
  return (
    <>
      {workspace.modal === "blueshift" && (
        <ShiftModal
          label="Blueshift"
          error={workspace.errors.createShift("blueshift")}
          onClose={workspace.closeModal}
          onSubmit={(input) => {
            workspace.ops.createShift("blueshift", input);
          }}
        />
      )}
      {workspace.modal === "redshift" && (
        <ShiftModal
          label="Redshift"
          error={workspace.errors.createShift("redshift")}
          onClose={workspace.closeModal}
          onSubmit={(input) => {
            workspace.ops.createShift("redshift", input);
          }}
        />
      )}
      {workspace.modal === "settings" && workspace.settings && (
        <SettingsModal
          timezone={workspace.settings.timezone}
          error={workspace.errors.settings}
          onClose={workspace.closeModal}
          onSubmit={(timezone: string | null) => {
            workspace.ops.updateSettings({ timezone });
          }}
        />
      )}
      {workspace.modal === "confirm" && workspace.confirm !== null && (
        <ConfirmModal state={workspace.confirm} onClose={workspace.closeModal} />
      )}
    </>
  );
}
