/**
 * Supabase Client
 * ───────────────
 * Exports a typed Supabase client for client-side usage.
 *
 * RLS NOTE: The `campaigns` table should have an RLS policy
 * allowing anonymous SELECT where `status = 'published'`.
 * Set this up in the Supabase dashboard under Authentication → Policies.
 *
 * The `saved_campaigns` table requires authenticated INSERT/SELECT
 * where `user_id = auth.uid()`.
 */

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Campaign type (canonical) ────────────────────────────────────────────────
// Extends the AdminCampaigns Campaign interface with fields the aggregator
// inserts but the admin editor doesn't surface.

export type CampaignType = "bounty" | "infofi" | "onchain";
export type EffortLabel = "low" | "medium" | "high";
export type CampaignStatus = "published" | "held" | "unpublished";

export interface Campaign {
  id: string;
  title: string;
  protocol_name_raw: string;
  protocol_id: string | null;
  type: CampaignType;
  reward_usd: number;
  entry_count: number;
  deadline: string;
  source_url: string;
  description: string;
  chain: string;
  raw_ev: number;
  // Dimension scores (auto-computed)
  reward_score: number;
  effort_score: number;
  timing_score: number;
  founder_score: number | null;
  effort_label: EffortLabel;
  effort_reasoning: string;
  // Final
  score: number;
  status: CampaignStatus;
  score_overridden: boolean;
  needs_founder_review: boolean;
  // Overrides (set by admin)
  effort_score_override: number | null;
  founder_score_override: number | null;
  admin_notes: string;
  // Timestamps
  created_at: string;
}
