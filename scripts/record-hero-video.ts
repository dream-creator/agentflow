/**
 * Records a hero demo video of the pipeline page.
 * Showcases: email composer typing animation, call screen timer, text message typing indicator.
 *
 * Usage: npx tsx scripts/record-hero-video.ts
 *
 * Prerequisites:
 *   - Dev server running on localhost:3000
 *   - playwright browsers installed
 *
 * Output: public/hero-demo.webm (~25s loop)
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
    console.log("1/14 Navigating to demo pipeline page...");
    await page.goto(`${BASE_URL}/demo`, { waitUntil: "networkidle" });
    await sleep(1500);

    await page.waitForSelector("h1:has-text('Pipeline')", { timeout: 10000 });
    await sleep(800);

    // 2. Initial static view
    console.log("2/14 Holding initial view...");
    await sleep(2000);

    // 3. Scroll to reveal action buttons
    console.log("3/14 Scrolling to reveal lead cards...");
    await page.evaluate(() => window.scrollTo({ top: 120, behavior: "smooth" }));
    await sleep(1200);

    // ═══════════════════════════════════════════
    // 4. EMAIL MOCKUP — Click email on Sarah Chen
    // ═══════════════════════════════════════════
    console.log("4/14 Hovering over Sarah Chen card...");
    const sarahCard = page.locator("a:has-text('Sarah Chen')").first();
    if (await sarahCard.isVisible()) {
      const box = await sarahCard.boundingBox();
      if (box) {
        await smoothMove(page, WIDTH / 2, HEIGHT / 2, box.x + box.width / 2, box.y + box.height / 2, 600);
        await sleep(600);
      }
    }

    console.log("5/14 Clicking email button — showing email composer...");
    const emailBtn = page.locator('button[title="Email"]').first();
    if (await emailBtn.isVisible()) {
      const box = await emailBtn.boundingBox();
      if (box) {
        await smoothMove(page, box.x - 80, box.y, box.x + box.width / 2, box.y + box.height / 2, 300);
        await sleep(300);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        // Wait for typing animation to play (the email body types out)
        await sleep(4000);
      }
    }

    // Close email popup by clicking backdrop
    console.log("6/14 Closing email popup...");
    await page.mouse.click(10, 10);
    await sleep(600);

    // ═══════════════════════════════════════════
    // 7. CALL MOCKUP — Click call on Marcus Johnson
    // ═══════════════════════════════════════════
    console.log("7/14 Hovering over Marcus Johnson...");
    const marcusCard = page.locator("a:has-text('Marcus Johnson')").first();
    if (await marcusCard.isVisible()) {
      const box = await marcusCard.boundingBox();
      if (box) {
        await smoothMove(page, box.x + box.width / 2, box.y - 40, box.x + box.width / 2, box.y + box.height / 2, 400);
        await sleep(500);
      }
    }

    console.log("8/14 Clicking call button — showing call screen...");
    const callBtn = page.locator('button[title="Call"]').first();
    if (await callBtn.isVisible()) {
      const box = await callBtn.boundingBox();
      if (box) {
        await smoothMove(page, box.x - 60, box.y, box.x + box.width / 2, box.y + box.height / 2, 250);
        await sleep(300);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        // Wait for call timer to tick a few seconds
        await sleep(4000);
      }
    }

    // Close call popup by clicking the red end-call button
    console.log("9/14 Ending call...");
    const endCallBtn = page.locator("button:has(svg)").filter({ has: page.locator("[data-lucide='phone-off']") }).first();
    // Fallback: click backdrop
    await page.mouse.click(10, 10);
    await sleep(600);

    // ═══════════════════════════════════════════
    // 10. TEXT MOCKUP — Click text on Marcus Johnson
    // ═══════════════════════════════════════════
    console.log("10/14 Clicking text button — showing message thread...");
    const textBtn = page.locator('button[title="Text"]').first();
    if (await textBtn.isVisible()) {
      const box = await textBtn.boundingBox();
      if (box) {
        await smoothMove(page, box.x + box.width / 2, box.y - 30, box.x + box.width / 2, box.y + box.height / 2, 250);
        await sleep(300);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        // Wait for typing indicator to appear
        await sleep(3000);
      }
    }

    // Close text popup
    console.log("11/14 Closing text popup...");
    await page.mouse.click(10, 10);
    await sleep(600);

    // ═══════════════════════════════════════════
    // 12. STAGE CHANGE — Move Emily to Showing
    // ═══════════════════════════════════════════
    console.log("12/12 Opening stage dropdown on Emily Rodriguez...");
    const dropdown = page.locator("button:has-text('Contacted')").first();
    if (await dropdown.isVisible()) {
      const box = await dropdown.boundingBox();
      if (box) {
        await smoothMove(page, box.x - 120, box.y, box.x + box.width / 2, box.y + box.height / 2, 400);
        await sleep(400);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await sleep(700);
      }
    }

    console.log("13/14 Moving Emily Rodriguez to Showing stage...");
    const showingOption = page.locator("button:has-text('Showing')").last();
    if (await showingOption.isVisible()) {
      const box = await showingOption.boundingBox();
      if (box) {
        await smoothMove(page, box.x + box.width / 2, box.y - 20, box.x + box.width / 2, box.y + box.height / 2, 300);
        await sleep(300);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await sleep(1200);
      }
    }

    // 14. Final view
    console.log("14/14 Final view...");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(1500);

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
