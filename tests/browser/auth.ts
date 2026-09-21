import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { test as base, expect, type Page } from "@playwright/test";

function ownerEmail(): string {
  const email = process.env.E2E_CLERK_USER_EMAIL ?? "";
  if (email.length === 0) {
    throw new Error("E2E_CLERK_USER_EMAIL is required for authenticated browser tests");
  }
  return email;
}

async function signIn(page: Page): Promise<void> {
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: ownerEmail() });
}

export const test = base.extend<{ readonly page: Page }>({
  page: async ({ page }: { readonly page: Page }, use) => {
    await signIn(page);
    await use(page);
  },
});

export { expect };
