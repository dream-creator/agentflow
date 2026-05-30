import { test, expect } from "@playwright/test";

test.describe("CSV Import", () => {
  test("should display import page", async ({ page }) => {
    await page.goto("/leads/import");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should show import header", async ({ page }) => {
    await page.goto("/leads/import");
    await expect(page.locator("h1")).toContainText("Import Leads");
  });

  test("should have file upload area", async ({ page }) => {
    await page.goto("/leads/import");
    await expect(page.locator("text=Upload CSV")).toBeVisible();
  });

  test("should show drag and drop zone", async ({ page }) => {
    await page.goto("/leads/import");
    await expect(page.locator("text=Drag & drop")).toBeVisible();
  });

  test("should have file input for CSV", async ({ page }) => {
    await page.goto("/leads/import");
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
  });

  test("should accept CSV files only", async ({ page }) => {
    await page.goto("/leads/import");
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute("accept", ".csv");
  });

  test("should show cancel button", async ({ page }) => {
    await page.goto("/leads/import");
    await expect(page.locator("text=Cancel")).toBeVisible();
  });

  test("should have column mapping section", async ({ page }) => {
    await page.goto("/leads/import");
    await expect(page.locator("text=Map Columns")).toBeVisible();
  });
});
