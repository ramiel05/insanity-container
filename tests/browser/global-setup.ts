import { clerkSetup } from "@clerk/testing/playwright";

async function globalSetup(): Promise<void> {
  await clerkSetup();
}

export default globalSetup;
