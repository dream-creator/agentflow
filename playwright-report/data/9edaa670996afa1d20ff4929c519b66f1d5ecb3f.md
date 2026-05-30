# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> should show error message for invalid credentials
- Location: tests/e2e/auth.spec.ts:61:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=auth_callback_failed')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=auth_callback_failed')

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
  3  | test.describe("Authentication", () => {
  4  |   test("should display login page", async ({ page }) => {
  5  |     await page.goto("/login");
  6  |     await expect(page).toHaveTitle(/AgentFlow/);
  7  |     await expect(page.locator("h1")).toContainText("AgentFlow");
  8  |     await expect(page.locator("text=Sign in to your account")).toBeVisible();
  9  |   });
  10 | 
  11 |   test("should display signup page", async ({ page }) => {
  12 |     await page.goto("/signup");
  13 |     await expect(page.locator("h1")).toContainText("AgentFlow");
  14 |     await expect(page.locator("text=Create your account")).toBeVisible();
  15 |   });
  16 | 
  17 |   test("should show magic link form on login", async ({ page }) => {
  18 |     await page.goto("/login");
  19 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  20 |     await expect(page.locator("text=Send magic link")).toBeVisible();
  21 |   });
  22 | 
  23 |   test("should show Google OAuth button on login", async ({ page }) => {
  24 |     await page.goto("/login");
  25 |     await expect(page.locator("text=Continue with Google")).toBeVisible();
  26 |   });
  27 | 
  28 |   test("should show magic link form on signup", async ({ page }) => {
  29 |     await page.goto("/signup");
  30 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  31 |     await expect(page.locator('input[id="fullName"]')).toBeVisible();
  32 |     await expect(page.locator("text=Send magic link")).toBeVisible();
  33 |   });
  34 | 
  35 |   test("should show Google OAuth button on signup", async ({ page }) => {
  36 |     await page.goto("/signup");
  37 |     await expect(page.locator("text=Continue with Google")).toBeVisible();
  38 |   });
  39 | 
  40 |   test("should redirect unauthenticated users from dashboard to login", async ({
  41 |     page,
  42 |   }) => {
  43 |     await page.goto("/dashboard");
  44 |     await expect(page).toHaveURL(/\/login/);
  45 |   });
  46 | 
  47 |   test("should redirect unauthenticated users from pipeline to login", async ({
  48 |     page,
  49 |   }) => {
  50 |     await page.goto("/pipeline");
  51 |     await expect(page).toHaveURL(/\/login/);
  52 |   });
  53 | 
  54 |   test("should redirect unauthenticated users from leads to login", async ({
  55 |     page,
  56 |   }) => {
  57 |     await page.goto("/leads");
  58 |     await expect(page).toHaveURL(/\/login/);
  59 |   });
  60 | 
  61 |   test("should show error message for invalid credentials", async ({ page }) => {
  62 |     await page.goto("/login?error=auth_callback_failed");
> 63 |     await expect(page.locator("text=auth_callback_failed")).toBeVisible();
     |                                                             ^ Error: expect(locator).toBeVisible() failed
  64 |   });
  65 | 
  66 |   test("should have working navigation links", async ({ page }) => {
  67 |     await page.goto("/login");
  68 |     await page.click("text=Sign up");
  69 |     await expect(page).toHaveURL(/\/signup/);
  70 | 
  71 |     await page.click("text=Sign in");
  72 |     await expect(page).toHaveURL(/\/login/);
  73 |   });
  74 | });
  75 | 
```