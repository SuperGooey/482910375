import { defineConfig } from "@playwright/test";

// vite.config.ts sets `base: "/482910375/"` (GitHub Pages project site), so
// the dev server serves the app under that path, not "/".
const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}/482910375/`;

// Local-only e2e suite for the two responsive shells described in
// src/App.tsx: mobile single-pane (< 1024px) vs. desktop split-pane
// (>= 1024px, DESKTOP_QUERY = "(min-width: 1024px)"). Deliberately not
// wired into CI (see .github/workflows/deploy.yml, which this doesn't
// touch) — run by hand with `npm run test:e2e`.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile",
      testMatch: /mobile\.spec\.ts/,
      use: { viewport: { width: 393, height: 852 } },
    },
    {
      name: "desktop",
      testMatch: /desktop\.spec\.ts/,
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: "resize",
      testMatch: /resize\.spec\.ts/,
      // starting viewport doesn't matter much here — these tests call
      // page.setViewportSize() themselves to cross the breakpoint
      use: { viewport: { width: 393, height: 852 } },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
