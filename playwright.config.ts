import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3111;
const E2E_DATA_DIR = ".data/e2e-pglite";

// Some sandboxes ship a system Chromium instead of Playwright's own download.
// Use it when present; otherwise Playwright's managed browser is used.
const SYSTEM_CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
const launchOptions = existsSync(SYSTEM_CHROMIUM) ? { executablePath: SYSTEM_CHROMIUM } : {};

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "mobile-chromium", use: { ...devices["Pixel 7"], launchOptions } }],
  webServer: {
    // Fresh database per run; `npm run build` must have been run first.
    command: `rm -rf ${E2E_DATA_DIR} && PGLITE_DATA_DIR=${E2E_DATA_DIR} npx tsx scripts/db-setup.ts && PGLITE_DATA_DIR=${E2E_DATA_DIR} ADMIN_PASSCODE=e2e-pass npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
