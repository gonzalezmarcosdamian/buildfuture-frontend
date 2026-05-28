import { defineConfig, devices } from "@playwright/test";

const FRONTEND_URL = "http://localhost:3099";
const BACKEND_URL = "http://localhost:8008";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  use: {
    baseURL: FRONTEND_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    ...devices["Pixel 5"],
  },
  projects: [
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 12"] } },
  ],
  webServer: [
    {
      // Frontend: arrancar manualmente con NEXT_PUBLIC_MOCK_AUTH=true npm run dev -- --port 3099
      command: "npm run dev -- --port 3099",
      url: FRONTEND_URL,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      // Backend mock: arrancar con SUPABASE_URL="" python -m uvicorn app.main:app --port 8008
      command: "uvicorn app.main:app --port 8008",
      cwd: "../backend",
      url: `${BACKEND_URL}/health`,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
