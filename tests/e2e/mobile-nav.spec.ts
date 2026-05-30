import { test, expect } from "@playwright/test";

test.describe("Mobile Navigation", () => {
  test("should display bottom navigation on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");
    await expect(page.locator("nav")).toBeVisible();
  });

  test("should have all navigation items", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");
    await expect(page.locator("text=Dashboard")).toBeVisible();
    await expect(page.locator("text=Pipeline")).toBeVisible();
    await expect(page.locator("text=Leads")).toBeVisible();
    await expect(page.locator("text=Follow-ups")).toBeVisible();
  });

  test("should navigate between pages", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");
    await page.click("text=Pipeline");
    await expect(page).toHaveURL(/\/pipeline/);
  });

  test("should have proper touch target sizes", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");
    const navItems = page.locator("nav button, nav a");
    const count = await navItems.count();
    for (let i = 0; i < count; i++) {
      const box = await navItems.nth(i).boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("should show active state for current page", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");
    await expect(page.locator("text=Dashboard")).toHaveCSS(
      "color",
      "rgb(15, 118, 110)"
    );
  });

  test("should have responsive layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");
    await expect(page.locator("main")).toBeVisible();
  });

  test("should work on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/dashboard");
    await expect(page.locator("nav")).toBeVisible();
  });

  test("should work on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/dashboard");
    await expect(page.locator("nav")).toBeVisible();
  });
});
