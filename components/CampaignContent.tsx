"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { ScoreBadge } from "@/components/ScoreBadge";
import type { Campaign } from "@/lib/supabase";
import {
  getScoreColor,
  formatDeadline,
  formatReward,
  getTypeChipStyle,
  getTypeLabel,
  URGENT_CHIP_STYLE,
  isUrgent,
  getChainColor,
  getChainName,
} from "@/lib/utils";

// ─── Red flag keywords ──────────────────────────────────────────────────────

const RED_FLAG_KEYWORDS = ["rug", "KOL concentration", "FDV gap"];

function parseRedFlags(adminNotes: string): string[] {
  if (!adminNotes) return [];
  return adminNotes
    .split("·")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function hasRedFlags(campaign: Campaign): boolean {
  if (campaign.founder_score !== null && campaign.founder_score < 60) return true;
  if (!campaign.admin_notes) return false;
  const lower = campaign.admin_notes.toLowerCase();
  return RED_FLAG_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

// ─── Breakdown bar ──────────────────────────────────────────────────────────

function BreakdownBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const color = getScoreColor(value);
  return (
    <div className="flex items-center gap-3 mb-3">
      <span
        className="w-[100px] text-[12px] text-[#7D8590] flex-shrink-0"
        style={{ fontFamily: "var(--font-geist)" }}
      >
        {label}
      </span>
      <div className="flex-1 h-[4px] bg-[#21262D] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="w-[36px] text-right text-[12px] font-medium tabular-nums"
        style={{ color, fontFamily: "var(--font-ibm-plex-mono)" }}
      >
        {value}%
      </span>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CampaignContent({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving) return;
    setSaving(true);

    try {
      const res = await fetch("/api/campaigns/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaign.id }),
      });

      if (res.ok) {
        setSaved(true);
      }
    } catch {
      // Silently fail — non-critical action
    }

    setSaving(false);
  }

  const typeStyle = getTypeChipStyle(campaign.type);
  const urgent = isUrgent(campaign.deadline);
  const showRedFlags = hasRedFlags(campaign);
  const redFlags = parseRedFlags(campaign.admin_notes);
  const founderScore = campaign.founder_score_override ?? campaign.founder_score ?? 50;

  return (
    <div className="max-w-[960px] mx-auto">
      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em]
          text-[#7D8590] mb-6 hover:text-[#C9D1D9] transition-colors"
        style={{ fontFamily: "var(--font-geist)" }}
        aria-label="Back to dashboard"
      >
        <ArrowLeft size={14} />
        BACK TO DASHBOARD
      </button>

      {/* Hero row */}
      <div className="flex items-center gap-4 mb-3">
        <ScoreBadge
          score={campaign.score}
          size={72}
          founderScore={campaign.founder_score}
        />
        <div className="flex items-baseline gap-2 flex-wrap min-w-0">
          <h1
            className="text-[22px] font-medium text-[#00D282] leading-tight"
            style={{ fontFamily: "var(--font-geist)" }}
          >
            {campaign.title}
          </h1>
          <span
            className="text-[#7D8590] text-[14px] flex-shrink-0"
            style={{ fontFamily: "var(--font-geist)" }}
          >
            / Protocol: {campaign.protocol_name_raw}
          </span>
        </div>
      </div>

      {/* Chips */}
      <div className="flex items-center gap-2 mb-8">
        <span
          className="inline-flex items-center text-[11px] font-medium uppercase
            px-2 py-[3px] rounded-[20px] border-[0.5px]"
          style={{
            backgroundColor: typeStyle.bg,
            color: typeStyle.text,
            borderColor: typeStyle.border,
          }}
        >
          {getTypeLabel(campaign.type)}
        </span>
        {urgent && (
          <span
            className="inline-flex items-center text-[11px] font-medium uppercase
              px-2 py-[3px] rounded-[20px] border-[0.5px]"
            style={{
              backgroundColor: URGENT_CHIP_STYLE.bg,
              color: URGENT_CHIP_STYLE.text,
              borderColor: URGENT_CHIP_STYLE.border,
            }}
          >
            URGENT
          </span>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6">
        {/* Left column */}
        <div>
          {/* Description */}
          <div className="mb-8">
            {(campaign.description ?? "")
              .split("\n\n")
              .filter((p) => p.trim())
              .map((paragraph, i) => (
                <p
                  key={i}
                  className="text-[14px] text-[#C9D1D9] leading-[1.7] mb-4"
                  style={{ fontFamily: "var(--font-geist)" }}
                >
                  {paragraph}
                </p>
              ))}
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-3 mb-8">
            <a
              href={campaign.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-5 py-[10px] rounded-[8px]
                text-[13px] font-medium bg-[#00D282] text-[#050D09]
                hover:bg-[#00E08D] transition-colors"
              style={{ fontFamily: "var(--font-geist)" }}
            >
              Complete task →
            </a>
            <button
              onClick={handleSave}
              disabled={saved || saving}
              className="inline-flex items-center px-5 py-[10px] rounded-[8px]
                text-[13px] text-[#C9D1D9] bg-transparent
                border-[0.5px] border-[#30363D]
                hover:border-[#7D8590] transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-geist)" }}
            >
              {saved ? "Saved ✓" : saving ? "Saving..." : "Save"}
            </button>
          </div>

          {/* Founder Integrity Signal */}
          {showRedFlags && (
            <div
              className="bg-[#0D1117] border-[0.5px] border-[#21262D] rounded-[12px] p-4"
            >
              <p
                className="text-[11px] uppercase tracking-[0.08em] text-[#7D8590] mb-3"
                style={{ fontFamily: "var(--font-geist)" }}
              >
                FOUNDER INTEGRITY SIGNAL
              </p>
              <div className="flex flex-wrap gap-2">
                {redFlags.map((flag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[11px] font-medium
                      px-2 py-[3px] rounded-[20px] border-[0.5px]"
                    style={{
                      backgroundColor: URGENT_CHIP_STYLE.bg,
                      color: URGENT_CHIP_STYLE.text,
                      borderColor: URGENT_CHIP_STYLE.border,
                    }}
                  >
                    <AlertTriangle size={12} />
                    {flag}
                  </span>
                ))}
                {redFlags.length === 0 && campaign.founder_score !== null && campaign.founder_score < 60 && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-medium
                      px-2 py-[3px] rounded-[20px] border-[0.5px]"
                    style={{
                      backgroundColor: URGENT_CHIP_STYLE.bg,
                      color: URGENT_CHIP_STYLE.text,
                      borderColor: URGENT_CHIP_STYLE.border,
                    }}
                  >
                    <AlertTriangle size={12} />
                    Low founder trust score ({campaign.founder_score})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Risk/Reward Breakdown */}
          <div
            className="bg-[#0D1117] border-[0.5px] border-[#21262D] rounded-[12px] p-4"
          >
            <p
              className="text-[11px] uppercase tracking-[0.08em] text-[#7D8590] mb-4"
              style={{ fontFamily: "var(--font-geist)" }}
            >
              RISK/REWARD BREAKDOWN
            </p>
            <BreakdownBar label="Reward" value={campaign.reward_score} />
            <BreakdownBar label="Effort" value={campaign.effort_score} />
            <BreakdownBar
              label="Competition"
              value={Math.max(0, 100 - Math.min(100, Math.round((campaign.entry_count / 200) * 100)))}
            />
            <BreakdownBar label="Founder Trust" value={founderScore} />
          </div>

          {/* Metadata */}
          <div
            className="bg-[#0D1117] border-[0.5px] border-[#21262D] rounded-[12px] p-4"
          >
            <p
              className="text-[11px] uppercase tracking-[0.08em] text-[#7D8590] mb-4"
              style={{ fontFamily: "var(--font-geist)" }}
            >
              METADATA
            </p>
            <div className="space-y-3">
              {/* Deadline */}
              <div className="flex items-center justify-between">
                <span
                  className="text-[12px] text-[#7D8590]"
                  style={{ fontFamily: "var(--font-geist)" }}
                >
                  Deadline
                </span>
                <span
                  className="text-[12px] text-[#C9D1D9]"
                  style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
                >
                  {formatDeadline(campaign.deadline)}
                </span>
              </div>
              {/* Reward Pool */}
              <div className="flex items-center justify-between">
                <span
                  className="text-[12px] text-[#7D8590]"
                  style={{ fontFamily: "var(--font-geist)" }}
                >
                  Reward Pool
                </span>
                <span
                  className="text-[12px] text-[#C9D1D9]"
                  style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
                >
                  {formatReward(campaign.reward_usd)} USDC
                </span>
              </div>
              {/* Participants */}
              <div className="flex items-center justify-between">
                <span
                  className="text-[12px] text-[#7D8590]"
                  style={{ fontFamily: "var(--font-geist)" }}
                >
                  Participants
                </span>
                <span
                  className="text-[12px] text-[#C9D1D9]"
                  style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
                >
                  {campaign.entry_count} Analysts
                </span>
              </div>
              {/* Network */}
              <div className="flex items-center justify-between">
                <span
                  className="text-[12px] text-[#7D8590]"
                  style={{ fontFamily: "var(--font-geist)" }}
                >
                  Network
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-[8px] h-[8px] rounded-full"
                    style={{ backgroundColor: getChainColor(campaign.chain ?? "unknown") }}
                  />
                  <span
                    className="text-[12px] text-[#C9D1D9]"
                    style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
                  >
                    {getChainName(campaign.chain ?? "unknown")}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Verified Alpha Source */}
          <div
            className="relative h-[120px] bg-[#0D1117] border-[0.5px] border-[#21262D]
              rounded-[12px] overflow-hidden flex items-end p-4"
            style={{
              backgroundImage: `radial-gradient(circle, #21262D 1px, transparent 1px)`,
              backgroundSize: "16px 16px",
            }}
          >
            <span
              className="text-[11px] uppercase tracking-[0.08em] text-[#00D282] font-medium"
              style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
            >
              VERIFIED ALPHA SOURCE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
