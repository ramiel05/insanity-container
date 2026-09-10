import type React from "react";
import { Modal } from "./Modal";
import type { ConfirmState } from "#lib/kinds";

export function ConfirmModal({
  state,
  onClose,
}: {
  readonly state: ConfirmState;
  readonly onClose: () => void;
}): React.JSX.Element {
  return (
    <Modal title="Are you sure?" onClose={onClose}>
      <p className="mb-4 text-sm">{state.message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-bold text-muted">
          {"Cancel"}
        </button>
        <button
          type="button"
          onClick={() => {
            state.action();
            onClose();
          }}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white"
        >
          {"Delete"}
        </button>
      </div>
    </Modal>
  );
}
