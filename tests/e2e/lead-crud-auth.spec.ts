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
    await expect(page.locator("#fullName")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#phone")).toBeVisible();
    await expect(page.locator("#source")).toBeVisible();
  });

  test("should require name field", async ({ authenticatedPage: page }) => {
    await page.goto("/leads/new");
    const nameInput = page.locator("#fullName");
    await expect(nameInput).toHaveAttribute("required", "");
  });

  test("should create a new lead successfully", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill("#fullName", "John Doe");
    await page.fill("#email", "john@example.com");
    await page.fill("#phone", "555-0123");
    await page.selectOption("#source", "manual");
    await page.fill("#notes", "Test lead for E2E");

    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/?$/, { timeout: 10000 });
    await expect(page.locator("text=John Doe")).toBeVisible();
  });

  test("should navigate to lead detail from list", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/leads/new");
    await page.fill("#fullName", "Jane Smith");
    await page.fill("#email", "jane@example.com");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/?$/, { timeout: 10000 });
    await page.click("text=Jane Smith");
    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await expect(page.locator("text=Jane Smith")).toBeVisible();
    await expect(page.locator("text=jane@example.com")).toBeVisible();
  });

  test("should edit an existing lead", async ({ authenticatedPage: page }) => {
    await page.goto("/leads/new");
    await page.fill("#fullName", "Edit Test");
    await page.fill("#email", "edit@test.com");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/?$/, { timeout: 10000 });
    await page.locator(`a:has-text("Edit Test")`).first().click();
    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.locator('a[href*="/edit"]').first().click();

    await page.waitForURL(/\/leads\/[a-f0-9-]+\/edit/, { timeout: 10000 });
    await page.fill("#fullName", "Edit Test Updated");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Edit Test Updated")).toBeVisible();
  });

  test("should delete a lead", async ({ authenticatedPage: page }) => {
    await page.goto("/leads/new");
    await page.fill("#fullName", "Delete Test");
    await page.fill("#email", "delete@test.com");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/?$/, { timeout: 10000 });

    page.on("dialog", (dialog) => dialog.accept());
    await page.locator(`a:has-text("Delete Test")`).first().click();
    await page.waitForURL(/\/leads\/[a-f0-9-]+/, { timeout: 10000 });
    await page.locator("button:has(.lucide-trash-2)").click();

    await page.waitForURL(/\/leads\/?$/, { timeout: 10000 });
    await expect(page.locator("text=Delete Test")).not.toBeVisible();
  });

  test("should search leads by name", async ({ authenticatedPage: page }) => {
    await page.goto("/leads/new");
    await page.fill("#fullName", "Searchable Lead");
    await page.fill("#email", "search@test.com");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/leads\/?$/, { timeout: 10000 });

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
    await expect(page.locator("text=total leads")).toBeVisible();
  });
});
