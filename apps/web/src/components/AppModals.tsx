import type React from "react";
import { ShiftModal } from "./ShiftModal";
import { SettingsModal } from "./SettingsModal";
import { ConfirmModal } from "./ConfirmModal";
import type { Settings } from "@proj/shared";
import type { ConfirmState, ModalKind } from "#lib/kinds";
import type { ShiftMutations } from "#lib/hooks";

export function AppModals({
  modal,
  settings,
  confirm,
  shiftMutations,
  onClose,
}: {
  readonly modal: ModalKind;
  readonly settings?: Settings;
  readonly confirm?: ConfirmState | null;
  readonly shiftMutations: ShiftMutations;
  readonly onClose: () => void;
}): React.JSX.Element {
  return (
    <>
      {modal === "blueshift" && (
        <ShiftModal
          label="Blueshift"
          error={shiftMutations.createBlueshift.error?.message}
          onClose={onClose}
          onSubmit={(input) => {
            shiftMutations.createBlueshift.mutate(input);
          }}
        />
      )}
      {modal === "redshift" && (
        <ShiftModal
          label="Redshift"
          error={shiftMutations.createRedshift.error?.message}
          onClose={onClose}
          onSubmit={(input) => {
            shiftMutations.createRedshift.mutate(input);
          }}
        />
      )}
      {modal === "settings" && settings && (
        <SettingsModal
          timezone={settings.timezone}
          error={shiftMutations.updateSettings.error?.message}
          onClose={onClose}
          onSubmit={(timezone: string | null) => {
            shiftMutations.updateSettings.mutate({ timezone });
          }}
        />
      )}
      {modal === "confirm" && confirm && <ConfirmModal state={confirm} onClose={onClose} />}
    </>
  );
}
