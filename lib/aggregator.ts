/**
 * Loopi Campaign Aggregator
 * ─────────────────────────
 * Runs every 6 hours via Vercel Cron.
 * Pulls campaigns from various sources, deduplicates, and scores them.
 */

import { createClient } from "@supabase/supabase-js";
import { classifyEffort } from "./classifier";
import { scrapeWizzhq } from "./scrapers";
import { fetchLayer3, fetchDework } from "./sources";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type CampaignType = "bounty" | "infofi" | "onchain";
export type EffortLevel = "low" | "medium" | "high";

export interface RawCampaign {
  title: string;
  protocol_name: string;
  type: CampaignType;
  reward_usd: number;
  entry_count: number;
  deadline: string | null;
  source_url: string;
  description: string;
  chain?: string;
  avg_prize?: number;
  reward_token?: string;
  campaign_status?: string;
  prize_distribution?: unknown;
  winner_count?: number;
  skills_required?: string[];
}

interface SuperteamBounty {
  title: string;
  slug?: string;
  id?: string;
  type?: string;
  sponsor?: { name: string };
  sponsorName?: string;
  rewardAmount?: number;
  usdValue?: number;
  token?: string;
  totalSubmissions?: number;
  totalWinnersSelected?: number;
  submissionCount?: number;
  _count?: { Comments?: number };
  isPublished?: boolean;
  deadline?: string;
  shortDescription?: string;
  description?: string;
  isActive?: boolean;
}

interface GalxeCampaign {
  id: string;
  numberID: number;
  name: string;
  endTime?: number;
  space?: { name?: string; alias?: string };
  participantsCount?: number;
  claimedTimes?: number;
  description?: string;
  chain?: string;
}

// ─── Source: Superteam Earn ───────────────────────────────────────────────────
//
// Superteam's API requires browser-like headers and follows redirects.
// We try three strategies in order:
//   1. REST API with full browser headers + redirect following
//   2. Alternate API path (/api/v2/listings)
//   3. RSS feed fallback — always works, no auth, slightly less data
//
// When you confirm the correct endpoint from browser devtools, set
// SUPERTEAM_API_URL env var to skip the probe and go direct.

const SUPERTEAM_BROWSER_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://earn.superteam.fun",
  Origin: "https://earn.superteam.fun",
  "Accept-Language": "en-US,en;q=0.9",
};

async function fetchSuperteamREST(
  baseUrl: string,
): Promise<SuperteamBounty[] | null> {
  const campaigns: SuperteamBounty[] = [];
  let skip = 0;
  const take = 50;

  while (skip < 150) {
    const url = `${baseUrl}?take=${take}&skip=${skip}&isPublished=true&status=open`;
    const res = await fetch(url, {
      headers: SUPERTEAM_BROWSER_HEADERS,
      redirect: "follow",
    });

    // "Redirecting..." as text means middleware blocked us
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.includes("application/json")) {
      const body = await res.text().catch(() => "");
      if (body.toLowerCase().includes("redirecting") || body.startsWith("<!")) {
        // Not JSON — this endpoint needs auth or different headers
        return null;
      }
      console.error("[superteam] REST error:", res.status, body.slice(0, 100));
      return null;
    }

    const json = await res.json();
    const page = (json.bounties ?? json.listings ?? json.data ?? []) as SuperteamBounty[];
    if (!Array.isArray(page) || page.length === 0) break;

    campaigns.push(...page);
    if (page.length < take) break;
    skip += take;
    await new Promise((r) => setTimeout(r, 400));
  }

  return campaigns.length > 0 ? campaigns : null;
}

async function fetchSuperteamRSS(): Promise<RawCampaign[]> {
  // Superteam publishes an RSS feed of new listings — no auth required.
  // Less data than the API (no reward amounts, no submission counts) but
  // reliable as a fallback. We scrape metadata from the feed entries.
  const RSS_URL = "https://earn.superteam.fun/rss.xml";

  const res = await fetch(RSS_URL, {
    headers: { "User-Agent": "Loopi/1.0" },
    redirect: "follow",
  });

  if (!res.ok) {
    console.error("[superteam] RSS fetch failed:", res.status);
    return [];
  }

  const xml = await res.text();
  const campaigns: RawCampaign[] = [];

  // Parse RSS items with regex — no XML parser dependency needed
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    const title =
      (/<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(item) ??
        /<title>(.*?)<\/title>/.exec(item))?.[1]?.trim() ?? "";
    const link = /<link>(.*?)<\/link>/.exec(item)?.[1]?.trim() ?? "";
    const description =
      (/<description><!\[CDATA\[(.*?)\]\]><\/description>/.exec(item) ??
        /<description>(.*?)<\/description>/.exec(item))?.[1]
        ?.replace(/<[^>]+>/g, "")
        .trim() ?? "";
    const sponsor =
      (/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/.exec(item) ??
        /<dc:creator>(.*?)<\/dc:creator>/.exec(item))?.[1]?.trim() ?? "Unknown";
    const pubDate = /<pubDate>(.*?)<\/pubDate>/.exec(item)?.[1]?.trim() ?? "";

    if (!title || !link) continue;

    // Reward is not in the RSS — leave as 0, admin can update or we scrape
    campaigns.push({
      title,
      protocol_name: sponsor,
      type: "bounty",
      reward_usd: 0,
      reward_token: "USDC",
      entry_count: 0,
      // RSS pubDate as a rough proxy for when it was posted
      deadline: pubDate
        ? new Date(new Date(pubDate).getTime() + 14 * 86400000).toISOString()
        : new Date(Date.now() + 14 * 86400000).toISOString(),
      source_url: link,
      description: description.slice(0, 1000),
      chain: "solana",
      campaign_status: "active",
    } as unknown as RawCampaign);
  }

  console.log(
    `[superteam] RSS fallback — fetched ${campaigns.length} listings`,
  );
  return campaigns;
}

async function fetchSuperteam(): Promise<RawCampaign[]> {
  // Strategy 1: use override env var if set (fastest — skip probing)
  const overrideUrl = process.env.SUPERTEAM_API_URL;
  if (overrideUrl) {
    console.log(`[superteam] Using SUPERTEAM_API_URL override: ${overrideUrl}`);
    const data = await fetchSuperteamREST(overrideUrl);
    if (data) return mapSuperteamListings(data);
  }

  // Strategy 2: probe known REST endpoints in order
  const REST_CANDIDATES = [
    "https://earn.superteam.fun/api/listings",
    "https://earn.superteam.fun/api/v2/listings",
    "https://earn.superteam.fun/api/opportunities",
    "https://earn.superteam.fun/api/bounties",
  ];

  for (const url of REST_CANDIDATES) {
    console.log(`[superteam] Trying REST endpoint: ${url}`);
    const data = await fetchSuperteamREST(url);
    if (data) {
      console.log(
        `[superteam] Success with: ${url} — add SUPERTEAM_API_URL=${url} to env to skip probing`,
      );
      return mapSuperteamListings(data);
    }
  }

  // Strategy 3: RSS fallback — always works
  console.warn("[superteam] All REST endpoints failed — falling back to RSS");
  return fetchSuperteamRSS();
}

function mapSuperteamListings(bounties: SuperteamBounty[]): RawCampaign[] {
  return bounties
    .filter((b) => b.title && b.isPublished !== false)
    .map((b) => {
      const slug = b.slug ?? b.id ?? "";
      const listingType = b.type?.toLowerCase() ?? "bounty";
      const urlPath =
        listingType === "hackathon"
          ? `hackathon/${slug}`
          : `listings/${listingType === "project" ? "projects" : "bounties"}/${slug}`;

      return {
        title: b.title,
        protocol_name: b.sponsor?.name ?? b.sponsorName ?? "Unknown",
        type: "bounty" as CampaignType,
        reward_usd: safeNumber(b.rewardAmount ?? b.usdValue ?? 0),
        reward_token: b.token ?? "USDC",
        entry_count: safeEntryCount(
          b.totalWinnersSelected ??
            b._count?.Comments ??
            b.submissionCount ??
            0,
        ),
        deadline:
          b.deadline ?? new Date(Date.now() + 7 * 86400000).toISOString(),
        source_url: `https://earn.superteam.fun/${urlPath}`,
        description: b.description ?? b.shortDescription ?? "",
        chain: "solana",
        campaign_status: b.isActive === false ? "ended" : "active",
      } as unknown as RawCampaign;
    });
}

// ─── Source: Galxe ────────────────────────────────────────────────────────────

async function fetchGalxe(): Promise<RawCampaign[]> {
  // Galxe rebranded and updated their API. Current endpoint as of April 2026:
  // https://graphigo.prd.galaxy.eco/query (same host, updated query schema)
  // If this 404s again, try: https://api.galxe.com/query
  // The campaigns() query now uses a different input shape.
  const query = `
    query CampaignList {
      campaigns(
        input: {
          listType: Trending
          forAdmin: false
          first: 40
          after: ""
        }
      ) {
        list {
          id
          name
          space { name alias }
          rewardType
          numberID
          startTime
          endTime
          description
          chain
          claimedTimes
          credentialGroups(address: "") {
            credentials {
              name
            }
          }
        }
        pageInfo { endCursor hasNextPage }
      }
    }
  `;

  // Try the primary endpoint first, fall back to alternate
  const ENDPOINTS = [
    "https://graphigo.prd.galaxy.eco/query",
    "https://api.galxe.com/query",
  ];

  let json: { data?: { campaigns?: { list?: unknown[] } }; errors?: { message: string }[] } | null = null;

  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        console.warn(
          `[galxe] ${endpoint} returned ${res.status} — trying next`,
        );
        continue;
      }

      json = await res.json();

      if (json && json.errors?.length) {
        console.warn(
          `[galxe] ${endpoint} GraphQL error:`,
          json.errors[0]?.message,
        );
        json = null;
        continue;
      }

      // Successfully got data
      console.log(`[galxe] Using endpoint: ${endpoint}`);
      break;
    } catch (err) {
      console.warn(`[galxe] ${endpoint} threw:`, err);
    }
  }

  if (!json) {
    console.error("[galxe] All endpoints failed");
    return [];
  }

  const now = Math.floor(Date.now() / 1000);
  const list = (json.data?.campaigns?.list ?? []) as GalxeCampaign[];
  if (!Array.isArray(list)) return [];

  return list
    .filter((c) => !c.endTime || c.endTime > now)
    .map(
      (c) =>
        ({
          title: c.name,
          protocol_name: c.space?.name ?? c.space?.alias ?? "Unknown",
          type: "infofi" as CampaignType,
          reward_usd: 0,
          reward_token: "POINTS",
          entry_count: safeEntryCount(c.claimedTimes ?? 0),
          deadline: c.endTime
            ? new Date(c.endTime * 1000).toISOString()
            : new Date(Date.now() + 14 * 86400000).toISOString(),
          source_url: c.space?.alias
            ? `https://app.galxe.com/${c.space.alias}/campaign/${c.numberID}`
            : `https://app.galxe.com/quest/${c.id}`,
          description: c.description ?? "",
          chain: c.chain ?? "multi",
          campaign_status: "active",
        }) as RawCampaign,
    );
}

// ─── Source: WizzHQ (scraper) ─────────────────────────────────────────────────
// WizzHQ has no public API — scrape the listings page.
// In production: use a Browserless.io endpoint or Playwright in a separate worker.
// This implementation calls a lightweight proxy endpoint you host.

async function fetchWizzhq(): Promise<RawCampaign[]> {
  return scrapeWizzhq();
}

async function fetchLayer3Campaigns(): Promise<RawCampaign[]> {
  return fetchLayer3();
}

async function fetchDeworkCampaigns(): Promise<RawCampaign[]> {
  return fetchDework();
}

// ─── Input sanitisation ──────────────────────────────────────────────────────
// Guard against scrapers returning garbage values that break DB column types.

/** Cap reward at $10M — anything above is a parsing error */
function safeNumber(val: number | string | null | undefined): number {
  const n =
    typeof val === "string" ? parseFloat(val.replace(/[$,]/g, "")) : (val ?? 0);
  if (isNaN(n) || n < 0) return 0;
  return Math.min(n, 10_000_000);
}

/** Cap entry count at 10M — WizzHQ regex was matching reward amounts instead */
function safeEntryCount(val: number | string | null | undefined): number {
  const n =
    typeof val === "string" ? parseInt(val.replace(/\D/g, ""), 10) : (val ?? 0);
  if (isNaN(n) || n < 0) return 0;
  return Math.min(n, 10_000_000); // safely within PostgreSQL INTEGER range (max 2.1B)
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────

/**
 * Reward score (30% of total)
 * Normalised later against all campaigns in the DB.
 * Returns raw EV here — normalisation runs in computeRewardScore().
 */
function computeRawEV(reward_usd: number, entry_count: number): number {
  const estimated_winners = Math.max(1, Math.ceil(entry_count * 0.1)); // assume top 10% win
  return reward_usd / estimated_winners;
}

/**
 * Timing score (25% of total)
 * entry_density = entries ÷ days_remaining
 * Low density (early) = 100. >200 entries = 20 max. <24h deadline = -20 penalty.
 */
function computeTimingScore(entry_count: number, deadline: string | null): number {
  const finalDeadline = deadline ?? new Date(Date.now() + 14 * 86400000).toISOString();
  const msRemaining = new Date(finalDeadline).getTime() - Date.now();
  const daysRemaining = Math.max(0.1, msRemaining / (1000 * 60 * 60 * 24));
  const density = entry_count / daysRemaining;

  let score = 100;
  if (density > 50) score = 60;
  if (density > 100) score = 40;
  if (entry_count > 200) score = Math.min(score, 20);
  if (daysRemaining < 1) score = Math.max(0, score - 20);

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Reward score (30% of total)
 * Normalise this campaign's EV against all existing campaign EVs in the DB.
 * Top 10% → 100, bottom 10% → 0. Linear interpolation between.
 */
async function computeRewardScore(rawEV: number): Promise<number> {
  const { data: existing } = await supabase
    .from("campaigns")
    .select("raw_ev")
    .not("raw_ev", "is", null)
    .order("raw_ev", { ascending: true });

  const evs: number[] = (existing ?? [])
    .map((r: { raw_ev: number }) => r.raw_ev)
    .concat(rawEV);
  if (evs.length < 2) return 50; // not enough data yet — default mid

  const sorted = [...evs].sort((a, b) => a - b);
  const rank = sorted.indexOf(rawEV);
  const score = (rank / (sorted.length - 1)) * 100;
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Founder trust score
 * Looks up the protocol record in the DB.
 * If known → returns stored trust_score.
 * If unknown → returns null (campaign held for manual review).
 */
async function lookupFounderScore(
  protocol_name: string,
): Promise<{ trust_score: number | null; protocol_id: string | null }> {
  const { data } = await supabase
    .from("protocols")
    .select("id, trust_score")
    .ilike("name", protocol_name)
    .single();

  if (!data) return { trust_score: null, protocol_id: null };
  return { trust_score: data.trust_score, protocol_id: data.id };
}

// ─── Final score formula ──────────────────────────────────────────────────────

function computeFinalScore({
  reward_score,
  effort_score,
  timing_score,
  founder_score,
}: {
  reward_score: number;
  effort_score: number;
  timing_score: number;
  founder_score: number;
}): number {
  let raw = Math.round(
    reward_score * 0.3 +
      effort_score * 0.25 +
      timing_score * 0.25 +
      founder_score * 0.2,
  );
  raw = Math.max(0, Math.min(100, raw));
  // Hard cap: previous rug or FDV gap danger
  if (founder_score < 20) raw = Math.min(raw, 40);
  return raw;
}

// ─── Main aggregator ──────────────────────────────────────────────────────────

export async function runAggregator(): Promise<{
  inserted: number;
  skipped: number;
  held: number;
}> {
  console.log("[aggregator] Starting run at", new Date().toISOString());

  // 1. Fetch from all sources in parallel
  const [superteam, galxe, wizzhq, layer3, dework] = await Promise.all([
    fetchSuperteam(),
    fetchGalxe(),
    fetchWizzhq(),
    fetchLayer3Campaigns(),
    fetchDeworkCampaigns(),
  ]);
  const all = [...superteam, ...galxe, ...wizzhq, ...layer3, ...dework];
  console.log(`[aggregator] Fetched ${all.length} raw campaigns`);

  // 2. Deduplicate against existing source_urls
  const { data: existing } = await supabase
    .from("campaigns")
    .select("source_url");
  const existingUrls = new Set(
    (existing ?? []).map((r: { source_url: string }) => r.source_url),
  );

  const newCampaigns = all.filter((c) => !existingUrls.has(c.source_url));
  console.log(`[aggregator] ${newCampaigns.length} new campaigns after dedup`);

  let inserted = 0;
  let held = 0;

  for (const campaign of newCampaigns) {
    // Use avg_prize from scraper when available (prize distribution known),
    // otherwise fall back to the standard EV estimate
    const c = campaign;
    const rawEV =
      c.avg_prize != null
        ? c.avg_prize
        : computeRawEV(campaign.reward_usd, campaign.entry_count);

    const [reward_score, timing_score, effort_result, founder_result] =
      await Promise.all([
        computeRewardScore(rawEV),
        Promise.resolve(
          computeTimingScore(campaign.entry_count, campaign.deadline),
        ),
        classifyEffort(campaign.title, campaign.description),
        lookupFounderScore(campaign.protocol_name),
      ]);

    const {
      effort_score,
      effort_label,
      reasoning: effort_reasoning,
    } = effort_result;
    const { trust_score, protocol_id } = founder_result;

    // Unknown protocol → hold for manual trust research
    const status = trust_score === null ? "held" : "published";
    if (status === "held") held++;

    const founder_score = trust_score ?? 50; // optimistic default until reviewed

    const score =
      status === "published"
        ? computeFinalScore({
            reward_score,
            effort_score,
            timing_score,
            founder_score,
          })
        : 0; // score stays 0 until founder trust is verified

    const { error } = await supabase.from("campaigns").insert({
      title: campaign.title,
      protocol_id,
      protocol_name_raw: campaign.protocol_name,
      type: campaign.type,
      reward_usd: campaign.reward_usd,
      reward_token: c.reward_token ?? "USDC",
      entry_count: campaign.entry_count,
      deadline: campaign.deadline,
      source_url: campaign.source_url,
      description: campaign.description,
      chain: campaign.chain ?? "unknown",
      raw_ev: rawEV,
      // Dimension scores
      reward_score,
      effort_score,
      timing_score,
      founder_score: trust_score,
      effort_label,
      effort_reasoning: effort_reasoning ?? null,
      // Final
      score,
      status,
      // New fields from scraper
      campaign_status: c.campaign_status ?? "active",
      prize_distribution: c.prize_distribution ?? null,
      winner_count: c.winner_count ?? null,
      skills_required: c.skills_required ?? [],
      // Flags for admin UI
      needs_founder_review: trust_score === null,
      score_overridden: false,
    });

    if (error) {
      console.error(
        "[aggregator] Insert error:",
        campaign.title,
        error.message,
      );
    } else {
      inserted++;
    }
  }

  console.log(`[aggregator] Done. inserted=${inserted} held=${held}`);
  return { inserted, skipped: all.length - newCampaigns.length, held };
}
