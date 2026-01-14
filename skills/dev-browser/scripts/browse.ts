#!/usr/bin/env npx tsx
/**
 * Simple browser command wrapper for Claude Cowork
 * Usage: npx tsx scripts/browse.ts <url> [--screenshot <path>]
 */

import { connect, waitForPageLoad } from "../src/client.js";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: npx tsx scripts/browse.ts <url> [--screenshot <filename>]");
    console.log("Example: npx tsx scripts/browse.ts https://google.com --screenshot google.png");
    process.exit(1);
  }

  const url = args[0];
  const screenshotIndex = args.indexOf("--screenshot");
  const screenshotName = screenshotIndex >= 0 ? args[screenshotIndex + 1] : null;

  try {
    const client = await connect();
    const page = await client.page("browse", { viewport: { width: 1280, height: 800 } });

    console.log(`Navigating to: ${url}`);
    await page.goto(url);
    await waitForPageLoad(page);

    const title = await page.title();
    const currentUrl = page.url();
    console.log(`Title: ${title}`);
    console.log(`URL: ${currentUrl}`);

    // Get page text content (summarized)
    const bodyText = await page.evaluate(() => {
      return document.body.innerText.slice(0, 2000);
    });
    console.log("\n--- Page Content Preview ---");
    console.log(bodyText);
    console.log("----------------------------\n");

    if (screenshotName) {
      const screenshotPath = join(__dirname, "..", "tmp", screenshotName);
      await page.screenshot({ path: screenshotPath });
      console.log(`Screenshot saved: ${screenshotPath}`);
    }

    await client.disconnect();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
