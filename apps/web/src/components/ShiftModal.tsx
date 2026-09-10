import type React from "react";
import { useState } from "react";
import { Modal } from "./Modal";
import { Actions } from "./Actions";

export function ShiftModal({
  label,
  error,
  onClose,
  onSubmit,
}: {
  readonly label: "Blueshift" | "Redshift";
  readonly error?: string;
  readonly onClose: () => void;
  readonly onSubmit: (input: { readonly name: string; readonly goal?: string }) => void;
}): React.JSX.Element {
  const [name, setName] = useState<string>("");
  const [goal, setGoal] = useState<string>("");
  return (
    <Modal title={`New ${label}`} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim().length > 0) onSubmit({ name, goal });
        }}
      >
        {Boolean(error) && (
          <p role="alert" className="mb-4 rounded-xl bg-accent/10 p-3 text-sm text-accent">
            {`Couldn't create the ${label}: ${error ?? ""}`}
          </p>
        )}
        <label className="block text-sm font-bold">
          {"Name"}
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            className="mt-2 w-full rounded-xl border border-line bg-surface p-3"
          />
        </label>
        <label className="mt-4 block text-sm font-bold">
          {label === "Redshift" ? "Aim" : "Goal"} <span className="font-normal text-muted">{"(optional)"}</span>
          <textarea
            value={goal}
            onChange={(e) => {
              setGoal(e.target.value);
            }}
            className="mt-2 w-full rounded-xl border border-line bg-surface p-3"
            rows={3}
          />
        </label>
        <Actions disabled={name.trim().length === 0} onClose={onClose} />
      </form>
    </Modal>
  );
}
