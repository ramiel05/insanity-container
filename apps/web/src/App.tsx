import type React from "react";
import { WorkspaceProvider } from "#lib/workspace-provider";
import { WorkspaceShell } from "./components/WorkspaceShell";

export function App(): React.JSX.Element {
  return (
    <WorkspaceProvider>
      <WorkspaceShell />
    </WorkspaceProvider>
  );
}
