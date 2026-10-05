import type React from "react";
import { useWorkspace } from "#lib/workspace";

export function Dimmed({ children }: { readonly children: React.ReactNode }): React.JSX.Element {
  const { dimmed } = useWorkspace();
  return (
    <div
      {...(dimmed ? { inert: true, "data-dimmed": "" } : {})}
      className={dimmed ? "pointer-events-none select-none opacity-60 blur-xs" : ""}
    >
      {children}
    </div>
  );
}
