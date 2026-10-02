import type { ReactNode } from "react";
import { useWorkspaceState, WorkspaceContext } from "#lib/workspace";

export function WorkspaceProvider({ children }: { readonly children: ReactNode }): React.JSX.Element {
  const workspace = useWorkspaceState();
  return <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>;
}
