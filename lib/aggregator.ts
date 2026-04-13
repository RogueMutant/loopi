// Loopi Campaign Aggregator
// ─────────────────────────
// Runs every 6 hours via Vercel Cron (configure in vercel.json).
// Pulls campaigns from Superteam Earn, Galxe, WizzHQ, Questn, and Dework.
// Deduplicates by source_url, inserts new campaigns with
// auto-computed reward + timing scores, then triggers
// effort classification for each new campaign.
//
// Usage in Next.js:
//   app/api/cron/aggregate/route.ts  ->  import { runAggregator } from "@/lib/aggregator"
//
// vercel.json:
//   { "crons": [{ "path": "/api/cron/aggregate", "schedule": "0 */6 * * *" }] }
//   NOTE: the */6 above is a cron interval — not a JS comment terminator.

import { createClient } from "@supabase/supabase-js";
import { classifyEffort } from "./classifier";
import { scrapeWizzhq } from "./scrapers";
import { fetchQuestn, fetchDework } from "./sources";

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
  /** Token symbol, e.g. "USDC", "SOL", "POINTS" */
  reward_token?: string;
  entry_count: number;
  deadline: string; // ISO date string
  source_url: string;
  description: string;
  chain?: string;
  /** Current lifecycle state of the campaign on the source platform */
  campaign_status?: "active" | "in_review" | "ended";
  /** Tags / skill labels associated with the campaign */
  skills_required?: string[];
  /** Prize breakdown, e.g. [{ place: 1, amount: 500 }] */
  prize_distribution?: Record<string, unknown>[] | null;
  /** How many winners the campaign awards */
  winner_count?: number | null;
  /**
   * Average prize per winner — set by scrapers that know the full
   * prize distribution (e.g. WizzHQ). When present the aggregator
   * uses this directly as rawEV instead of estimating from reward_usd.
   */
  avg_prize?: number | null;
}

// ─── Source: Superteam Earn ───────────────────────────────────────────────────
//
// Confirmed working endpoint (verified April 2026 via browser DevTools):
//   https://superteam.fun/api/listings
//
// Query params: context, tab, category, status, sortBy, order, region, sponsor
// Response: a flat JSON array of listing objects (NOT wrapped in {bounties:[]}).
// Pagination: the API supports `skip` + `take` appended to the above params.
//
// Important field mappings from the real response:
//   _count.Submission  → entry_count  (actual submission count)
//   _count.Comments    → comment count (ignored for scoring)
//   sponsor.name       → protocol_name
//   slug               → used to build source_url
//   status ("OPEN")    → campaign_status (uppercased on the API side)
//
// If you need to change the region/category filter, set SUPERTEAM_API_URL env
// var to the full base URL and adjust SUPERTEAM_API_PARAMS below.

const SUPERTEAM_BASE_URL = "https://superteam.fun/api/listings";

/** Default query string params that match what the Superteam Earn page sends */
const SUPERTEAM_DEFAULT_PARAMS = new URLSearchParams({
  context: "home",
  tab: "bounties",
  category: "All",
  status: "open",
  sortBy: "Date",
  order: "asc",
  region: "",
  sponsor: "",
});

const SUPERTEAM_BROWSER_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://superteam.fun/earn/",
  Origin: "https://superteam.fun",
  "Accept-Language": "en-US,en;q=0.9",
};

/**
 * Fetches a single page from the Superteam listings REST API.
 * Returns the flat array of raw listing objects, or null if the endpoint
 * is unreachable / returns non-JSON.
 */
async function fetchSuperteamREST(
  baseUrl: string,
  extraParams?: URLSearchParams,
): Promise<unknown[] | null> {
  const campaigns: unknown[] = [];
  let skip = 0;
  const take = 50;

  while (skip < 300) {
    const params = new URLSearchParams(extraParams ?? SUPERTEAM_DEFAULT_PARAMS);
    params.set("skip", String(skip));
    params.set("take", String(take));

    const url = `${baseUrl}?${params.toString()}`;
    let res: Response;
    try {
      res = await fetch(url, {
        headers: SUPERTEAM_BROWSER_HEADERS,
        redirect: "follow",
      });
    } catch (err) {
      console.error("[superteam] Network error:", err);
      return null;
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.includes("application/json")) {
      const body = await res.text().catch(() => "");
      if (body.toLowerCase().includes("redirecting") || body.startsWith("<")) {
        return null; // Middleware / HTML — not JSON
      }
      console.error("[superteam] REST error:", res.status, body.slice(0, 200));
      return null;
    }

    const json: unknown = await res.json();

    // Real API returns a flat array; some older paths wrap in an object
    const page: unknown[] = Array.isArray(json)
      ? json
      : ((json as Record<string, unknown[]>).bounties ??
        (json as Record<string, unknown[]>).listings ??
        (json as Record<string, unknown[]>).data ??
        []);

    if (!Array.isArray(page) || page.length === 0) break;

    campaigns.push(...page);
    if (page.length < take) break; // last page
    skip += take;
    await new Promise((r) => setTimeout(r, 400));
  }

  return campaigns.length > 0 ? campaigns : null;
}

async function fetchSuperteamRSS(): Promise<RawCampaign[]> {
  // Superteam publishes an RSS feed of new listings — no auth required.
  // Less data than the API (no reward amounts, no submission counts) but
  // reliable as a fallback. We scrape metadata from the feed entries.
  const RSS_URL = "https://superteam.fun/rss.xml";

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
    } satisfies RawCampaign);
  }

  console.log(
    `[superteam] RSS fallback — fetched ${campaigns.length} listings`,
  );
  return campaigns;
}

async function fetchSuperteam(): Promise<RawCampaign[]> {
  // Strategy 1: env var override — fastest, skips all probing.
  // Set SUPERTEAM_API_URL in GitHub Actions / Vercel env if the endpoint changes.
  const overrideUrl = process.env.SUPERTEAM_API_URL ?? SUPERTEAM_BASE_URL;

  console.log(`[superteam] Trying REST endpoint: ${overrideUrl}`);
  const data = await fetchSuperteamREST(overrideUrl);
  if (data && data.length > 0) {
    console.log(
      `[superteam] REST success — ${data.length} raw listings from ${overrideUrl}`,
    );
    return mapSuperteamListings(data);
  }

  // Strategy 2: RSS fallback (no reward amounts, but always reachable)
  console.warn(
    "[superteam] REST endpoint returned no data — falling back to RSS feed",
  );
  return fetchSuperteamRSS();
}

// fetchSuperteamScraped() removed — superteam.fun does not SSR __NEXT_DATA__
// into the listings page in the same way. The REST API (fetchSuperteamREST) is
// the reliable path; RSS (fetchSuperteamRSS) is the fallback.

/**
 * Maps raw Superteam API listing objects → RawCampaign.
 *
 * Field mapping (from real API response, April 2026):
 *   b.rewardAmount          → reward_usd
 *   b.token                 → reward_token
 *   b._count.Submission     → entry_count  (actual submissions, not comments)
 *   b._count.Comments       → ignored (comment count, not relevant for scoring)
 *   b.sponsor.name          → protocol_name
 *   b.slug                  → used to build source_url
 *   b.status ("OPEN")       → campaign_status mapped to lowercase "active"
 */
function mapSuperteamListings(bounties: unknown[]): RawCampaign[] {
  return (bounties as Record<string, unknown>[])
    .filter(
      (b) => !!b.title && b.status !== "CLOSED" && b.status !== "CANCELLED",
    )
    .map((b) => {
      const slug = (b.slug ?? b.id ?? "") as string;
      const listingType = ((b.type as string) ?? "bounty").toLowerCase();
      const urlPath =
        listingType === "hackathon" ? `hackathon/${slug}` : `earn/${slug}`; // real Superteam URL pattern: superteam.fun/earn/<slug>

      const _count = (b._count ?? {}) as Record<string, number>;

      // campaign_status: API returns uppercase "OPEN", "CLOSED", "IN_REVIEW"
      const rawStatus = ((b.status as string) ?? "").toUpperCase();
      const campaignStatus: RawCampaign["campaign_status"] =
        rawStatus === "IN_REVIEW"
          ? "in_review"
          : rawStatus === "CLOSED" || rawStatus === "DONE"
            ? "ended"
            : "active";

      return {
        title: b.title as string,
        protocol_name:
          (b.sponsor as Record<string, string>)?.name ??
          (b as Record<string, string>).sponsorName ??
          "Unknown",
        type: "bounty" as CampaignType,
        reward_usd: safeNumber((b.rewardAmount ?? 0) as number),
        reward_token: (b.token as string | undefined) ?? "USDC",
        // Use Submission count — this is the real participant/submission count.
        // Comments is a moderation/discussion count and inflates EV estimates.
        entry_count: safeEntryCount(
          _count.Submission ??
            (b as Record<string, number>).submissionCount ??
            0,
        ),
        deadline:
          (b.deadline as string | undefined) ??
          new Date(Date.now() + 7 * 86400000).toISOString(),
        source_url: `https://superteam.fun/${urlPath}`,
        description: (
          (b.description ?? b.shortDescription ?? "") as string
        ).slice(0, 2000),
        chain: "solana",
        campaign_status: campaignStatus,
        skills_required: [],
      } satisfies RawCampaign;
    });
}

// ─── Types for Galxe GraphQL response ────────────────────────────────────────

interface GalxeSpace {
  name?: string;
  alias?: string;
}
interface GalxeListItem {
  id: string;
  name?: string;
  numberID?: string | number;
  startTime?: number;
  endTime?: number;
  description?: string;
  chain?: string;
  participantCount?: number;
  space?: GalxeSpace;
}
interface GalxeResponse {
  data?: { campaigns?: { list?: GalxeListItem[] } };
  errors?: { message?: string }[];
}

async function fetchGalxe(): Promise<RawCampaign[]> {
  // Galxe rebranded and updated their API. Current endpoint as of April 2026:
  // https://graphigo.prd.galaxy.eco/query (same host, updated query schema)
  // If this 404s again, try: https://api.galxe.com/query
  // The campaigns() query now uses a different input shape.
  // claimedTimes requires an address argument — removed to avoid schema error.
  // participantCount is a plain integer field available without args.
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
          participantCount
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

  let json: GalxeResponse | null = null;

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

      if (json !== null) {
        if (json.errors?.length) {
          console.warn(
            `[galxe] ${endpoint} GraphQL error:`,
            json.errors[0]?.message,
          );
          json = null;
          continue;
        }
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
  const list: GalxeListItem[] = json.data?.campaigns?.list ?? [];

  return list
    .filter((c) => !c.endTime || c.endTime > now)
    .map(
      (c) =>
        ({
          title: c.name ?? "",
          protocol_name: c.space?.name ?? c.space?.alias ?? "Unknown",
          type: "infofi" as CampaignType,
          reward_usd: 0,
          reward_token: "POINTS",
          entry_count: safeEntryCount(c.participantCount ?? 0),
          deadline: c.endTime
            ? new Date(c.endTime * 1000).toISOString()
            : new Date(Date.now() + 14 * 86400000).toISOString(),
          source_url: c.space?.alias
            ? `https://app.galxe.com/${c.space.alias}/campaign/${c.numberID}`
            : `https://app.galxe.com/quest/${c.id}`,
          description: c.description ?? "",
          chain: c.chain ?? "multi",
          campaign_status: "active",
        }) satisfies RawCampaign,
    );
}

// ─── Source: WizzHQ (scraper) ─────────────────────────────────────────────────
// WizzHQ has no public API — scrape the listings page.
// In production: use a Browserless.io endpoint or Playwright in a separate worker.
// This implementation calls a lightweight proxy endpoint you host.

async function fetchWizzhq(): Promise<RawCampaign[]> {
  return scrapeWizzhq();
}

async function fetchQuestnCampaigns(): Promise<RawCampaign[]> {
  return fetchQuestn();
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
function computeTimingScore(entry_count: number, deadline: string): number {
  const msRemaining = new Date(deadline).getTime() - Date.now();
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
  const [superteam, galxe, wizzhq, questn, dework] = await Promise.all([
    fetchSuperteam(),
    fetchGalxe(),
    fetchWizzhq(),
    fetchQuestnCampaigns(),
    fetchDeworkCampaigns(),
  ]);
  const all = [...superteam, ...galxe, ...wizzhq, ...questn, ...dework];
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
    const rawEV =
      campaign.avg_prize != null
        ? campaign.avg_prize
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
      reward_token: campaign.reward_token ?? "USDC",
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
      // Extended fields — fully typed on RawCampaign now
      campaign_status: campaign.campaign_status ?? "active",
      prize_distribution: campaign.prize_distribution ?? null,
      winner_count: campaign.winner_count ?? null,
      skills_required: campaign.skills_required ?? [],
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
