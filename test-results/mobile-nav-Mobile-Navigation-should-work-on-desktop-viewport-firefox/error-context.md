# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile-nav.spec.ts >> Mobile Navigation >> should work on desktop viewport
- Location: tests/e2e/mobile-nav.spec.ts:61:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('nav')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('nav')

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
  3  | test.describe("Mobile Navigation", () => {
  4  |   test("should display bottom navigation on mobile", async ({ page }) => {
  5  |     await page.setViewportSize({ width: 375, height: 812 });
  6  |     await page.goto("/dashboard");
  7  |     await expect(page.locator("nav")).toBeVisible();
  8  |   });
  9  | 
  10 |   test("should have all navigation items", async ({ page }) => {
  11 |     await page.setViewportSize({ width: 375, height: 812 });
  12 |     await page.goto("/dashboard");
  13 |     await expect(page.locator("text=Dashboard")).toBeVisible();
  14 |     await expect(page.locator("text=Pipeline")).toBeVisible();
  15 |     await expect(page.locator("text=Leads")).toBeVisible();
  16 |     await expect(page.locator("text=Follow-ups")).toBeVisible();
  17 |   });
  18 | 
  19 |   test("should navigate between pages", async ({ page }) => {
  20 |     await page.setViewportSize({ width: 375, height: 812 });
  21 |     await page.goto("/dashboard");
  22 |     await page.click("text=Pipeline");
  23 |     await expect(page).toHaveURL(/\/pipeline/);
  24 |   });
  25 | 
  26 |   test("should have proper touch target sizes", async ({ page }) => {
  27 |     await page.setViewportSize({ width: 375, height: 812 });
  28 |     await page.goto("/dashboard");
  29 |     const navItems = page.locator("nav button, nav a");
  30 |     const count = await navItems.count();
  31 |     for (let i = 0; i < count; i++) {
  32 |       const box = await navItems.nth(i).boundingBox();
  33 |       if (box) {
  34 |         expect(box.height).toBeGreaterThanOrEqual(44);
  35 |         expect(box.width).toBeGreaterThanOrEqual(44);
  36 |       }
  37 |     }
  38 |   });
  39 | 
  40 |   test("should show active state for current page", async ({ page }) => {
  41 |     await page.setViewportSize({ width: 375, height: 812 });
  42 |     await page.goto("/dashboard");
  43 |     await expect(page.locator("text=Dashboard")).toHaveCSS(
  44 |       "color",
  45 |       "rgb(15, 118, 110)"
  46 |     );
  47 |   });
  48 | 
  49 |   test("should have responsive layout", async ({ page }) => {
  50 |     await page.setViewportSize({ width: 375, height: 812 });
  51 |     await page.goto("/dashboard");
  52 |     await expect(page.locator("main")).toBeVisible();
  53 |   });
  54 | 
  55 |   test("should work on tablet viewport", async ({ page }) => {
  56 |     await page.setViewportSize({ width: 768, height: 1024 });
  57 |     await page.goto("/dashboard");
  58 |     await expect(page.locator("nav")).toBeVisible();
  59 |   });
  60 | 
  61 |   test("should work on desktop viewport", async ({ page }) => {
  62 |     await page.setViewportSize({ width: 1920, height: 1080 });
  63 |     await page.goto("/dashboard");
> 64 |     await expect(page.locator("nav")).toBeVisible();
     |                                       ^ Error: expect(locator).toBeVisible() failed
  65 |   });
  66 | });
  67 | 
```