import { test, expect } from "./fixtures/auth";

test.describe("Follow-ups (Authenticated)", () => {
  test("should display follow-ups page for authenticated user", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/follow-ups");
    await expect(page).toHaveURL(/\/follow-ups/);
    await expect(page.locator("h1")).toContainText("Follow-ups");
  });

  test("should show empty state when no follow-ups exist", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/follow-ups");
    await expect(page.locator("text=No follow-ups")).toBeVisible();
  });

  test("should display overdue section", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Overdue Lead");
    await page.fill('input[name="email"]', "overdue@test.com");
    await page.fill('input[name="next_action_date"]', "2026-01-01");
    await page.fill('textarea[name="next_action"]', "Call overdue");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.goto("/follow-ups");

    await expect(page.locator("text=Overdue")).toBeVisible();
  });

  test("should display upcoming section", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Upcoming Lead");
    await page.fill('input[name="email"]', "upcoming@test.com");
    await page.fill('input[name="next_action_date"]', "2026-06-15");
    await page.fill('textarea[name="next_action"]', "Meeting upcoming");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.goto("/follow-ups");

    await expect(page.locator("text=Upcoming")).toBeVisible();
  });

  test("should show lead name in follow-up list", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Follow-up Name");
    await page.fill('input[name="email"]', "followup@test.com");
    await page.fill('input[name="next_action_date"]', "2026-06-20");
    await page.fill('textarea[name="next_action"]', "Follow-up task");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.goto("/follow-ups");

    await expect(page.locator("text=Follow-up Name")).toBeVisible();
  });

  test("should show follow-up action description", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Action Desc Lead");
    await page.fill('input[name="email"]', "actiondesc@test.com");
    await page.fill('input[name="next_action_date"]', "2026-06-25");
    await page.fill('textarea[name="next_action"]', "Important call");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.goto("/follow-ups");

    await expect(page.locator("text=Important call")).toBeVisible();
  });

  test("should show follow-up date", async ({ authenticatedPage: page }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Date Follow-up");
    await page.fill('input[name="email"]', "datefollow@test.com");
    await page.fill('input[name="next_action_date"]', "2026-07-01");
    await page.fill('textarea[name="next_action"]', "July meeting");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.goto("/follow-ups");

    await expect(page.locator("text=7/1/2026")).toBeVisible();
  });

  test("should show pipeline stage badge", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Stage Badge Lead");
    await page.fill('input[name="email"]', "stagebadge@test.com");
    await page.fill('input[name="next_action_date"]', "2026-06-18");
    await page.fill('textarea[name="next_action"]', "Stage test");
    await page.selectOption('select[name="stage"]', "contacted");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.goto("/follow-ups");

    await expect(page.locator("text=Contacted")).toBeVisible();
  });

  test("should navigate to lead detail from follow-up", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Navigate Lead");
    await page.fill('input[name="email"]', "navigate@test.com");
    await page.fill('input[name="next_action_date"]', "2026-06-22");
    await page.fill('textarea[name="next_action"]', "Navigation test");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.goto("/follow-ups");

    await page.click("text=Navigate Lead");
    await expect(page).toHaveURL(/\/leads\/[a-f0-9-]+/);
  });

  test("should have contact action buttons", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Contact Lead");
    await page.fill('input[name="email"]', "contact@test.com");
    await page.fill('input[name="phone"]', "555-0199");
    await page.fill('input[name="next_action_date"]', "2026-06-19");
    await page.fill('textarea[name="next_action"]', "Contact test");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.goto("/follow-ups");

    await expect(page.locator('[title*="Call"]')).toBeVisible();
    await expect(page.locator('[title*="Email"]')).toBeVisible();
    await expect(page.locator('[title*="Text"]')).toBeVisible();
  });
});
