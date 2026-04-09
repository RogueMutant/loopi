/**
 * Loopi Effort Classifier
 * ───────────────────────
 * Calls the Claude API to classify campaign effort level
 * (Low / Medium / High) from the campaign title and description.
 *
 * This replaces the manual "Admin assigns effort" step.
 * Cost: ~0.001 USD per campaign at claude-haiku-4-5 pricing.
 * Speed: ~1s per campaign.
 *
 * Effort → Score mapping:
 *   Low    → 100  (quick wins — social posts, simple signups, reposts)
 *   Medium →  60  (moderate work — short articles, testing, video clips)
 *   High   →  20  (heavy work — technical audits, long-form research, code)
 */

export type EffortLabel = "low" | "medium" | "high";

export interface EffortResult {
  effort_label: EffortLabel;
  effort_score: number;
  reasoning: string; // stored in DB for admin review/override
}

const EFFORT_SCORE_MAP: Record<EffortLabel, number> = {
  low: 100,
  medium: 60,
  high: 20,
};

const SYSTEM_PROMPT = `You are a Web3 campaign effort classifier for Loopi, a crypto intelligence platform.

Your job: classify the effort required to complete a campaign as LOW, MEDIUM, or HIGH.

DEFINITIONS:
- LOW: Tasks completable in under 30 minutes. Examples: follow + repost on X, fill out a form, mint a free NFT, join a Discord, write a single tweet or short post, sign up for a waitlist, connect a wallet.
- MEDIUM: Tasks requiring 30 minutes to 3 hours. Examples: write a thread (3-10 tweets), create a short video (under 5 min), write a 300-600 word article, test a product and submit feedback, complete a multi-step on-chain interaction.
- HIGH: Tasks requiring more than 3 hours. Examples: write a long-form research report (1000+ words), build a technical integration, perform a security audit, create a detailed video tutorial, produce design assets, write code.

When uncertain between two levels, choose the lower effort level (bias toward LOW/MEDIUM over MEDIUM/HIGH).

Respond ONLY with valid JSON in this exact format — no other text:
{"effort": "low"|"medium"|"high", "reasoning": "one sentence explanation"}`;

export async function classifyEffort(
  title: string,
  description: string
): Promise<EffortResult> {
  // Truncate description to avoid wasting tokens
  const truncatedDesc = description.slice(0, 800);

  const userMessage = `Campaign title: ${title}

Campaign description: ${truncatedDesc}

Classify the effort level.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // cheapest model — classification is simple
        max_tokens: 150,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      console.error("[classifier] API error:", response.status);
      return fallback();
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";

    // Parse JSON response
    const parsed = JSON.parse(text.trim());
    const effort_label = parsed.effort as EffortLabel;

    if (!["low", "medium", "high"].includes(effort_label)) {
      console.warn("[classifier] Unexpected effort value:", effort_label);
      return fallback();
    }

    return {
      effort_label,
      effort_score: EFFORT_SCORE_MAP[effort_label],
      reasoning: parsed.reasoning ?? "",
    };
  } catch (err) {
    console.error("[classifier] Error:", err);
    return fallback();
  }
}

/** Default to medium if classifier fails — safe middle ground */
function fallback(): EffortResult {
  return {
    effort_label: "medium",
    effort_score: 60,
    reasoning: "Auto-classification failed — defaulted to medium. Review manually.",
  };
}

// ─── Batch classifier (for backfill / re-scoring existing campaigns) ──────────

export async function batchClassifyEffort(
  campaigns: Array<{ id: string; title: string; description: string }>
): Promise<void> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log(`[classifier] Batch classifying ${campaigns.length} campaigns`);

  for (const campaign of campaigns) {
    const result = await classifyEffort(campaign.title, campaign.description);

    await supabase
      .from("campaigns")
      .update({
        effort_label: result.effort_label,
        effort_score: result.effort_score,
        effort_reasoning: result.reasoning,
      })
      .eq("id", campaign.id);

    // Rate limit: ~1 request/second to avoid API throttling
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("[classifier] Batch complete");
}
