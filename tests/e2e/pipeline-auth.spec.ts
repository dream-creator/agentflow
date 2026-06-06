import { test, expect } from "./fixtures/auth";

test.describe("Pipeline (Authenticated)", () => {
  test("should display pipeline page for authenticated user", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/pipeline");
    await expect(page).toHaveURL(/\/pipeline/);
    await expect(page.locator("h1")).toContainText("Pipeline");
  });

  test("should render all 6 pipeline stage columns", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/pipeline");
    await expect(page.locator("text=New Lead")).toBeVisible();
    await expect(page.locator("text=Contacted")).toBeVisible();
    await expect(page.locator("text=Showing")).toBeVisible();
    await expect(page.locator("text=Offer").first()).toBeVisible();
    await expect(page.locator("text=Closed Won")).toBeVisible();
    await expect(page.locator("text=Closed Lost")).toBeVisible();
  });

  test("should show a lead in the New Lead column after creation", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill("#fullName", "Pipeline Test Lead");
    await page.fill("#email", "pipeline@test.com");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/leads\/?$/, { timeout: 10000 });

    await page.goto("/pipeline");
    await expect(page.locator("text=Pipeline Test Lead")).toBeVisible();
  });

  test("should have a horizontally scrollable board", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/pipeline");
    const board = page.locator(".flex.gap-4.overflow-x-auto").first();
    await expect(board).toBeVisible();
  });

  test("should display drag handles on lead cards", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill("#fullName", "Drag Lead");
    await page.fill("#email", "drag@test.com");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/leads\/?$/, { timeout: 10000 });

    await page.goto("/pipeline");
    const dragHandle = page.locator("svg.lucide-grip-vertical").first();
    await expect(dragHandle).toBeVisible();
  });

  test("should navigate to lead detail from pipeline card", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill("#fullName", "Pipeline Detail Lead");
    await page.fill("#email", "detail@test.com");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/leads\/?$/, { timeout: 10000 });

    await page.goto("/pipeline");
    await page.locator(`a:has-text("Pipeline Detail Lead")`).first().click();
    await expect(page).toHaveURL(/\/leads\/[a-f0-9-]+/);
  });
});
