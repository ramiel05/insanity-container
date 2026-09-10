import type React from "react";
import { useState } from "react";
import { Modal } from "./Modal";

export function SettingsModal({
  timezone,
  error,
  onClose,
  onSubmit,
}: {
  readonly timezone: string | null;
  readonly error?: string;
  readonly onClose: () => void;
  readonly onSubmit: (timezone: string | null) => void;
}): React.JSX.Element {
  const [value, setValue] = useState<string>(timezone ?? "");
  return (
    <Modal title="Settings" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(value.length > 0 ? value : null);
        }}
      >
        {Boolean(error) && (
          <p role="alert" className="mb-4 rounded-xl bg-accent/10 p-3 text-sm text-accent">
            {`Couldn't save settings: ${error ?? ""}`}
          </p>
        )}
        <label className="block text-sm font-bold">
          {"Timezone"}
          <select
            autoFocus
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
            }}
            className="mt-2 w-full rounded-xl border border-line bg-surface p-3"
          >
            <option value="">{"Automatic (browser timezone)"}</option>
            {Intl.supportedValuesOf("timeZone").map((zone: string) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-bold text-muted">
            {"Cancel"}
          </button>
          <button type="submit" className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white">
            {"Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
