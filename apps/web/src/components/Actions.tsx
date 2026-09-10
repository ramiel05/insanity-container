import type React from "react";

export function Actions({
  disabled,
  onClose,
  label = "Create",
}: {
  readonly disabled: boolean;
  readonly onClose: () => void;
  readonly label?: string;
}): React.JSX.Element {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-bold text-muted">
        {"Cancel"}
      </button>
      <button
        type="submit"
        disabled={disabled}
        className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
      >
        {label}
      </button>
    </div>
  );
}
