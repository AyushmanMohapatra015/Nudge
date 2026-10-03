import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1, timeout: 90000,
  use: { baseURL: 'http://127.0.0.1:3100', browserName: 'chromium', launchOptions: { executablePath: process.env.NUDGE_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' }, trace: 'retain-on-failure' },
  webServer: { command: 'npm.cmd run dev -- --port 3100', url: 'http://127.0.0.1:3100', reuseExistingServer: false, timeout: 120000, env: { NUDGE_MODE: 'demo', NUDGE_DB_PATH: './data/browser-test.sqlite' } },
});
