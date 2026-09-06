import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  use: { baseURL: "http://localhost:5173" },
  webServer: [
    {
      command: "bun --cwd apps/atlas build && bun --cwd apps/atlas preview --port 4173",
      url: "http://localhost:4173/",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
