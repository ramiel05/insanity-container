import ReactDOM from "react-dom/client";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import { SignInScreen } from "./components/SignInScreen";
import { queryClient } from "./lib/query-client";
import "./app.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "";
if (publishableKey.length === 0) {
  throw new Error("VITE_CLERK_PUBLISHABLE_KEY is required");
}

const root = document.getElementById("root");

if (root !== null) {
  ReactDOM.createRoot(root).render(
    <ClerkProvider publishableKey={publishableKey}>
      <QueryClientProvider client={queryClient}>
        <SignedOut>
          <SignInScreen />
        </SignedOut>
        <SignedIn>
          <App />
        </SignedIn>
      </QueryClientProvider>
    </ClerkProvider>,
  );
}
