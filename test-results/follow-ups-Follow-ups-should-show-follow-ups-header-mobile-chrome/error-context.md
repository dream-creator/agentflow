# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: follow-ups.spec.ts >> Follow-ups >> should show follow-ups header
- Location: tests/e2e/follow-ups.spec.ts:9:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "Follow-ups"
Received string:    "AgentFlow"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h1')
    14 × locator resolved to <h1 class="font-heading text-3xl font-bold text-primary-900 mb-2">AgentFlow</h1>
       - unexpected value "AgentFlow"

```

```yaml
- heading "AgentFlow" [level=1]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Follow-ups", () => {
  4  |   test("should display follow-ups page", async ({ page }) => {
  5  |     await page.goto("/follow-ups");
  6  |     await expect(page).toHaveURL(/\/login/);
  7  |   });
  8  | 
  9  |   test("should show follow-ups header", async ({ page }) => {
  10 |     await page.goto("/follow-ups");
> 11 |     await expect(page.locator("h1")).toContainText("Follow-ups");
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  12 |   });
  13 | 
  14 |   test("should display empty state when no follow-ups", async ({ page }) => {
  15 |     await page.goto("/follow-ups");
  16 |     await expect(page.locator("text=No follow-ups scheduled")).toBeVisible();
  17 |   });
  18 | 
  19 |   test("should show overdue section", async ({ page }) => {
  20 |     await page.goto("/follow-ups");
  21 |     await expect(page.locator("text=Overdue")).toBeVisible();
  22 |   });
  23 | 
  24 |   test("should show upcoming section", async ({ page }) => {
  25 |     await page.goto("/follow-ups");
  26 |     await expect(page.locator("text=Upcoming")).toBeVisible();
  27 |   });
  28 | 
  29 |   test("should have date filter options", async ({ page }) => {
  30 |     await page.goto("/follow-ups");
  31 |     await expect(page.locator("text=Today")).toBeVisible();
  32 |     await expect(page.locator("text=This Week")).toBeVisible();
  33 |   });
  34 | 
  35 |   test("should display follow-up count", async ({ page }) => {
  36 |     await page.goto("/follow-ups");
  37 |     await expect(page.locator("text=0")).toBeVisible();
  38 |   });
  39 | 
  40 |   test("should have mark complete functionality placeholder", async ({ page }) => {
  41 |     await page.goto("/follow-ups");
  42 |     await expect(page.locator("text=No follow-ups scheduled")).toBeVisible();
  43 |   });
  44 | });
  45 | 
```