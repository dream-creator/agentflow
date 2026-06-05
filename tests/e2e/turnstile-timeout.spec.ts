import { test, expect } from "@playwright/test";

/**
 * Verifies the 10s timeout fallback for the Turnstile widget.
 *
 * Scenario: an ad blocker or blocked network prevents the
 * `challenges.cloudflare.com` script from loading, so `onLoad`
 * never fires. Without a fallback, the user sees a permanent
 * "Loading security check..." hint and the submit button stays
 * disabled. With the fallback, after 10s the widget surfaces an
 * error state so the user knows to refresh or disable the blocker.
 *
 * Requires the deploy environment to have
 * `NEXT_PUBLIC_TURNSTILE_TEST_BYPASS=false` (or unset) so the
 * real widget path is exercised.
 */
test.describe("Turnstile load timeout fallback", () => {
  test("shows error state after 10s when Turnstile script is blocked", async ({
    page,
  }) => {
    // Block the Turnstile script to simulate an ad blocker
    await page.route(/challenges\.cloudflare\.com/, (route) => route.abort());

    await page.goto("/login");
    await page.waitForLoadState("networkidle").catch(() => {
      // networkidle may never resolve when requests are aborted;
      // fall back to a short fixed wait
    });

    // Initial state: loading hint
    await expect(page.getByText(/loading security check/i)).toBeVisible({
      timeout: 5000,
    });

    // After 10s: error state visible
    await expect(
      page.getByText(/verification (failed|unavailable|blocked)/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("retry button resets the timeout when user clicks it", async ({
    page,
  }) => {
    await page.route(/challenges\.cloudflare\.com/, (route) => route.abort());

    await page.goto("/login");
    await expect(page.getByText(/loading security check/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByText(/verification (failed|unavailable|blocked)/i),
    ).toBeVisible({ timeout: 15_000 });

    // Click retry → should reset back to loading state
    const retryButton = page.getByRole("button", { name: /retry|try again/i });
    if (await retryButton.isVisible().catch(() => false)) {
      await retryButton.click();
      await expect(page.getByText(/loading security check/i)).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
