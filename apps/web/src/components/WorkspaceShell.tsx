import type React from "react";
import { AppModals } from "./AppModals";
import { BlackholeSection } from "./BlackholeSection";
import { Dimmed } from "./Dimmed";
import { Header } from "./Header";
import { Legend } from "./Legend";
import { NorthStarsSection } from "./NorthStarsSection";
import { QueryStateBanner } from "./QueryStateBanner";
import { SelectedPanel } from "./SelectedPanel";
import { ShiftColumn } from "./ShiftColumn";

export function WorkspaceShell(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-10 sm:py-12">
        <Header />
        <QueryStateBanner />
        <Legend />
        <BlackholeSection />
        <NorthStarsSection />
        <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)_16rem]">
          <ShiftColumn kind="redshift" className="order-1 lg:col-start-1 lg:order-none" />
          <section className="order-3 rounded-3xl border border-line bg-paper p-5 sm:p-7 lg:col-start-2 lg:order-none">
            <Dimmed>
              <SelectedPanel />
            </Dimmed>
          </section>
          <ShiftColumn kind="blueshift" className="order-2 lg:col-start-3 lg:order-none" />
        </div>
        <AppModals />
      </div>
    </main>
  );
}
