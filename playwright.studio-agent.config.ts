import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', testMatch: 'studio-agent-harness.spec.ts', workers: 1,
  timeout: 30000, outputDir: './data/studio-agent-results',
  use: { browserName: 'chromium', launchOptions: { executablePath: process.env.NUDGE_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' }, trace: 'retain-on-failure' },
  // No server, .env, database, licence key or provider configuration loaded.
});
