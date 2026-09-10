import type React from "react";
import { useState } from "react";
import { Header } from "./components/Header";
import { Legend } from "./components/Legend";
import { QueryStateBanner } from "./components/QueryStateBanner";
import { Workspace } from "./components/Workspace";
import { useShiftMutations, useStarMutations, useWorkspaceQueries } from "#lib/hooks";
import type { ConfirmState, Kind, ModalKind, Selected } from "#lib/kinds";

export function App(): React.JSX.Element {
  const [selected, setSelected] = useState<Selected>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const workspace = useWorkspaceQueries(selected);
  const shiftMutations = useShiftMutations({
    refresh: workspace.refresh,
    onSelected: (kind: Kind, id: string) => {
      setSelected({ kind, id });
    },
    onDeleted: (kind: Kind, id: string) => {
      if (selected?.kind === kind && selected.id === id) setSelected(null);
    },
    onCloseModal: () => {
      setModal(null);
    },
  });
  const starMutations = useStarMutations(workspace.refresh);

  const confirmDelete = (message: string, action: () => void): void => {
    setConfirm({ message, action });
    setModal("confirm");
  };

  return (
    <main className="min-h-screen bg-surface text-ink">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-10 sm:py-12">
        <Header
          onNewBlueshift={() => {
            setModal("blueshift");
          }}
          onNewRedshift={() => {
            setModal("redshift");
          }}
          onOpenSettings={() => {
            setModal("settings");
          }}
        />
        <QueryStateBanner error={workspace.queryError} pending={workspace.pending} />
        <Legend />
        <Workspace
          workspace={workspace}
          shiftMutations={shiftMutations}
          starMutations={starMutations}
          selected={selected}
          modal={modal}
          confirm={confirm}
          setSelected={setSelected}
          setModal={setModal}
          confirmDelete={confirmDelete}
        />
      </div>
    </main>
  );
}
