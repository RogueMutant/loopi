/**
 * Loopi — Questn + Dework Fetchers
 * ──────────────────────────────────
 * Replaces Layer3 (domain ENOTFOUND) and fixes Dework query schema.
 *
 * Questn: https://questn.com — task-based Web3 campaigns, strong Asia-Pacific
 *         coverage, active campaigns across major chains. Public REST API.
 *
 * Dework: https://app.dework.xyz — crypto-native bounty board. Higher-value
 *         technical tasks. GraphQL API — query simplified to fix 400 error.
 */

import type { RawCampaign } from "./aggregator";

// ─── Source-specific response types ──────────────────────────────────────────
// Typed to exactly the fields we read from each API; extra fields are ignored.

interface QuestnItem {
  id: string | number;
  title?: string;
  description?: string;
  shortDescription?: string;
  project?: { name?: string };
  projectName?: string;
  reward?: { token?: string; amount?: string | number };
  rewardAmount?: string | number;
  rewardToken?: string;
  participants?: number;
  participantCount?: number;
  deadline?: string | number;
  endTime?: string | number;
  link?: string;
  chain?: string;
  network?: string;
  tags?: string[];
}

interface DeworkSkill {
  name: string;
}

interface DeworkTask {
  id: string;
  name?: string;
  description?: string;
  dueDate?: string;
  status?: string;
  applicationCount?: number;
  reward?: {
    amount?: string | number;
    token?: { symbol?: string; network?: string };
  };
  workspace?: { name?: string; slug?: string };
  skills?: DeworkSkill[];
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function parseRewardAmount(raw: string | number | null | undefined): number {
  if (raw == null) return 0;
  if (typeof raw === "number") return Math.min(raw, 10_000_000);
  const cleaned = String(raw).replace(/[$,\s]/g, "").replace(/usdc|usdt|sol|eth|op|arb|bnb/gi, "");
  const num = parseFloat(cleaned);
  return isNaN(num) || num < 0 ? 0 : Math.min(num, 10_000_000);
}

function safeISODate(raw: string | number | null | undefined): string {
  if (!raw) return new Date(Date.now() + 7 * 86400000).toISOString();
  const parsed = typeof raw === "number" ? new Date(raw * 1000) : new Date(raw);
  return isNaN(parsed.getTime())
    ? new Date(Date.now() + 7 * 86400000).toISOString()
    : parsed.toISOString();
}

function safeCount(val: number | null | undefined): number {
  const n = val ?? 0;
  return Math.min(Math.max(0, Math.floor(n)), 10_000_000);
}

// ─── Questn ───────────────────────────────────────────────────────────────────
//
// Questn (questn.com) has a public REST API for campaign listings.
// Endpoint verified April 2026: https://api.questn.com/consumer/explore/list
// Params: limit (int), offset (int), status ("ongoing" | "upcoming" | "ended")
//
// Response shape:
//   { data: { list: [...], total: number }, code: 0 }
//
// Each quest has:
//   id, title, description, reward { token, amount, type }
//   participants, deadline (unix timestamp), project { name }
//   status: "ongoing" | "upcoming" | "ended"

export async function fetchQuestn(): Promise<RawCampaign[]> {
  const campaigns: RawCampaign[] = [];
  let offset = 0;
  const limit = 50;

  while (offset < 200) {
    const url = `https://api.questn.com/consumer/explore/list?limit=${limit}&offset=${offset}&status=ongoing`;

    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; Loopi/1.0)",
          "Referer": "https://questn.com",
        },
      });
    } catch (err) {
      console.error("[questn] Fetch error:", err);
      break;
    }

    if (!res.ok) {
      console.error("[questn] API error:", res.status);
      break;
    }

    const json = await res.json();

    // Non-zero code means API error
    if (json.code !== 0 && json.code !== 200) {
      console.error("[questn] API returned error code:", json.code, json.message ?? "");
      break;
    }

    const list: QuestnItem[] = json.data?.list ?? json.list ?? [];
    if (list.length === 0) break;

    for (const quest of list) {
      if (!quest.title) continue;

      const rewardAmount = parseRewardAmount(
        quest.reward?.amount ?? quest.rewardAmount ?? 0
      );
      const rewardToken = quest.reward?.token ?? quest.rewardToken ?? "POINTS";

      campaigns.push({
        title: quest.title ?? "",
        protocol_name: quest.project?.name ?? quest.projectName ?? "Unknown",
        type: "infofi",
        reward_usd: rewardAmount,
        reward_token: rewardToken,
        entry_count: safeCount(quest.participants ?? quest.participantCount ?? 0),
        deadline: safeISODate(quest.deadline ?? quest.endTime),
        source_url: quest.link ?? `https://questn.com/quest/${quest.id}`,
        description: ((quest.description ?? quest.shortDescription ?? "") as string).slice(0, 1000),
        chain: quest.chain ?? quest.network ?? "multi",
        campaign_status: "active",
        skills_required: quest.tags ?? [],
      } satisfies RawCampaign);
    }

    if (list.length < limit) break;
    offset += limit;
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`[questn] Fetched ${campaigns.length} quests`);
  return campaigns;
}

// ─── Dework ───────────────────────────────────────────────────────────────────
//
// Previous query had `assigneeIds: []` in the filter — not a valid Dework field.
// Simplified to use only supported filter args: statuses.
// Also removed the `pagination` input wrapper — Dework uses flat limit/offset args.

const DEWORK_API = "https://api.dework.xyz/graphql";

const DEWORK_QUERY = `
  query OpenTasks($limit: Float!, $offset: Float!) {
    tasks(
      filter: { statuses: [OPEN] }
      sorting: { field: createdAt, direction: DESC }
      limit: $limit
      offset: $offset
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

export async function fetchDework(): Promise<RawCampaign[]> {
  const campaigns: RawCampaign[] = [];
  let offset = 0;
  const limit = 50;

  while (offset < 150) {
    let res: Response;
    try {
      res = await fetch(DEWORK_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: DEWORK_QUERY,
          variables: { limit, offset },
        }),
      });
    } catch (err) {
      console.error("[dework] Fetch error:", err);
      break;
    }

    if (!res.ok) {
      // Log body to understand the 400
      const body = await res.text().catch(() => "");
      console.error(`[dework] API error ${res.status}:`, body.slice(0, 200));
      break;
    }

    const { data, errors } = await res.json();

    if (errors?.length) {
      console.error("[dework] GraphQL error:", errors[0]?.message);
      break;
    }

    const tasks: DeworkTask[] = data?.tasks ?? [];
    if (tasks.length === 0) break;

    for (const task of tasks) {
      if (!task.name) continue;
      // Skip unrewarded tasks — useless for EV scoring
      const rewardAmount = parseRewardAmount(task.reward?.amount);
      if (rewardAmount === 0) continue;

      const rewardToken = task.reward?.token?.symbol ?? "USDC";
      const chain = task.reward?.token?.network?.toLowerCase() ?? "multi";
      const skills = (task.skills ?? []).map((s: DeworkSkill) => s.name).filter(Boolean);

      let campaignStatus: "active" | "in_review" | "ended" = "active";
      if (task.status === "IN_REVIEW") campaignStatus = "in_review";
      if (task.status === "DONE" || task.status === "CLOSED") campaignStatus = "ended";

      campaigns.push({
        title: task.name ?? "",
        protocol_name: task.workspace?.name ?? "Unknown",
        type: "bounty",
        reward_usd: rewardAmount,
        reward_token: rewardToken,
        entry_count: safeCount(task.applicationCount ?? 0),
        deadline: safeISODate(task.dueDate),
        source_url: `https://app.dework.xyz/${task.workspace?.slug ?? ""}`,
        description: (task.description ?? "").slice(0, 1000),
        chain,
        campaign_status: campaignStatus,
        skills_required: skills,
      } satisfies RawCampaign);
    }

    if (tasks.length < limit) break;
    offset += limit;
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`[dework] Fetched ${campaigns.length} tasks`);
  return campaigns;
}