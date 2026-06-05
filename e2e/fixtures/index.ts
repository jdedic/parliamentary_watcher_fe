import { test as base, expect } from '@playwright/test';

const TEST_API_URL = process.env['TEST_API_URL'] ?? 'http://localhost:8001/api/v1';
const TEST_API_KEY = process.env['TEST_API_KEY'] ?? '';

// Extended test fixture that provides an authenticated API request context
// for seeding or asserting against the test database directly in tests
export const test = base.extend({
  apiContext: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: TEST_API_URL,
      extraHTTPHeaders: { 'X-API-Key': TEST_API_KEY },
    });
    await use(ctx);
    await ctx.dispose();
  },
});

export { expect };
