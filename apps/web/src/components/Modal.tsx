import type React from "react";
import { Dialog } from "@base-ui-components/react/dialog";

export function Modal({
  title,
  onClose,
  children,
}: {
  readonly title: string;
  readonly onClose: () => void;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-10 bg-ink/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-20 w-[min(90vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-paper p-6 shadow-2xl">
          <div className="mb-5 flex justify-between">
            <Dialog.Title className="font-display text-2xl font-bold">{title}</Dialog.Title>
            <Dialog.Close aria-label="Close" className="text-2xl text-muted">
              {"×"}
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
