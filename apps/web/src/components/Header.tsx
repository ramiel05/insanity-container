import type React from "react";
import { UserButton } from "@clerk/clerk-react";
import { GearIcon } from "./GearIcon";

export function Header({
  onNewBlueshift,
  onNewRedshift,
  onOpenSettings,
}: {
  readonly onNewBlueshift: () => void;
  readonly onNewRedshift: () => void;
  readonly onOpenSettings: () => void;
}): React.JSX.Element {
  return (
    <header className="mb-10 flex items-end justify-between gap-4">
      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
          {"Polaris / local command center"}
        </p>
        <h1 className="font-display text-5xl font-bold tracking-tight sm:text-7xl">{"Find your way."}</h1>
        <p className="mt-4 text-muted">{"Big direction. Next useful move."}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onNewBlueshift}
          className="rounded-xl bg-blue px-4 py-3 text-sm font-bold text-white hover:bg-blue/90"
        >
          {"+ New Blueshift"}
        </button>
        <button
          type="button"
          onClick={onNewRedshift}
          className="rounded-xl bg-red px-4 py-3 text-sm font-bold text-white hover:bg-red/90"
        >
          {"+ New Redshift"}
        </button>
        <button
          type="button"
          aria-label="Settings"
          onClick={onOpenSettings}
          className="rounded-xl border border-line px-3 py-3 text-muted hover:border-accent hover:text-accent"
        >
          <GearIcon />
        </button>
        <UserButton />
      </div>
    </header>
  );
}
