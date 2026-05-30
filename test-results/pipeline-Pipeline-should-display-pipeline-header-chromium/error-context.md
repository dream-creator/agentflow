# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pipeline.spec.ts >> Pipeline >> should display pipeline header
- Location: tests/e2e/pipeline.spec.ts:43:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "Pipeline"
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
  3  | test.describe("Pipeline", () => {
  4  |   test("should display pipeline page", async ({ page }) => {
  5  |     await page.goto("/pipeline");
  6  |     await expect(page).toHaveURL(/\/login/);
  7  |   });
  8  | 
  9  |   test("should show pipeline stages", async ({ page }) => {
  10 |     await page.goto("/pipeline");
  11 |     await expect(page.locator("text=New Lead")).toBeVisible();
  12 |   });
  13 | 
  14 |   test("should have lead count per stage", async ({ page }) => {
  15 |     await page.goto("/pipeline");
  16 |     await expect(page.locator("text=0")).toBeVisible();
  17 |   });
  18 | 
  19 |   test("should display all 6 pipeline stages", async ({ page }) => {
  20 |     await page.goto("/pipeline");
  21 |     const stages = ["New Lead", "Contacted", "Qualified", "Proposal", "Negotiation", "Closed"];
  22 |     for (const stage of stages) {
  23 |       await expect(page.locator(`text=${stage}`)).toBeVisible();
  24 |     }
  25 |   });
  26 | 
  27 |   test("should have proper stage layout", async ({ page }) => {
  28 |     await page.goto("/pipeline");
  29 |     const stageColumns = page.locator('[data-testid="stage-column"]');
  30 |     await expect(stageColumns).toHaveCount(6);
  31 |   });
  32 | 
  33 |   test("should show empty state for each stage", async ({ page }) => {
  34 |     await page.goto("/pipeline");
  35 |     await expect(page.locator("text=No leads in this stage")).toBeVisible();
  36 |   });
  37 | 
  38 |   test("should have responsive design for mobile", async ({ page }) => {
  39 |     await page.goto("/pipeline");
  40 |     await expect(page.locator("text=New Lead")).toBeVisible();
  41 |   });
  42 | 
  43 |   test("should display pipeline header", async ({ page }) => {
  44 |     await page.goto("/pipeline");
> 45 |     await expect(page.locator("h1")).toContainText("Pipeline");
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  46 |   });
  47 | });
  48 | 
```