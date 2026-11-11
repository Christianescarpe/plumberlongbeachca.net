import playwright from "/tmp/pw/node_modules/playwright/index.js";
const { chromium } = playwright;
import fs from "node:fs";
import path from "node:path";

const base = process.env.BASE || "http://127.0.0.1:41731";
const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(path.join(out, "desktop"), { recursive: true });
fs.mkdirSync(path.join(out, "mobile"), { recursive: true });
fs.mkdirSync(path.join(out, "full"), { recursive: true });

const paths = [
  "/",
  "/services/",
  "/services/drain-cleaning/",
  "/services/sewer-repair/",
  "/services/leak-detection/",
  "/services/pipe-water-line-repair/",
  "/services/water-heaters/",
  "/services/fixtures-remodel-plumbing/",
  "/services/gas-line-plumbing/",
  "/services/commercial-plumbing/",
  "/services/specialty-plumbing/",
  "/areas/",
  "/areas/downtown-alamitos-beach/",
  "/areas/belmont-shore-heights/",
  "/areas/bixby-knolls-california-heights/",
  "/areas/east-long-beach/",
  "/areas/north-long-beach/",
  "/areas/wrigley-west-central/",
  "/areas/signal-hill/",
  "/areas/lakewood/",
  "/areas/seal-beach/",
  "/areas/los-alamitos/",
  "/areas/carson/",
  "/about/",
  "/contact/",
  "/privacy/",
  "/how-referrals-work/",
  "/plumbing-guides/",
];

const slug = (url) => (url === "/" ? "home" : url.replaceAll("/", "-").replace(/^-|-$/g, ""));
const overflow = [];

const browser = await chromium.launch({ headless: true });
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function shoot(context, folder, fullAlso) {
  const page = await context.newPage();
  for (const url of paths) {
    const response = await page.goto(base + url, { waitUntil: "networkidle" });
    if (!response || response.status() !== 200) overflow.push(`${folder} ${url} status ${response && response.status()}`);
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (wide > 1) overflow.push(`${folder} ${url} horizontal overflow ${wide}px`);
    const pending = await page.locator("text=Phone setup pending").count();
    if (!pending) overflow.push(`${folder} ${url} missing pending phone state`);
    await page.screenshot({ path: path.join(out, folder, `${slug(url)}.png`) });
    if (fullAlso.includes(url)) {
      await page.screenshot({ path: path.join(out, "full", `${folder}-${slug(url)}.png`), fullPage: true });
    }
  }
  await page.close();
}

await shoot(desktop, "desktop", ["/", "/services/drain-cleaning/", "/contact/", "/areas/downtown-alamitos-beach/"]);
await shoot(mobile, "mobile", ["/", "/services/drain-cleaning/", "/contact/", "/areas/signal-hill/"]);

const tablet = await browser.newContext({ viewport: { width: 768, height: 1024 } });
const tabletPage = await tablet.newPage();
for (const url of ["/", "/services/sewer-repair/", "/areas/", "/contact/"]) {
  await tabletPage.goto(base + url, { waitUntil: "networkidle" });
  const wide = await tabletPage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (wide > 1) overflow.push(`tablet ${url} horizontal overflow ${wide}px`);
  await tabletPage.screenshot({ path: path.join(out, "desktop", `tablet-${slug(url)}.png`) });
}
await tabletPage.close();

await browser.close();
const report = overflow.length ? overflow.join("\n") : "No horizontal overflow. Pending phone state present. All sampled URLs returned 200.";
fs.writeFileSync(path.join(out, "VISUAL-CHECKS.txt"), report + "\n");
console.log(report);
if (overflow.length) process.exit(1);
