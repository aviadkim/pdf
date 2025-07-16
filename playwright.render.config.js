// Playwright Configuration for Testing Against Render Deployment
// Tests the production instance at https://pdf-fzzi.onrender.com/

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60 * 1000, // Increased timeout for remote testing
  expect: {
    timeout: 10000, // Increased expect timeout
  },
  forbidOnly: !!process.env.CI,
  retries: 2, // More retries for remote testing
  workers: 1, // Sequential execution for consistent results
  reporter: [
    ['html', { outputFolder: 'render-test-results' }],
    ['json', { outputFile: 'render-test-results/results.json' }],
    ['junit', { outputFile: 'render-test-results/results.xml' }],
    ['list'] // Add console output
  ],
  use: {
    baseURL: 'https://pdf-fzzi.onrender.com',
    browserName: 'chromium',
    headless: false, // Show browser for debugging
    viewport: { width: 1280, height: 720 },
    screenshot: 'on', // Always take screenshots
    video: 'on', // Always record video
    trace: 'on', // Always capture trace
    actionTimeout: 30000, // Increased action timeout
    navigationTimeout: 60000, // Increased navigation timeout
    ignoreHTTPSErrors: true, // In case of SSL issues
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-dev-shm-usage', '--no-sandbox']
        }
      },
    }
  ],
  // No web server needed for remote testing
  outputDir: 'render-test-results/'
});