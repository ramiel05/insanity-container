import ReactDOM from "react-dom/client";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-react";
import { App } from "./App";
import { SignInScreen } from "./components/SignInScreen";
import { QueryProvider } from "./lib/query-provider";
import "./app.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "";
if (publishableKey.length === 0) {
  throw new Error("VITE_CLERK_PUBLISHABLE_KEY is required");
}

const root = document.getElementById("root");

if (root !== null) {
  ReactDOM.createRoot(root).render(
    <ClerkProvider publishableKey={publishableKey}>
      <QueryProvider>
        <SignedOut>
          <SignInScreen />
        </SignedOut>
        <SignedIn>
          <App />
        </SignedIn>
      </QueryProvider>
    </ClerkProvider>,
  );
}
