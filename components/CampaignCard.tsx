"use client";

/**
 * CampaignCard — Feed card for a single campaign.
 * Matches the dark card layout from the design reference.
 */

import { useRouter } from "next/navigation";
import { Zap, Users } from "lucide-react";
import { ScoreBadge } from "./ScoreBadge";
import type { Campaign } from "@/lib/supabase";
import {
  isUrgent,
  formatReward,
  getTypeChipStyle,
  getTypeLabel,
  URGENT_CHIP_STYLE,
} from "@/lib/utils";

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const router = useRouter();
  const urgent = isUrgent(campaign.deadline);
  const typeStyle = getTypeChipStyle(campaign.type);
  const effortLabel = (campaign.effort_label ?? "medium").toUpperCase();

  function handleClick() {
    router.push(`/campaign/${campaign.id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${campaign.title}, score ${campaign.score}`}
      className="flex items-center gap-[14px] p-4 rounded-[12px] cursor-pointer
        bg-[#0D1117] border-[0.5px] border-[#21262D]
        hover:border-[#30363D] transition-[border-color] duration-150 ease-in-out"
    >
      {/* Score badge */}
      <ScoreBadge
        score={campaign.score}
        size={56}
        founderScore={campaign.founder_score}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <h3
          className="text-[14px] font-medium text-[#E8F4FF] truncate leading-tight"
          style={{ fontFamily: "var(--font-geist)" }}
        >
          {campaign.title}
        </h3>

        {/* Protocol */}
        <p
          className="text-[12px] text-[#7D8590] mt-0.5 uppercase tracking-wide"
          style={{ fontFamily: "var(--font-geist)" }}
        >
          PROTOCOL: {campaign.protocol_name_raw}
        </p>

        {/* Chips */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className="inline-flex items-center text-[11px] font-medium uppercase
              px-2 py-[3px] rounded-[20px] border-[0.5px]"
            style={{
              backgroundColor: typeStyle.bg,
              color: typeStyle.text,
              borderColor: typeStyle.border,
              fontFamily: "var(--font-geist)",
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
                fontFamily: "var(--font-geist)",
              }}
            >
              URGENT
            </span>
          )}
        </div>

        {/* Meta row */}
        <div
          className="flex items-center gap-4 mt-2 text-[12px]"
          style={{ fontFamily: "var(--font-geist)" }}
        >
          {/* Reward */}
          <div className="flex items-center gap-1">
            <span className="text-[#7D8590]" style={{ fontSize: "12px" }}>
              💵
            </span>
            <span className="text-[#7D8590]">Reward</span>
            <span
              className="font-medium text-[#00D282]"
              style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
            >
              {formatReward(campaign.reward_usd)}
            </span>
          </div>

          {/* Effort */}
          <div className="flex items-center gap-1">
            <Zap size={12} className="text-[#7D8590]" />
            <span className="text-[#7D8590]">Effort</span>
            <span
              className="font-medium text-[#C9D1D9]"
              style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
            >
              {effortLabel}
            </span>
          </div>

          {/* Entries */}
          <div className="flex items-center gap-1">
            <Users size={12} className="text-[#7D8590]" />
            <span className="text-[#7D8590]">Entries</span>
            <span
              className="font-medium text-[#C9D1D9]"
              style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
            >
              {campaign.entry_count}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
