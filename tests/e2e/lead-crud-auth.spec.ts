import { test, expect } from "./fixtures/auth";

test.describe("Lead CRUD (Authenticated)", () => {
  test("should display leads page for authenticated user", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads");
    await expect(page).toHaveURL(/\/leads/);
    await expect(page.locator("h1")).toContainText("Leads");
  });

  test("should show empty state when no leads exist", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads");
    await expect(page.locator("text=No leads yet")).toBeVisible();
  });

  test("should navigate to add lead page", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads");
    await page.click("text=Add Lead");
    await expect(page).toHaveURL(/\/leads\/new/);
  });

  test("should display lead form with all fields", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('select[name="source"]')).toBeVisible();
    await expect(page.locator('select[name="stage"]')).toBeVisible();
  });

  test("should have 6 pipeline stages in dropdown", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    const stageSelect = page.locator('select[name="stage"]');
    await expect(stageSelect).toBeVisible();
    await expect(stageSelect.locator("option")).toHaveCount(6);
  });

  test("should require name field", async ({ authenticatedPage: page }) => {
    await page.goto("/leads/new");
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveAttribute("required", "");
  });

  test("should create a new lead successfully", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "John Doe");
    await page.fill('input[name="email"]', "john@example.com");
    await page.fill('input[name="phone"]', "555-0123");
    await page.selectOption('select[name="source"]', "manual");
    await page.selectOption('select[name="stage"]', "new_lead");
    await page.fill('textarea[name="notes"]', "Test lead for E2E");

    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await expect(page.locator("text=John Doe")).toBeVisible();
  });

  test("should display lead detail page", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Jane Smith");
    await page.fill('input[name="email"]', "jane@example.com");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await expect(page.locator("text=Jane Smith")).toBeVisible();
    await expect(page.locator("text=jane@example.com")).toBeVisible();
  });

  test("should edit an existing lead", async ({ authenticatedPage: page }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Edit Test");
    await page.fill('input[name="email"]', "edit@test.com");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.click("text=Edit");

    await page.waitForURL(/\/leads\/[a-f0-9-]+\/edit/, { timeout: 10000 });
    await page.fill('input[name="name"]', "Edit Test Updated");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Edit Test Updated")).toBeVisible();
  });

  test("should delete a lead", async ({ authenticatedPage: page }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Delete Test");
    await page.fill('input[name="email"]', "delete@test.com");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });

    page.on("dialog", (dialog) => dialog.accept());
    await page.click("text=Delete");

    await page.waitForURL(/\/leads/, { timeout: 10000 });
    await expect(page.locator("text=Delete Test")).not.toBeVisible();
  });

  test("should search leads by name", async ({ authenticatedPage: page }) => {
    await page.goto("/leads/new");
    await page.fill('input[name="name"]', "Searchable Lead");
    await page.fill('input[name="email"]', "search@test.com");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.goto("/leads");

    await page.fill('input[placeholder*="Search"]', "Searchable");
    await expect(page.locator("text=Searchable Lead")).toBeVisible();
  });

  test("should cancel lead creation and return to leads", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.click("text=Cancel");
    await expect(page).toHaveURL(/\/leads/);
  });

  test("should display lead count on leads page", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads");
    await expect(page.locator("text=active leads")).toBeVisible();
  });
});
