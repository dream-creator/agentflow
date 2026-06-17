/**
 * Records a hero demo video of the pipeline page.
 * Showcases: lead cards, action buttons (email/call/text), stage changes, and pipeline flow.
 *
 * Usage: npx tsx scripts/record-hero-video.ts
 *
 * Prerequisites:
 *   - Dev server running on localhost:3000
 *   - playwright browsers installed
 *
 * Output: public/hero-demo.webm (~18s loop)
 */

import { chromium, type Page } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_PATH = "public/hero-demo.webm";
const WIDTH = 1280;
const HEIGHT = 720;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Move cursor with smooth cubic easing */
async function smoothMove(
  page: Page,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  duration = 500
) {
  const steps = Math.max(1, Math.ceil(duration / 16));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    await page.mouse.move(
      startX + (endX - startX) * ease,
      startY + (endY - startY) * ease
    );
    await sleep(16);
  }
}

async function main() {
  console.log("Launching browser with video recording...");

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: "/tmp/hero-recordings",
      size: { width: WIDTH, height: HEIGHT },
    },
  });

  const page = await context.newPage();

  try {
    // 1. Navigate to demo page
    console.log("1/12 Navigating to demo pipeline page...");
    await page.goto(`${BASE_URL}/demo`, { waitUntil: "networkidle" });
    await sleep(1500);

    // Wait for pipeline board
    await page.waitForSelector("h1:has-text('Pipeline')", { timeout: 10000 });
    await sleep(800);

    // 2. Initial static view — let viewer absorb the full pipeline layout
    console.log("2/12 Holding initial view...");
    await sleep(2000);

    // 3. Scroll down to reveal "New Lead" and "Contacted" stages with action buttons
    console.log("3/12 Scrolling to reveal lead cards...");
    await page.evaluate(() => window.scrollTo({ top: 120, behavior: "smooth" }));
    await sleep(1200);

    // 4. Hover over Sarah Chen card — reveal action buttons (email, call, text)
    console.log("4/12 Hovering over Sarah Chen card to show action buttons...");
    const sarahCard = page.locator("a:has-text('Sarah Chen')").first();
    if (await sarahCard.isVisible()) {
      const box = await sarahCard.boundingBox();
      if (box) {
        await smoothMove(
          page,
          WIDTH / 2,
          HEIGHT / 2,
          box.x + box.width / 2,
          box.y + box.height / 2,
          600
        );
        await sleep(800);
      }
    }

    // 5. Click the Email button on Sarah Chen — showcase email interaction
    console.log("5/12 Clicking email button on Sarah Chen...");
    const emailBtn = page.locator('a[title="Email"]').first();
    if (await emailBtn.isVisible()) {
      const box = await emailBtn.boundingBox();
      if (box) {
        await smoothMove(
          page,
          box.x - 80,
          box.y,
          box.x + box.width / 2,
          box.y + box.height / 2,
          300
        );
        await sleep(400);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await sleep(1200);
      }
    }

    // 6. Hover over Marcus Johnson — show call button
    console.log("6/12 Hovering over Marcus Johnson to show call button...");
    const marcusCard = page.locator("a:has-text('Marcus Johnson')").first();
    if (await marcusCard.isVisible()) {
      const box = await marcusCard.boundingBox();
      if (box) {
        await smoothMove(
          page,
          box.x + box.width / 2,
          box.y,
          box.x + box.width / 2,
          box.y + box.height / 2,
          400
        );
        await sleep(600);
      }
    }

    // 7. Click the Call button on Marcus Johnson — showcase calling interaction
    console.log("7/12 Clicking call button on Marcus Johnson...");
    const callBtn = page.locator('a[title="Call"]').first();
    if (await callBtn.isVisible()) {
      const box = await callBtn.boundingBox();
      if (box) {
        await smoothMove(
          page,
          box.x + box.width / 2,
          box.y - 30,
          box.x + box.width / 2,
          box.y + box.height / 2,
          250
        );
        await sleep(400);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await sleep(1200);
      }
    }

    // 8. Click the Text button on Marcus Johnson — showcase messaging interaction
    console.log("8/12 Clicking text button on Marcus Johnson...");
    const textBtn = page.locator('a[title="Text"]').first();
    if (await textBtn.isVisible()) {
      const box = await textBtn.boundingBox();
      if (box) {
        await smoothMove(
          page,
          box.x + box.width / 2,
          box.y,
          box.x + box.width / 2,
          box.y + box.height / 2,
          250
        );
        await sleep(400);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await sleep(1200);
      }
    }

    // 9. Click the stage dropdown on Emily Rodriguez — show stage management
    console.log("9/12 Opening stage dropdown on Emily Rodriguez...");
    const dropdown = page.locator("button:has-text('Contacted')").first();
    if (await dropdown.isVisible()) {
      const box = await dropdown.boundingBox();
      if (box) {
        await smoothMove(
          page,
          box.x - 120,
          box.y,
          box.x + box.width / 2,
          box.y + box.height / 2,
          400
        );
        await sleep(500);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await sleep(800);
      }
    }

    // 10. Move Emily to "Showing" stage — demonstrate pipeline progression
    console.log("10/12 Moving Emily Rodriguez to Showing stage...");
    const showingOption = page.locator("button:has-text('Showing')").last();
    if (await showingOption.isVisible()) {
      const box = await showingOption.boundingBox();
      if (box) {
        await smoothMove(
          page,
          box.x + box.width / 2,
          box.y - 20,
          box.x + box.width / 2,
          box.y + box.height / 2,
          300
        );
        await sleep(400);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await sleep(1200);
      }
    }

    // 11. Scroll down to show Offer and Closed Won stages
    console.log("11/12 Scrolling to show Offer and Closed Won...");
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: "smooth" }));
    await sleep(1500);

    // Hover over Alex Martinez (Closed Won)
    const alexCard = page.locator("a:has-text('Alex Martinez')").first();
    if (await alexCard.isVisible()) {
      const box = await alexCard.boundingBox();
      if (box) {
        await smoothMove(
          page,
          box.x - 50,
          box.y,
          box.x + box.width / 2,
          box.y + box.height / 2,
          500
        );
        await sleep(1000);
      }
    }

    // 12. Scroll back to top for final view
    console.log("12/12 Final view at top...");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(2000);

    console.log("Recording complete!");
  } finally {
    const videoPath = await page.video()?.path();
    await context.close();
    await browser.close();

    if (videoPath) {
      console.log(`Raw video: ${videoPath}`);
      const { copyFileSync, mkdirSync } = await import("fs");
      const { dirname, resolve } = await import("path");
      const outPath = resolve(OUTPUT_PATH);
      mkdirSync(dirname(outPath), { recursive: true });
      copyFileSync(videoPath, outPath);
      console.log(`Copied to: ${outPath}`);

      // Get file size
      const { statSync } = await import("fs");
      const stats = statSync(outPath);
      console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } else {
      console.error("No video recorded!");
    }
  }
}

main().catch((err) => {
  console.error("Recording failed:", err);
  process.exit(1);
});
