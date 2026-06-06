import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/AgentFlow/);
    await expect(page.locator("h1")).toContainText("Welcome back");
    await expect(page.locator("text=Sign in to your AgentFlow account")).toBeVisible();
  });

  test("should display signup page", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("h1")).toContainText("Create your account");
    await expect(page.locator("text=Create your account")).toBeVisible();
  });

  test("should show magic link form on login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator("text=Send magic link")).toBeVisible();
  });

  test("should show Google OAuth button on login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=Continue with Google")).toBeVisible();
  });

  test("should show magic link form on signup", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[id="fullName"]')).toBeVisible();
    await expect(page.locator("text=Send magic link")).toBeVisible();
  });

  test("should show Google OAuth button on signup", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("text=Continue with Google")).toBeVisible();
  });

  test("should redirect unauthenticated users from dashboard to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect unauthenticated users from pipeline to login", async ({
    page,
  }) => {
    await page.goto("/pipeline");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect unauthenticated users from leads to login", async ({
    page,
  }) => {
    await page.goto("/leads");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should show error message for invalid credentials", async ({ page }) => {
    await page.goto("/login?error=auth_callback_failed");
    await expect(page.locator("text=auth callback failed")).toBeVisible();
  });

  test("should have working navigation links", async ({ page }) => {
    await page.goto("/login");
    await page.click("text=Sign up");
    await expect(page).toHaveURL(/\/signup/);

    await page.click("text=Sign in");
    await expect(page).toHaveURL(/\/login/);
  });
});
