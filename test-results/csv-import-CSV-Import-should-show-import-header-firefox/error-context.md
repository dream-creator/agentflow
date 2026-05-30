# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: csv-import.spec.ts >> CSV Import >> should show import header
- Location: tests/e2e/csv-import.spec.ts:9:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "Import Leads"
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
  3  | test.describe("CSV Import", () => {
  4  |   test("should display import page", async ({ page }) => {
  5  |     await page.goto("/leads/import");
  6  |     await expect(page).toHaveURL(/\/login/);
  7  |   });
  8  | 
  9  |   test("should show import header", async ({ page }) => {
  10 |     await page.goto("/leads/import");
> 11 |     await expect(page.locator("h1")).toContainText("Import Leads");
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  12 |   });
  13 | 
  14 |   test("should have file upload area", async ({ page }) => {
  15 |     await page.goto("/leads/import");
  16 |     await expect(page.locator("text=Upload CSV")).toBeVisible();
  17 |   });
  18 | 
  19 |   test("should show drag and drop zone", async ({ page }) => {
  20 |     await page.goto("/leads/import");
  21 |     await expect(page.locator("text=Drag & drop")).toBeVisible();
  22 |   });
  23 | 
  24 |   test("should have file input for CSV", async ({ page }) => {
  25 |     await page.goto("/leads/import");
  26 |     const fileInput = page.locator('input[type="file"]');
  27 |     await expect(fileInput).toBeVisible();
  28 |   });
  29 | 
  30 |   test("should accept CSV files only", async ({ page }) => {
  31 |     await page.goto("/leads/import");
  32 |     const fileInput = page.locator('input[type="file"]');
  33 |     await expect(fileInput).toHaveAttribute("accept", ".csv");
  34 |   });
  35 | 
  36 |   test("should show cancel button", async ({ page }) => {
  37 |     await page.goto("/leads/import");
  38 |     await expect(page.locator("text=Cancel")).toBeVisible();
  39 |   });
  40 | 
  41 |   test("should have column mapping section", async ({ page }) => {
  42 |     await page.goto("/leads/import");
  43 |     await expect(page.locator("text=Map Columns")).toBeVisible();
  44 |   });
  45 | });
  46 | 
```