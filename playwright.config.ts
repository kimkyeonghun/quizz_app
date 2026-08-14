import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "tv", use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } } },
    { name: "laptop", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } } },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
});
