import type React from "react";
import { useWorkspace } from "#lib/workspace";

export function QueryStateBanner(): React.JSX.Element | null {
  const workspace = useWorkspace();
  if (workspace.queryError !== null) {
    return (
      <section role="alert" className="mb-8 rounded-3xl border border-accent bg-accent/10 p-5">
        <p className="font-bold">{"Couldn't load your workspace."}</p>
        <p className="mt-1 text-sm">{workspace.queryError.message}</p>
        {import.meta.env.DEV && (
          <p className="mt-2 text-sm text-muted">
            {"If the API isn't running, start it locally with "}
            <code className="font-mono">{"bun run dev"}</code>
            {"."}
          </p>
        )}
      </section>
    );
  }
  if (workspace.pending) {
    return (
      <p role="status" className="mb-8 text-muted">
        {"Loading…"}
      </p>
    );
  }
  return null;
}
