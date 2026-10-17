import { QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { queryClient } from "#lib/query-client";

export function QueryProvider({ children }: { readonly children: React.ReactNode }): React.JSX.Element {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
