import type React from "react";

export function QueryStateBanner({
  error,
  pending,
}: {
  readonly error: Error | null;
  readonly pending: boolean;
}): React.JSX.Element | null {
  if (error !== null) {
    return (
      <section role="alert" className="mb-8 rounded-3xl border border-accent bg-accent/10 p-5">
        <p className="font-bold">{"Couldn't load your workspace."}</p>
        <p className="mt-1 text-sm">{error.message}</p>
        <p className="mt-2 text-sm text-muted">
          {"If the API isn't running, start it locally with "}
          <code className="font-mono">{"bun run dev"}</code>
          {" (API on http://localhost:3000)."}
        </p>
      </section>
    );
  }
  if (pending) {
    return (
      <p role="status" className="mb-8 text-muted">
        {"Loading…"}
      </p>
    );
  }
  return null;
}
