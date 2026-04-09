/**
 * Loopi Campaign Aggregator
 * ─────────────────────────
 * Runs every 6 hours via Vercel Cron (configure in vercel.json).
 * Pulls campaigns from Superteam Earn, Galxe, and WizzHQ,
 * deduplicates by source_url, inserts new campaigns with
 * auto-computed reward + timing scores, then triggers
 * effort classification for each new campaign.
 *
 * Usage in Next.js:
 *   app/api/cron/aggregate/route.ts  →  import { runAggregator } from "@/lib/aggregator"
 *
 * vercel.json:
 *   { "crons": [{ "path": "/api/cron/aggregate", "schedule": "0 /6 * * *" }] }
 */

import { createClient } from "@supabase/supabase-js";
import { classifyEffort } from "./classifier";
import { scrapeWizzhq, scrapeCrec8core } from "./scrapers";

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
  deadline: string; // ISO date string
  source_url: string;
  description: string;
  chain?: string;
}

// ─── Source: Superteam Earn ───────────────────────────────────────────────────

async function fetchSuperteam(): Promise<RawCampaign[]> {
  const query = `
    query GetListings {
      bounties(
        where: { isPublished: { equals: true }, isActive: { equals: true } }
        orderBy: { createdAt: desc }
        take: 50
      ) {
        title
        sponsor { name }
        type
        rewardAmount
        _count { Comments }
        deadline
        slug
        description
        token
      }
    }
  `;

  const res = await fetch("https://earn.superteam.fun/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    console.error("[aggregator] Superteam fetch failed:", res.status);
    return [];
  }

  const { data } = await res.json();
  const bounties = data?.bounties ?? [];

  return bounties.map((b: any) => ({
    title: b.title,
    protocol_name: b.sponsor?.name ?? "Unknown",
    type: "bounty" as CampaignType,
    reward_usd: b.rewardAmount ?? 0,
    entry_count: b._count?.Comments ?? 0,
    deadline: b.deadline ?? new Date(Date.now() + 7 * 86400000).toISOString(),
    source_url: `https://earn.superteam.fun/listings/bounties/${b.slug}`,
    description: b.description ?? "",
    chain: "solana",
  }));
}

// ─── Source: Galxe ────────────────────────────────────────────────────────────

async function fetchGalxe(): Promise<RawCampaign[]> {
  const query = `
    query CampaignList {
      campaigns(
        input: {
          listType: Trending
          gasType: Gas
          forAdmin: false
          first: 40
        }
      ) {
        list {
          name
          space { name }
          rewardType
          tokenReward { tokenDecimalNum }
          numberID
          startTime
          endTime
          description
          chain
          participants { totalCount }
        }
      }
    }
  `;

  const res = await fetch("https://graphigo.prd.galaxy.eco/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    console.error("[aggregator] Galxe fetch failed:", res.status);
    return [];
  }

  const { data } = await res.json();
  const campaigns = data?.campaigns?.list ?? [];

  return campaigns
    .filter((c: any) => c.endTime > Math.floor(Date.now() / 1000))
    .map((c: any) => ({
      title: c.name,
      protocol_name: c.space?.name ?? "Unknown",
      type: "infofi" as CampaignType,
      reward_usd: 0, // Galxe rewards are points/NFTs — treat as 0 for EV, bump manually if USDC
      entry_count: c.participants?.totalCount ?? 0,
      deadline: new Date(c.endTime * 1000).toISOString(),
      source_url: `https://galxe.com/campaign/${c.numberID}`,
      description: c.description ?? "",
      chain: c.chain ?? "multi",
    }));
}

// ─── Source: WizzHQ (scraper) ─────────────────────────────────────────────────
// WizzHQ has no public API — scrape the listings page.
// In production: use a Browserless.io endpoint or Playwright in a separate worker.
// This implementation calls a lightweight proxy endpoint you host.

async function fetchWizzhq(): Promise<RawCampaign[]> {
  return scrapeWizzhq();
}

async function fetchCrec8core(): Promise<RawCampaign[]> {
  return scrapeCrec8core();
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
    .map((r: any) => r.raw_ev)
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
  const [superteam, galxe, wizzhq, cre8core] = await Promise.all([
    fetchSuperteam(),
    fetchGalxe(),
    fetchWizzhq(),
    fetchCrec8core(),
  ]);
  const all = [...superteam, ...galxe, ...wizzhq, ...cre8core];
  console.log(`[aggregator] Fetched ${all.length} raw campaigns`);

  // 2. Deduplicate against existing source_urls
  const { data: existing } = await supabase
    .from("campaigns")
    .select("source_url");
  const existingUrls = new Set((existing ?? []).map((r: any) => r.source_url));

  const newCampaigns = all.filter((c) => !existingUrls.has(c.source_url));
  console.log(`[aggregator] ${newCampaigns.length} new campaigns after dedup`);

  let inserted = 0;
  let held = 0;

  for (const campaign of newCampaigns) {
    const rawEV = computeRawEV(campaign.reward_usd, campaign.entry_count);
    const [reward_score, timing_score, effort_result, founder_result] =
      await Promise.all([
        computeRewardScore(rawEV),
        Promise.resolve(
          computeTimingScore(campaign.entry_count, campaign.deadline),
        ),
        classifyEffort(campaign.title, campaign.description),
        lookupFounderScore(campaign.protocol_name),
      ]);

    const { effort_score, effort_label } = effort_result;
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
        : 0; // don't show a score until founder is verified

    const { error } = await supabase.from("campaigns").insert({
      title: campaign.title,
      protocol_id,
      protocol_name_raw: campaign.protocol_name,
      type: campaign.type,
      reward_usd: campaign.reward_usd,
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
      // Final
      score,
      status, // "published" | "held"
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
