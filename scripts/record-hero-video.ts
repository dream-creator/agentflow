/**
 * Records a hero demo video of the pipeline page.
 *
 * Usage: npx tsx scripts/record-hero-video.ts
 *
 * Prerequisites:
 *   - Dev server running on localhost:3000
 *   - playwright browsers installed
 *
 * Output: public/hero-demo.webm (~15s loop)
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
    console.log("1/8 Navigating to demo pipeline page...");
    await page.goto(`${BASE_URL}/demo`, { waitUntil: "networkidle" });
    await sleep(1500);

    // Wait for pipeline board
    await page.waitForSelector("h1:has-text('Pipeline')", { timeout: 10000 });
    await sleep(800);

    // 2. Initial static view — let viewer absorb layout
    console.log("2/8 Holding initial view...");
    await sleep(2000);

    // 3. Slow scroll to reveal "Contacted" and "Showing" stages
    console.log("3/8 Scrolling down to reveal stages...");
    await page.evaluate(() => window.scrollTo({ top: 180, behavior: "smooth" }));
    await sleep(1500);

    // 4. Hover over Sarah Chen card — show hover state
    console.log("4/8 Hovering over lead card...");
    const sarahName = page.locator("a:has-text('Sarah Chen')").first();
    if (await sarahName.isVisible()) {
      const box = await sarahName.boundingBox();
      if (box) {
        await smoothMove(
          page,
          WIDTH / 2,
          HEIGHT / 2,
          box.x + box.width / 2,
          box.y + box.height / 2,
          700
        );
        await sleep(1000);
      }
    }

    // 5. Click the stage dropdown on a card
    console.log("5/8 Opening stage dropdown...");
    const dropdowns = page.locator("button:has-text('New Lead')").first();
    if (await dropdowns.isVisible()) {
      const box = await dropdowns.boundingBox();
      if (box) {
        await smoothMove(
          page,
          box.x - 100,
          box.y,
          box.x + box.width / 2,
          box.y + box.height / 2,
          400
        );
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await sleep(1000);
      }
    }

    // 6. Click "Contacted" in dropdown to move the lead
    console.log("6/8 Moving lead to Contacted stage...");
    const contactedOption = page.locator("button:has-text('Contacted')").last();
    if (await contactedOption.isVisible()) {
      const box = await contactedOption.boundingBox();
      if (box) {
        await smoothMove(
          page,
          box.x + box.width / 2,
          box.y - 20,
          box.x + box.width / 2,
          box.y + box.height / 2,
          300
        );
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await sleep(1200);
      }
    }

    // 7. Scroll down to show Closed Won
    console.log("7/8 Scrolling to show more stages...");
    await page.evaluate(() => window.scrollTo({ top: 450, behavior: "smooth" }));
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

    // 8. Scroll back to top for final view
    console.log("8/8 Final view at top...");
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
