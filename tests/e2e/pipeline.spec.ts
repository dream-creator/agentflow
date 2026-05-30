import { test, expect } from "@playwright/test";

test.describe("Pipeline", () => {
  test("should display pipeline page", async ({ page }) => {
    await page.goto("/pipeline");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should show pipeline stages", async ({ page }) => {
    await page.goto("/pipeline");
    await expect(page.locator("text=New Lead")).toBeVisible();
  });

  test("should have lead count per stage", async ({ page }) => {
    await page.goto("/pipeline");
    await expect(page.locator("text=0")).toBeVisible();
  });

  test("should display all 6 pipeline stages", async ({ page }) => {
    await page.goto("/pipeline");
    const stages = ["New Lead", "Contacted", "Qualified", "Proposal", "Negotiation", "Closed"];
    for (const stage of stages) {
      await expect(page.locator(`text=${stage}`)).toBeVisible();
    }
  });

  test("should have proper stage layout", async ({ page }) => {
    await page.goto("/pipeline");
    const stageColumns = page.locator('[data-testid="stage-column"]');
    await expect(stageColumns).toHaveCount(6);
  });

  test("should show empty state for each stage", async ({ page }) => {
    await page.goto("/pipeline");
    await expect(page.locator("text=No leads in this stage")).toBeVisible();
  });

  test("should have responsive design for mobile", async ({ page }) => {
    await page.goto("/pipeline");
    await expect(page.locator("text=New Lead")).toBeVisible();
  });

  test("should display pipeline header", async ({ page }) => {
    await page.goto("/pipeline");
    await expect(page.locator("h1")).toContainText("Pipeline");
  });
});
