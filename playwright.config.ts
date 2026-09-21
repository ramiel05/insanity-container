import { config } from "dotenv";
import { defineConfig } from "@playwright/test";

config({ path: "apps/server/.env" });
config({ path: "apps/web/.env" });

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/browser",
  use: { baseURL: "http://localhost:5173" },
  webServer: [
    {
      command: "bun --cwd apps/server dev",
      url: "http://localhost:3000/health",
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
    {
      command: "bun --cwd apps/web dev",
      url: "http://localhost:5173/",
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
    {
      command: "bun --cwd apps/atlas build && bun --cwd apps/atlas preview --port 4173",
      url: "http://localhost:4173/atlas/",
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
  ],
});
