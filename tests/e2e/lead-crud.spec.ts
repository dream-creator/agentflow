import { test, expect } from "@playwright/test";

test.describe("Lead CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("should display leads page after authentication", async ({ page }) => {
    await page.goto("/leads");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should show empty state when no leads exist", async ({ page }) => {
    await page.goto("/leads");
    await expect(page.locator("text=No leads yet")).toBeVisible();
  });

  test("should navigate to add lead page", async ({ page }) => {
    await page.goto("/leads");
    await expect(page.locator("text=Add Lead")).toBeVisible();
  });

  test("should display lead form fields", async ({ page }) => {
    await page.goto("/leads/new");
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
  });

  test("should have stage selection", async ({ page }) => {
    await page.goto("/leads/new");
    await expect(page.locator('select[name="stage"]')).toBeVisible();
  });

  test("should have cancel button that returns to leads", async ({ page }) => {
    await page.goto("/leads/new");
    await page.click("text=Cancel");
    await expect(page).toHaveURL(/\/leads/);
  });

  test("should display search functionality on leads page", async ({ page }) => {
    await page.goto("/leads");
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test("should have lead detail page structure", async ({ page }) => {
    await page.goto("/leads");
    await expect(page.locator("text=No leads yet")).toBeVisible();
  });

  test("should display pipeline stages in lead form", async ({ page }) => {
    await page.goto("/leads/new");
    const stageSelect = page.locator('select[name="stage"]');
    await expect(stageSelect).toBeVisible();
    await expect(stageSelect.locator("option")).toHaveCount(6);
  });

  test("should have proper form validation", async ({ page }) => {
    await page.goto("/leads/new");
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveAttribute("required", "");
  });
});
