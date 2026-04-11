/**
 * Loopi — Layer3 + Dework Fetchers
 * ──────────────────────────────────
 * Both platforms have public GraphQL APIs — no scraping required.
 * These replace Cre8core in the aggregator.
 *
 * Layer3:  https://layer3.xyz  — high-volume quest/task campaigns across
 *          Arbitrum, Base, Optimism, zkSync, and more. Strongest Cre8core
 *          replacement by volume and campaign quality.
 *
 * Dework:  https://app.dework.xyz — crypto-native bounty board. Higher
 *          value technical bounties (dev, design, research). Lower volume
 *          than Layer3 but better EV on average.
 *
 * Usage:
 *   import { fetchLayer3, fetchDework } from "@/lib/sources"
 *   — called from lib/aggregator.ts inside runAggregator()
 */

import type { RawCampaign } from "./aggregator";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function parseRewardAmount(raw: string | number | null | undefined): number {
  if (raw == null) return 0;
  if (typeof raw === "number") return raw;
  const cleaned = String(raw)
    .replace(/[$,\s]/g, "")
    .replace(/usdc|usdt|sol|eth|op|arb/gi, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function safeISODate(raw: string | number | null | undefined): string {
  if (!raw) return new Date(Date.now() + 7 * 86400000).toISOString();
  const parsed = typeof raw === "number" ? new Date(raw * 1000) : new Date(raw);
  return isNaN(parsed.getTime())
    ? new Date(Date.now() + 7 * 86400000).toISOString()
    : parsed.toISOString();
}

// ─── Layer3 ───────────────────────────────────────────────────────────────────
//
// Layer3 exposes a public GraphQL API at https://api.layer3.xyz/graphql
// (confirmed via network inspection of layer3.xyz — no auth required for
// public quest listings).
//
// Key fields available:
//   - id, title, description, rewardAmount, rewardToken, totalParticipants
//   - endsAt, status ("ACTIVE" | "ENDED" | "DRAFT")
//   - project { name, slug }
//   - tags, chains, requiredSkills
//
// Note: Layer3 calls their campaigns "quests". We map them to type "infofi"
// since they are task-based social/on-chain contribution programs, not
// traditional bounty contests.

const LAYER3_API = "https://api.layer3.xyz/graphql";

const LAYER3_QUERY = `
  query ActiveQuests($first: Int!, $skip: Int!) {
    quests(
      filter: { status: ACTIVE }
      orderBy: { createdAt: DESC }
      first: $first
      skip: $skip
    ) {
      nodes {
        id
        title
        description
        rewardAmount
        rewardToken
        totalParticipants
        endsAt
        status
        chains
        tags
        project {
          name
          slug
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

interface Layer3Quest {
  id: string;
  title: string;
  description: string | null;
  rewardAmount: number | null;
  rewardToken: string | null;
  totalParticipants: number | null;
  endsAt: string | null;
  status: "ACTIVE" | "ENDED" | "DRAFT";
  chains: string[] | null;
  tags: string[] | null;
  project: {
    name: string;
    slug: string;
  } | null;
}

export async function fetchLayer3(): Promise<RawCampaign[]> {
  const campaigns: RawCampaign[] = [];
  let skip = 0;
  const PAGE = 50;
  let hasNextPage = true;

  while (hasNextPage && skip < 200) {
    // cap at 4 pages (200 quests) per run — more than enough
    try {
      const res = await fetch(LAYER3_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: LAYER3_QUERY,
          variables: { first: PAGE, skip },
        }),
      });

      if (!res.ok) {
        console.error("[layer3] API error:", res.status);
        break;
      }

      const { data, errors } = await res.json();

      if (errors?.length) {
        console.error("[layer3] GraphQL errors:", errors[0]?.message);
        break;
      }

      const nodes: Layer3Quest[] = data?.quests?.nodes ?? [];
      hasNextPage = data?.quests?.pageInfo?.hasNextPage ?? false;

      for (const quest of nodes) {
        if (!quest.title) continue;

        // Skip ended quests — only pull active ones into the feed
        if (quest.status === "ENDED") continue;

        campaigns.push({
          title: quest.title,
          protocol_name: quest.project?.name ?? "Unknown",
          type: "infofi",
          reward_usd: parseRewardAmount(quest.rewardAmount),
          entry_count: quest.totalParticipants ?? 0,
          deadline: safeISODate(quest.endsAt),
          source_url: `https://layer3.xyz/quests/${quest.project?.slug ?? quest.id}`,
          description: quest.description ?? "",
          chain:
            Array.isArray(quest.chains) && quest.chains.length > 0
              ? quest.chains[0].toLowerCase()
              : "multi",
          // Extended fields — passed through to aggregator insert via `as any`
          reward_token: quest.rewardToken ?? "USDC",
          campaign_status: "active",
          skills_required: quest.tags ?? [],
        });
      }

      skip += PAGE;

      // Polite pause between pages
      if (hasNextPage) await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error("[layer3] Fetch error:", err);
      break;
    }
  }

  console.log(`[layer3] Fetched ${campaigns.length} quests`);
  return campaigns;
}

// ─── Dework ───────────────────────────────────────────────────────────────────
//
// Dework exposes a public GraphQL API at https://api.dework.xyz/graphql
// (publicly documented at docs.dework.xyz).
//
// Key fields available:
//   - id, name, description, reward { amount, token { symbol } }
//   - dueDate, status ("OPEN" | "IN_REVIEW" | "DONE" | "CLOSED")
//   - applicationCount (proxy for entry_count)
//   - workspace { name, slug }
//   - skills { name }
//
// Dework campaigns are called "tasks". We map them to type "bounty" since
// they are discrete paid deliverables (dev work, design, research reports)
// rather than social contribution programs.
//
// Filtering: status = OPEN only, skip tasks with no reward set.

const DEWORK_API = "https://api.dework.xyz/graphql";

const DEWORK_QUERY = `
  query OpenTasks($limit: Int!, $offset: Int!) {
    tasks(
      filter: {
        statuses: [OPEN]
        assigneeIds: []
      }
      pagination: { limit: $limit, offset: $offset }
      sorting: { field: createdAt, direction: DESC }
    ) {
      id
      name
      description
      dueDate
      status
      applicationCount
      reward {
        amount
        token {
          symbol
          network
        }
      }
      workspace {
        name
        slug
      }
      skills {
        name
      }
    }
  }
`;

interface DeworkTask {
  id: string;
  name: string;
  description: string | null;
  dueDate: string | null;
  status: "OPEN" | "IN_REVIEW" | "DONE" | "CLOSED";
  applicationCount: number | null;
  reward: {
    amount: number | string | null;
    token: {
      symbol: string;
      network: string;
    } | null;
  } | null;
  workspace: {
    name: string;
    slug: string;
  } | null;
  skills: Array<{ name: string }> | null;
}

export async function fetchDework(): Promise<RawCampaign[]> {
  const campaigns: RawCampaign[] = [];
  let offset = 0;
  const LIMIT = 50;
  let keepFetching = true;

  while (keepFetching && offset < 150) {
    // cap at 3 pages (150 tasks) per run
    try {
      const res = await fetch(DEWORK_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: DEWORK_QUERY,
          variables: { limit: LIMIT, offset },
        }),
      });

      if (!res.ok) {
        console.error("[dework] API error:", res.status);
        break;
      }

      const { data, errors } = await res.json();

      if (errors?.length) {
        console.error("[dework] GraphQL errors:", errors[0]?.message);
        break;
      }

      const tasks: DeworkTask[] = data?.tasks ?? [];

      // Stop paginating when we get fewer results than the page size
      if (tasks.length < LIMIT) keepFetching = false;

      for (const task of tasks) {
        if (!task.name) continue;

        // Skip tasks with no reward — not useful for our EV scoring
        const rewardAmount = task.reward?.amount;
        if (!rewardAmount || rewardAmount === 0) continue;

        const rewardToken = task.reward?.token?.symbol ?? "USDC";
        const chain = task.reward?.token?.network?.toLowerCase() ?? "multi";
        const skills = (task.skills ?? [])
          .map((s) => s.name)
          .filter(Boolean);

        // Map Dework status to our campaign_status
        let campaignStatus: "active" | "in_review" | "ended" = "active";
        if (task.status === "IN_REVIEW") campaignStatus = "in_review";
        if (task.status === "DONE" || task.status === "CLOSED")
          campaignStatus = "ended";

        campaigns.push({
          title: task.name,
          protocol_name: task.workspace?.name ?? "Unknown",
          type: "bounty",
          reward_usd: parseRewardAmount(rewardAmount),
          entry_count: task.applicationCount ?? 0,
          deadline: safeISODate(task.dueDate),
          source_url: `https://app.dework.xyz/${task.workspace?.slug ?? ""}`,
          description: task.description ?? "",
          chain,
          reward_token: rewardToken,
          campaign_status: campaignStatus,
          skills_required: skills,
        });
      }

      offset += LIMIT;
      if (keepFetching) await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error("[dework] Fetch error:", err);
      break;
    }
  }

  console.log(`[dework] Fetched ${campaigns.length} tasks`);
  return campaigns;
}
