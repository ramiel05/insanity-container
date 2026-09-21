import type React from "react";
import { SignIn } from "@clerk/clerk-react";

export function SignInScreen(): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface text-ink">
      <div className="mx-auto flex max-w-md flex-col items-center px-5 py-16">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">{"Polaris"}</p>
        <h1 className="font-display text-4xl font-bold tracking-tight">{"Find your way."}</h1>
        <p className="mt-4 mb-8 text-center text-muted">{"Sign in with GitHub or Google."}</p>
        <SignIn
          routing="hash"
          forceRedirectUrl="/"
          appearance={{
            variables: {
              colorPrimary: "#3b6fd4",
              colorBackground: "#fffefa",
              colorForeground: "#24231f",
              colorMutedForeground: "#77746c",
              colorDanger: "#e35d3f",
              borderRadius: "0.75rem",
              fontFamily: '"DM Sans", sans-serif',
            },
            elements: {
              footerAction: { display: "none" },
            },
          }}
        />
      </div>
    </main>
  );
}
