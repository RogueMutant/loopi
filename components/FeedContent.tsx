"use client";

/**
 * Feed Content
 * Shows all published campaigns with filter + sort controls.
 * Subscribes to Supabase Realtime for live updates.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { CampaignCard } from "@/components/CampaignCard";
import { CampaignSkeleton } from "@/components/CampaignSkeleton";
import { supabase } from "@/lib/supabase";
import type { Campaign, CampaignType } from "@/lib/supabase";

type FilterType = "all" | CampaignType;
type SortOption =
  | "score-desc"
  | "score-asc"
  | "reward-desc"
  | "deadline-asc"
  | "newest";

const SORT_LABELS: Record<SortOption, string> = {
  "score-desc": "Score: High to Low",
  "score-asc": "Score: Low to High",
  "reward-desc": "Reward: Highest",
  "deadline-asc": "Deadline: Soonest",
  newest: "Newest",
};

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Bounty", value: "bounty" },
  { label: "Infofi", value: "infofi" },
  { label: "On-chain", value: "onchain" },
];

export function FeedContent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(campaigns.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortOption>("score-desc");
  const [flashId, setFlashId] = useState<string | null>(null);

  // ─── Fetch campaigns ──────────────────────────────────────────────────────

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("status", "published")
      .order("score", { ascending: false })
      .limit(50);

    if (fetchError) {
      setError("Failed to load campaigns");
      setLoading(false);
      return;
    }

    setCampaigns(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (campaigns.length === 0) {
      fetchCampaigns();
    }
  }, [fetchCampaigns, campaigns.length]);

  // ─── Realtime subscription ────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel("campaigns-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "campaigns" },
        (payload) => {
          const newCampaign = payload.new as Campaign;
          if (newCampaign.status === "published") {
            setCampaigns((prev) => [newCampaign, ...prev]);
            setFlashId(newCampaign.id);
            setTimeout(() => setFlashId(null), 1500);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "campaigns" },
        (payload) => {
          const updated = payload.new as Campaign;
          if (updated.status !== "published") {
            // Campaign unpublished — remove from list
            setCampaigns((prev) => prev.filter((c) => c.id !== updated.id));
          } else {
            // Campaign updated — replace in list or add if newly published
            setCampaigns((prev) => {
              const existing = prev.find((c) => c.id === updated.id);
              if (existing) {
                return prev.map((c) => (c.id === updated.id ? updated : c));
              }
              setFlashId(updated.id);
              setTimeout(() => setFlashId(null), 1500);
              return [updated, ...prev];
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ─── Filter + Sort ────────────────────────────────────────────────────────

  const filteredAndSorted = useMemo(() => {
    let result = campaigns;

    // Filter
    if (filter !== "all") {
      result = result.filter((c) => c.type === filter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sort) {
        case "score-desc":
          return b.score - a.score;
        case "score-asc":
          return a.score - b.score;
        case "reward-desc":
          return b.reward_usd - a.reward_usd;
        case "deadline-asc":
          return (
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          );
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        default:
          return 0;
      }
    });

    return result;
  }, [campaigns, filter, sort]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Filter row */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        {/* Filter pills */}
        <div className="flex items-center gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              aria-label={`Filter by ${opt.label}`}
              className={`text-[13px] px-4 py-[6px] rounded-[20px] border-[0.5px]
                transition-colors duration-100
                ${
                  filter === opt.value
                    ? "bg-[#00D28218] border-[#00D282] text-[#00D282]"
                    : "bg-transparent border-[#30363D] text-[#7D8590] hover:text-[#C9D1D9] hover:border-[#7D8590]"
                }`}
              style={{ fontFamily: "var(--font-geist)" }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            aria-label="Sort campaigns"
            className="appearance-none bg-[#0D1117] border-[0.5px] border-[#21262D]
              rounded-[8px] px-[14px] py-2 pr-8 text-[13px] text-[#C9D1D9]
              cursor-pointer outline-none focus:border-[#30363D]"
            style={{ fontFamily: "var(--font-geist)" }}
          >
            {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
          {/* Chevron */}
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#7D8590]"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Campaign list */}
      <div className="space-y-2">
        {loading ? (
          <>
            <CampaignSkeleton />
            <CampaignSkeleton />
            <CampaignSkeleton />
          </>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-[#F85149] text-[14px] mb-3">{error}</p>
            <button
              onClick={fetchCampaigns}
              className="text-[13px] text-[#00D282] border-[0.5px] border-[#00D282]
                px-4 py-2 rounded-[8px] hover:bg-[#00D28218] transition-colors"
              style={{ fontFamily: "var(--font-geist)" }}
            >
              Retry
            </button>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-16">
            <p
              className="text-[#7D8590] text-[14px] mb-3"
              style={{ fontFamily: "var(--font-geist)" }}
            >
              No campaigns match your filters
            </p>
            <button
              onClick={() => setFilter("all")}
              className="text-[13px] text-[#7D8590] border-[0.5px] border-[#30363D]
                px-4 py-2 rounded-[8px] hover:border-[#7D8590] hover:text-[#C9D1D9]
                transition-colors"
              style={{ fontFamily: "var(--font-geist)" }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredAndSorted.map((campaign) => (
            <div
              key={campaign.id}
              className={
                flashId === campaign.id ? "animate-flash rounded-[12px]" : ""
              }
            >
              <CampaignCard campaign={campaign} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
