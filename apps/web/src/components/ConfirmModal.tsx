import { useState } from "react";
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
  const [typed, setTyped] = useState<string>("");
  const word = state.typedWord ?? "";
  const confirmed = word.length === 0 || typed === word;
  const label = state.actionLabel ?? "Delete";
  return (
    <Modal title="Are you sure?" onClose={onClose}>
      <p className="mb-4 text-sm">{state.message}</p>
      {word.length > 0 && (
        <label className="block text-sm font-bold">
          {`Type "${state.typedWord}" to confirm`}
          <input
            autoFocus
            aria-label={`Type ${state.typedWord} to confirm`}
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value);
            }}
            className="mt-2 w-full rounded-xl border border-line bg-surface p-3 font-mono"
          />
        </label>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-bold text-muted">
          {"Cancel"}
        </button>
        <button
          type="button"
          disabled={!confirmed}
          onClick={() => {
            state.action();
            onClose();
          }}
          className={`rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white ${confirmed ? "" : "cursor-not-allowed opacity-40"}`}
        >
          {label}
        </button>
      </div>
    </Modal>
  );
}
