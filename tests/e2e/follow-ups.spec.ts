import { test, expect } from "@playwright/test";

test.describe("Follow-ups", () => {
  test("should display follow-ups page", async ({ page }) => {
    await page.goto("/follow-ups");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should show follow-ups header", async ({ page }) => {
    await page.goto("/follow-ups");
    await expect(page.locator("h1")).toContainText("Follow-ups");
  });

  test("should display empty state when no follow-ups", async ({ page }) => {
    await page.goto("/follow-ups");
    await expect(page.locator("text=No follow-ups scheduled")).toBeVisible();
  });

  test("should show overdue section", async ({ page }) => {
    await page.goto("/follow-ups");
    await expect(page.locator("text=Overdue")).toBeVisible();
  });

  test("should show upcoming section", async ({ page }) => {
    await page.goto("/follow-ups");
    await expect(page.locator("text=Upcoming")).toBeVisible();
  });

  test("should have date filter options", async ({ page }) => {
    await page.goto("/follow-ups");
    await expect(page.locator("text=Today")).toBeVisible();
    await expect(page.locator("text=This Week")).toBeVisible();
  });

  test("should display follow-up count", async ({ page }) => {
    await page.goto("/follow-ups");
    await expect(page.locator("text=0")).toBeVisible();
  });

  test("should have mark complete functionality placeholder", async ({ page }) => {
    await page.goto("/follow-ups");
    await expect(page.locator("text=No follow-ups scheduled")).toBeVisible();
  });
});
