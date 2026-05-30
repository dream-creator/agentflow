import { test, expect } from "./fixtures/auth";

test.describe("Pipeline (Authenticated)", () => {
  test("should display pipeline page for authenticated user", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/pipeline");
    await expect(page).toHaveURL(/\/pipeline/);
    await expect(page.locator("h1")).toContainText("Pipeline");
  });

  test("should show empty state when no leads exist", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/pipeline");
    await expect(page.locator("text=No leads yet")).toBeVisible();
  });

  test("should navigate to add lead from pipeline", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/pipeline");
    await page.click("text=Add Lead");
    await expect(page).toHaveURL(/\/leads\/new/);
  });

  test("should display pipeline stages after adding leads", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Pipeline Lead");
    await page.fill('input[name="email"]', "pipeline@test.com");
    await page.selectOption('select[name="stage"]', "new_lead");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.goto("/pipeline");

    await expect(page.locator("text=New Lead")).toBeVisible();
    await expect(page.locator("text=Pipeline Lead")).toBeVisible();
  });

  test("should show lead count per stage", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Count Lead");
    await page.fill('input[name="email"]', "count@test.com");
    await page.selectOption('select[name="stage"]', "contacted");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.goto("/pipeline");

    await expect(page.locator("text=Contacted")).toBeVisible();
  });

  test("should display drag handle on lead cards", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Drag Handle Lead");
    await page.fill('input[name="email"]', "drag@test.com");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.goto("/pipeline");

    const dragHandle = page.locator("[data-testid='grip-vertical']").first();
    await expect(dragHandle).toBeVisible();
  });

  test("should have horizontal scroll on pipeline", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/pipeline");
    const pipelineContainer = page.locator(".flex.gap-4.overflow-x-auto");
    await expect(pipelineContainer).toBeVisible();
  });

  test("should display all 6 pipeline stages", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "All Stages Lead");
    await page.fill('input[name="email"]', "stages@test.com");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.goto("/pipeline");

    await expect(page.locator("text=New Lead")).toBeVisible();
    await expect(page.locator("text=Contacted")).toBeVisible();
    await expect(page.locator("text=Showing")).toBeVisible();
    await expect(page.locator("text=Offer")).toBeVisible();
    await expect(page.locator("text=Closed Won")).toBeVisible();
    await expect(page.locator("text=Closed Lost")).toBeVisible();
  });

  test("should show lead next action on pipeline card", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Action Lead");
    await page.fill('input[name="email"]', "action@test.com");
    await page.fill('textarea[name="next_action"]', "Call tomorrow");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.goto("/pipeline");

    await expect(page.locator("text=Call tomorrow")).toBeVisible();
  });

  test("should show lead next action date on pipeline card", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Date Lead");
    await page.fill('input[name="email"]', "date@test.com");
    await page.fill('input[name="next_action_date"]', "2026-06-15");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.goto("/pipeline");

    await expect(page.locator("text=6/15/2026")).toBeVisible();
  });

  test("should navigate to lead detail from pipeline card", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Detail Lead");
    await page.fill('input[name="email"]', "detail@test.com");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.goto("/pipeline");

    await page.click("text=Detail Lead");
    await expect(page).toHaveURL(/\/leads\/[a-f0-9-]+/);
  });
});
