# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lead-crud.spec.ts >> Lead CRUD >> should display search functionality on leads page
- Location: tests/e2e/lead-crud.spec.ts:41:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[placeholder*="Search"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('input[placeholder*="Search"]')

```

```yaml
- heading "AgentFlow" [level=1]
- paragraph: The CRM for agents who hate CRMs
- heading "Sign in to your account" [level=2]
- text: Email address
- textbox "Email address":
  - /placeholder: you@example.com
- button "Send magic link"
- text: or
- button "Continue with Google":
  - img
  - text: Continue with Google
- paragraph:
  - text: Don't have an account?
  - link "Sign up":
    - /url: /signup
- alert
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Lead CRUD", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto("/login");
  6  |   });
  7  | 
  8  |   test("should display leads page after authentication", async ({ page }) => {
  9  |     await page.goto("/leads");
  10 |     await expect(page).toHaveURL(/\/login/);
  11 |   });
  12 | 
  13 |   test("should show empty state when no leads exist", async ({ page }) => {
  14 |     await page.goto("/leads");
  15 |     await expect(page.locator("text=No leads yet")).toBeVisible();
  16 |   });
  17 | 
  18 |   test("should navigate to add lead page", async ({ page }) => {
  19 |     await page.goto("/leads");
  20 |     await expect(page.locator("text=Add Lead")).toBeVisible();
  21 |   });
  22 | 
  23 |   test("should display lead form fields", async ({ page }) => {
  24 |     await page.goto("/leads/new");
  25 |     await expect(page.locator('input[name="name"]')).toBeVisible();
  26 |     await expect(page.locator('input[name="email"]')).toBeVisible();
  27 |     await expect(page.locator('input[name="phone"]')).toBeVisible();
  28 |   });
  29 | 
  30 |   test("should have stage selection", async ({ page }) => {
  31 |     await page.goto("/leads/new");
  32 |     await expect(page.locator('select[name="stage"]')).toBeVisible();
  33 |   });
  34 | 
  35 |   test("should have cancel button that returns to leads", async ({ page }) => {
  36 |     await page.goto("/leads/new");
  37 |     await page.click("text=Cancel");
  38 |     await expect(page).toHaveURL(/\/leads/);
  39 |   });
  40 | 
  41 |   test("should display search functionality on leads page", async ({ page }) => {
  42 |     await page.goto("/leads");
> 43 |     await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
     |                                                                ^ Error: expect(locator).toBeVisible() failed
  44 |   });
  45 | 
  46 |   test("should have lead detail page structure", async ({ page }) => {
  47 |     await page.goto("/leads");
  48 |     await expect(page.locator("text=No leads yet")).toBeVisible();
  49 |   });
  50 | 
  51 |   test("should display pipeline stages in lead form", async ({ page }) => {
  52 |     await page.goto("/leads/new");
  53 |     const stageSelect = page.locator('select[name="stage"]');
  54 |     await expect(stageSelect).toBeVisible();
  55 |     await expect(stageSelect.locator("option")).toHaveCount(6);
  56 |   });
  57 | 
  58 |   test("should have proper form validation", async ({ page }) => {
  59 |     await page.goto("/leads/new");
  60 |     const nameInput = page.locator('input[name="name"]');
  61 |     await expect(nameInput).toHaveAttribute("required", "");
  62 |   });
  63 | });
  64 | 
```