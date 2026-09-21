import { readFileSync } from "node:fs";
import { defineConfig } from "@playwright/test";

const isCI = Boolean(process.env.CI);

function loadEnvFile(path: string): void {
  let content: string;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    return;
  }
  for (const line of content.split("\n")) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/u.exec(line.trim());
    if (match === null) continue;
    const key = match[1] ?? "";
    if (key.length === 0) continue;
    process.env[key] ??= (match[2] ?? "").replace(/^['"]|['"]$/gu, "");
  }
}

loadEnvFile("apps/server/.env");
loadEnvFile("apps/web/.env");

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
