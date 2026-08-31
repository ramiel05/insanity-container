import { Dialog } from "@base-ui-components/react/dialog";
import type { ReactNode } from "react";

export function ConfirmDialog({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-accent hover:text-accent">
        {title}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-ink/30" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 w-[min(90vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-paper p-6 shadow-2xl">
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
