/**
 * Loopi — WizzHQ + Cre8core Scrapers
 * ────────────────────────────────────
 * Uses Browserless.io as the headless Chrome provider.
 * Falls back to local Chromium only if BROWSERLESS_API_KEY is not set
 * (useful for local dev without burning Browserless credits).
 *
 * Setup:
 *   1. Add to .env.local:
 *        BROWSERLESS_API_KEY=your_key_from_browserless.io
 *        BROWSERLESS_ENDPOINT=wss://production-sfo.browserless.io
 *        (endpoint shown in your Browserless dashboard under "Connect")
 *   2. npm install playwright
 *   3. For local fallback only: npx playwright install chromium
 *
 * Browserless session budget:
 *   Each scrape run opens 1 browser session per site.
 *   At 6h cron intervals = 4 runs/day x 2 sites = 8 sessions/day.
 *   Free tier is 1,000 sessions/month — you use ~240. Well clear.
 */

import { chromium, type Browser, type Page } from "playwright";
import type { RawCampaign } from "./aggregator";

// ─── Browser factory ──────────────────────────────────────────────────────────

async function getBrowser(): Promise<{ browser: Browser; isRemote: boolean }> {
  const apiKey = process.env.BROWSERLESS_API_KEY;
  const endpoint =
    process.env.BROWSERLESS_ENDPOINT ?? "wss://production-sfo.browserless.io";

  if (apiKey) {
    const wsEndpoint = `${endpoint}?token=${apiKey}`;
    const browser = await chromium.connectOverCDP(wsEndpoint);
    return { browser, isRemote: true };
  }

  console.warn("[scrapers] BROWSERLESS_API_KEY not set — using local Chromium");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  return { browser, isRemote: false };
}

async function closeBrowser(browser: Browser, isRemote: boolean): Promise<void> {
  // Both local and remote use the same close() — Browserless cleans up the session
  await browser.close();
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function parseDeadline(raw: string): string {
  const now = Date.now();
  const lower = raw.toLowerCase().trim();

  const days = lower.match(/(\d+)\s*d(ay)?s?/);
  if (days) return new Date(now + parseInt(days[1]) * 86400000).toISOString();

  const hours = lower.match(/(\d+)\s*h(our)?s?/);
  if (hours) return new Date(now + parseInt(hours[1]) * 3600000).toISOString();

  const parsed = Date.parse(raw);
  if (!isNaN(parsed)) return new Date(parsed).toISOString();

  return new Date(now + 7 * 86400000).toISOString();
}

function parseReward(raw: string): number {
  const cleaned = raw.replace(/[$,\s]/g, "").replace(/usdc|usdt|sol|eth/gi, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

async function safeText(page: Page, selector: string): Promise<string> {
  try {
    return (await page.$eval(selector, (el) => el.textContent ?? "")).trim();
  } catch {
    return "";
  }
}

function blockAssets(context: Awaited<ReturnType<Browser["newContext"]>>) {
  return context.route(
    "**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,otf}",
    (route) => route.abort()
  );
}

// ─── WizzHQ Scraper ───────────────────────────────────────────────────────────

export async function scrapeWizzhq(): Promise<RawCampaign[]> {
  const { browser, isRemote } = await getBrowser();
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
  });
  await blockAssets(context);

  const page = await context.newPage();
  const campaigns: RawCampaign[] = [];

  try {
    await page.goto("https://wizzhq.xyz/bounties", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await page.waitForSelector(
      '[class*="bounty"], [class*="campaign"], [class*="card"]',
      { timeout: 15000 }
    );

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    const cards = await page.$$eval(
      '[class*="bounty-card"], [class*="BountyCard"], [class*="campaign-card"]',
      (els) =>
        els.map((el) => ({
          title:
            el.querySelector('[class*="title"], h2, h3')?.textContent?.trim() ?? "",
          protocol:
            el
              .querySelector('[class*="sponsor"], [class*="protocol"], [class*="company"]')
              ?.textContent?.trim() ?? "",
          reward:
            el
              .querySelector('[class*="reward"], [class*="prize"], [class*="amount"]')
              ?.textContent?.trim() ?? "",
          deadline:
            el
              .querySelector('[class*="deadline"], [class*="end"], [class*="time"]')
              ?.textContent?.trim() ?? "",
          entries:
            el
              .querySelector(
                '[class*="submission"], [class*="entry"], [class*="participant"]'
              )
              ?.textContent?.trim() ?? "0",
          href:
            (el.closest("a") ?? el.querySelector("a"))?.getAttribute("href") ?? "",
        }))
    );

    for (const card of cards) {
      if (!card.title) continue;

      const sourceUrl = card.href.startsWith("http")
        ? card.href
        : `https://wizzhq.xyz${card.href}`;

      let description = "";
      if (card.href) {
        try {
          const detailPage = await context.newPage();
          await detailPage.goto(sourceUrl, {
            waitUntil: "domcontentloaded",
            timeout: 20000,
          });
          description = await safeText(
            detailPage,
            '[class*="description"], [class*="content"], [class*="brief"], article'
          );
          description = description.slice(0, 1000);
          await detailPage.close();
        } catch {
          // detail failed — continue
        }
      }

      campaigns.push({
        title: card.title,
        protocol_name: card.protocol || "Unknown",
        type: "bounty",
        reward_usd: parseReward(card.reward),
        entry_count: parseInt(card.entries.replace(/\D/g, "")) || 0,
        deadline: parseDeadline(card.deadline),
        source_url: sourceUrl,
        description,
        chain: "multi",
      });
    }
  } catch (err) {
    console.error("[wizzhq] Scrape failed:", err);
  } finally {
    await context.close();
    await closeBrowser(browser, isRemote);
  }

  console.log(`[wizzhq] Scraped ${campaigns.length} campaigns`);
  return campaigns;
}

// ─── Cre8core Scraper ─────────────────────────────────────────────────────────

export async function scrapeCrec8core(): Promise<RawCampaign[]> {
  const { browser, isRemote } = await getBrowser();
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
  });
  await blockAssets(context);

  const page = await context.newPage();
  const campaigns: RawCampaign[] = [];

  try {
    await page.goto("https://cre8core.fun/bounties", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await page.waitForSelector("main, [class*='grid'], [class*='list']", {
      timeout: 15000,
    });

    // Scroll fully to bottom to trigger any infinite scroll / lazy load
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let lastHeight = 0;
        const timer = setInterval(() => {
          window.scrollTo(0, document.body.scrollHeight);
          if (document.body.scrollHeight === lastHeight) {
            clearInterval(timer);
            resolve();
          }
          lastHeight = document.body.scrollHeight;
        }, 800);
      });
    });
    await page.waitForTimeout(1500);

    const cardData = await page.$$eval(
      "a[href*='/bounties/'], a[href*='/campaign/']",
      (links) =>
        links
          .filter((a) => a.closest("article, [class*='card'], [class*='item']"))
          .map((a) => {
            const card = a.closest(
              "article, [class*='card'], [class*='item']"
            ) as Element;
            return {
              href: a.getAttribute("href") ?? "",
              title:
                card
                  .querySelector("h1, h2, h3, [class*='title']")
                  ?.textContent?.trim() ?? "",
              protocol:
                card
                  .querySelector(
                    "[class*='sponsor'], [class*='client'], [class*='brand']"
                  )
                  ?.textContent?.trim() ?? "",
              reward:
                card
                  .querySelector(
                    "[class*='reward'], [class*='prize'], [class*='budget']"
                  )
                  ?.textContent?.trim() ?? "",
              deadline:
                card
                  .querySelector("[class*='deadline'], [class*='due'], time")
                  ?.textContent?.trim() ?? "",
            };
          })
          .filter((c) => c.title && c.href)
    );

    // Deduplicate by href
    const seen = new Set<string>();
    const unique = cardData.filter((c) => {
      if (seen.has(c.href)) return false;
      seen.add(c.href);
      return true;
    });

    // Fetch detail pages in batches of 5
    const BATCH = 5;
    for (let i = 0; i < unique.length; i += BATCH) {
      const batch = unique.slice(i, i + BATCH);

      const results = await Promise.allSettled(
        batch.map(async (card) => {
          const sourceUrl = card.href.startsWith("http")
            ? card.href
            : `https://cre8core.fun${card.href}`;

          let description = "";
          let entries = 0;
          let deadline = parseDeadline(card.deadline);

          try {
            const detailPage = await context.newPage();
            await detailPage.goto(sourceUrl, {
              waitUntil: "domcontentloaded",
              timeout: 20000,
            });

            description = await safeText(
              detailPage,
              "[class*='description'], [class*='brief'], [class*='overview'], main p"
            );
            description = description.slice(0, 1000);

            const entriesText = await safeText(
              detailPage,
              "[class*='submission'], [class*='entries'], [class*='applicant']"
            );
            entries = parseInt(entriesText.replace(/\D/g, "")) || 0;

            const deadlineText = await safeText(
              detailPage,
              "[class*='deadline'], [class*='due-date'], time"
            );
            if (deadlineText) deadline = parseDeadline(deadlineText);

            await detailPage.close();
          } catch {
            // detail failed — use card data
          }

          return {
            title: card.title,
            protocol_name: card.protocol || "Unknown",
            type: "bounty" as const,
            reward_usd: parseReward(card.reward),
            entry_count: entries,
            deadline,
            source_url: sourceUrl,
            description,
            chain: "multi",
          };
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          campaigns.push(result.value);
        }
      }

      if (i + BATCH < unique.length) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  } catch (err) {
    console.error("[cre8core] Scrape failed:", err);
  } finally {
    await context.close();
    await closeBrowser(browser, isRemote);
  }

  console.log(`[cre8core] Scraped ${campaigns.length} campaigns`);
  return campaigns;
}

// ─── Selector debugger ────────────────────────────────────────────────────────
// Run locally when a site updates and selectors break.
// Uses local Chromium in headed mode so you can see the live page.
//
// npx ts-node -e "
//   import('./lib/scrapers').then(m => m.debugSelectors('https://wizzhq.xyz/bounties'))
// "

export async function debugSelectors(url: string): Promise<void> {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log(`[debug] Opening ${url}`);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  const html = await page.content();
  console.log("\n[debug] Rendered HTML (first 3000 chars):");
  console.log(html.slice(0, 3000));

  const candidates = await page.$$eval(
    "a[href], article, [class*='card'], [class*='bounty'], [class*='campaign']",
    (els) =>
      els.slice(0, 8).map((el) => ({
        tag: el.tagName,
        classes: el.className?.slice(0, 80),
        text: el.textContent?.slice(0, 80).trim().replace(/\s+/g, " "),
        href: (el as HTMLAnchorElement).href ?? null,
      }))
  );

  console.log("\n[debug] Candidate elements:");
  console.table(candidates);

  console.log("\n[debug] Browser open for manual inspection. Ctrl+C to exit.");
  await new Promise(() => {});
}
