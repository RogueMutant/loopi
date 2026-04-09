/**
 * Loopi Admin Score Editor
 * ────────────────────────
 * A full-page React component for /admin/campaigns.
 * Shows all campaigns with their auto-computed scores.
 * Lets you override any dimension, approve held campaigns,
 * research new protocols, and publish/unpublish.
 *
 * Designed to match Loopi's dark UI (bg #050D09 / accent #00D282).
 *
 * Usage:
 *   app/admin/campaigns/page.tsx  →  import AdminCampaigns from "@/components/AdminCampaigns"
 *
 * Protect this route with middleware:
 *   middleware.ts  →  check session.user.role === "admin"
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

type EffortLabel = "low" | "medium" | "high";
type CampaignStatus = "published" | "held" | "unpublished";

interface Campaign {
  id: string;
  title: string;
  protocol_name_raw: string;
  protocol_id: string | null;
  type: "bounty" | "infofi" | "onchain";
  reward_usd: number;
  entry_count: number;
  deadline: string;
  source_url: string;
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
}

interface Protocol {
  id: string;
  name: string;
  trust_score: number;
  vc_backers: string;
  red_flags: string;
}

// ─── Supabase client ──────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Score helpers ────────────────────────────────────────────────────────────

function computeScore(c: Campaign): number {
  const reward = c.reward_score;
  const effort = c.effort_score_override ?? c.effort_score;
  const timing = c.timing_score;
  const founder = c.founder_score_override ?? c.founder_score ?? 50;
  let raw = Math.round(reward * 0.3 + effort * 0.25 + timing * 0.25 + founder * 0.2);
  raw = Math.max(0, Math.min(100, raw));
  if (founder < 20) raw = Math.min(raw, 40);
  return raw;
}

function scoreColor(score: number): string {
  if (score >= 75) return "#00D282";
  if (score >= 40) return "#D2991F";
  return "#F85149";
}

function effortLabelToScore(label: EffortLabel): number {
  return label === "low" ? 100 : label === "medium" ? 60 : 20;
}

// ─── Score Ring SVG ───────────────────────────────────────────────────────────

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ * 0.75;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#161B22" strokeWidth="4" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle"
        style={{ fontSize: size < 44 ? 11 : 13, fontWeight: 500, fill: color, fontFamily: "Georgia, serif" }}>
        {score}
      </text>
    </svg>
  );
}

// ─── Dimension bar ────────────────────────────────────────────────────────────

function DimBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <span style={{ width: 80, fontSize: 11, color: "#7D8590", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 3, background: "#21262D", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ width: 28, fontSize: 11, color: "#C9D1D9", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

// ─── Campaign row ─────────────────────────────────────────────────────────────

function CampaignRow({
  campaign,
  onUpdate,
  onPublish,
  onHold,
}: {
  campaign: Campaign;
  onUpdate: (id: string, patch: Partial<Campaign>) => void;
  onPublish: (id: string) => void;
  onHold: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [founderInput, setFounderInput] = useState(
    String(campaign.founder_score_override ?? campaign.founder_score ?? "")
  );
  const [effortOverride, setEffortOverride] = useState<EffortLabel>(campaign.effort_label);
  const [notes, setNotes] = useState(campaign.admin_notes ?? "");
  const [saving, setSaving] = useState(false);

  const liveScore = computeScore({
    ...campaign,
    founder_score_override: founderInput !== "" ? Number(founderInput) : null,
    effort_score_override: effortLabelToScore(effortOverride),
  });

  async function save() {
    setSaving(true);
    const patch = {
      founder_score_override: founderInput !== "" ? Number(founderInput) : null,
      effort_score_override: effortLabelToScore(effortOverride),
      effort_label: effortOverride,
      admin_notes: notes,
      score: liveScore,
      score_overridden: true,
    };
    await supabase.from("campaigns").update(patch).eq("id", campaign.id);
    onUpdate(campaign.id, patch);
    setSaving(false);
  }

  const deadlineDays = Math.ceil(
    (new Date(campaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div style={{
      background: "#0D1117", border: `0.5px solid ${campaign.needs_founder_review ? "#D2991F44" : "#21262D"}`,
      borderRadius: 12, marginBottom: 8, overflow: "hidden",
      borderLeft: campaign.needs_founder_review ? "3px solid #D2991F" : campaign.status === "published" ? "3px solid #00D28233" : "3px solid #21262D",
    }}>

      {/* ── Summary row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}>
        <ScoreRing score={campaign.score} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#E8F4FF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {campaign.title}
          </div>
          <div style={{ fontSize: 11, color: "#7D8590", marginTop: 2 }}>
            {campaign.protocol_name_raw} · {campaign.type} · ${campaign.reward_usd.toLocaleString()} · {deadlineDays}d left
          </div>
        </div>

        {/* Status badges */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {campaign.needs_founder_review && (
            <span style={{ fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 20, background: "rgba(210,153,34,0.12)", color: "#D2991F", border: "0.5px solid rgba(210,153,34,0.3)" }}>
              New protocol
            </span>
          )}
          {campaign.score_overridden && (
            <span style={{ fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 20, background: "rgba(88,166,255,0.1)", color: "#58A6FF", border: "0.5px solid rgba(88,166,255,0.25)" }}>
              Overridden
            </span>
          )}
          <span style={{
            fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 20,
            background: campaign.status === "published" ? "rgba(0,210,130,0.1)" : "rgba(248,81,73,0.1)",
            color: campaign.status === "published" ? "#00D282" : "#F85149",
            border: `0.5px solid ${campaign.status === "published" ? "rgba(0,210,130,0.25)" : "rgba(248,81,73,0.2)"}`,
          }}>
            {campaign.status}
          </span>
        </div>

        <span style={{ color: "#7D8590", fontSize: 12, flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {/* ── Expanded editor ── */}
      {expanded && (
        <div style={{ borderTop: "0.5px solid #21262D", padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Left: Current scores */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", color: "#7D8590", marginBottom: 10 }}>
              Auto-computed scores
            </div>
            <DimBar label="Reward (30%)" value={campaign.reward_score} color="#00D282" />
            <DimBar label="Effort (25%)" value={campaign.effort_score} color="#58A6FF" />
            <DimBar label="Timing (25%)" value={campaign.timing_score} color="#D2991F" />
            <DimBar label="Founder (20%)" value={campaign.founder_score ?? 50} color="#F85149" />
            <div style={{ marginTop: 8, fontSize: 11, color: "#7D8590", fontStyle: "italic" }}>
              Effort reasoning: {campaign.effort_reasoning || "—"}
            </div>
            <a href={campaign.source_url} target="_blank" rel="noreferrer"
              style={{ display: "inline-block", marginTop: 10, fontSize: 11, color: "#58A6FF" }}>
              View original listing ↗
            </a>
          </div>

          {/* Right: Override controls */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", color: "#7D8590", marginBottom: 10 }}>
              Admin overrides
            </div>

            {/* Effort override */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#7D8590", marginBottom: 6 }}>Effort level</div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["low", "medium", "high"] as EffortLabel[]).map((lvl) => (
                  <button key={lvl} onClick={() => setEffortOverride(lvl)}
                    style={{
                      padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: "0.5px solid",
                      background: effortOverride === lvl ? "#00D28222" : "transparent",
                      borderColor: effortOverride === lvl ? "#00D282" : "#30363D",
                      color: effortOverride === lvl ? "#00D282" : "#7D8590",
                      fontWeight: effortOverride === lvl ? 500 : 400,
                    }}>
                    {lvl} ({effortLabelToScore(lvl)})
                  </button>
                ))}
              </div>
            </div>

            {/* Founder trust override */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#7D8590", marginBottom: 6 }}>
                Founder trust score (0–100)
                {campaign.needs_founder_review && (
                  <span style={{ marginLeft: 6, color: "#D2991F" }}>— requires research</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="number" min={0} max={100} value={founderInput}
                  onChange={(e) => setFounderInput(e.target.value)}
                  style={{
                    background: "#161B22", border: "0.5px solid #30363D", borderRadius: 6,
                    color: "#E8F4FF", padding: "6px 10px", fontSize: 13, width: 80,
                    fontVariantNumeric: "tabular-nums",
                  }} />
                <div style={{ flex: 1 }}>
                  <input type="range" min={0} max={100} value={founderInput || 0}
                    onChange={(e) => setFounderInput(e.target.value)}
                    style={{ width: "100%" }} />
                </div>
              </div>
              {/* Deduction cheatsheet */}
              <div style={{ marginTop: 6, fontSize: 11, color: "#7D8590", lineHeight: 1.6 }}>
                Deductions: Unknown VCs −20 · KOL conc. high −20 · Prev rug −40 · FDV gap &gt;3× −25
              </div>
            </div>

            {/* Admin notes */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#7D8590", marginBottom: 6 }}>Notes (internal)</div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                style={{
                  width: "100%", background: "#161B22", border: "0.5px solid #30363D",
                  borderRadius: 6, color: "#C9D1D9", padding: "8px 10px", fontSize: 12,
                  resize: "vertical", boxSizing: "border-box",
                }} />
            </div>

            {/* Live score preview + actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <ScoreRing score={liveScore} size={40} />
              <span style={{ fontSize: 12, color: "#7D8590" }}>Live preview</span>
              <div style={{ flex: 1 }} />
              <button onClick={save} disabled={saving}
                style={{
                  padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: saving ? "not-allowed" : "pointer",
                  background: saving ? "#161B22" : "#00D282", color: saving ? "#7D8590" : "#050D09",
                  border: "none", fontWeight: 500,
                }}>
                {saving ? "Saving…" : "Save overrides"}
              </button>
              {campaign.status !== "published" ? (
                <button onClick={() => onPublish(campaign.id)}
                  style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", background: "transparent", color: "#00D282", border: "0.5px solid #00D282", fontWeight: 500 }}>
                  Publish
                </button>
              ) : (
                <button onClick={() => onHold(campaign.id)}
                  style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", background: "transparent", color: "#F85149", border: "0.5px solid #F85149" }}>
                  Unpublish
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main admin page ──────────────────────────────────────────────────────────

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filter, setFilter] = useState<"all" | "held" | "published" | "overridden">("all");
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .order("score", { ascending: false });
    setCampaigns(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleUpdate(id: string, patch: Partial<Campaign>) {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  async function handlePublish(id: string) {
    await supabase.from("campaigns").update({ status: "published" }).eq("id", id);
    handleUpdate(id, { status: "published" });
  }

  async function handleHold(id: string) {
    await supabase.from("campaigns").update({ status: "held" }).eq("id", id);
    handleUpdate(id, { status: "held" });
  }

  async function triggerAggregator() {
    setTriggering(true);
    await fetch("/api/cron/aggregate", { method: "POST" });
    setLastRun(new Date().toLocaleTimeString());
    await load();
    setTriggering(false);
  }

  const filtered = campaigns.filter((c) => {
    if (filter === "held") return c.status === "held";
    if (filter === "published") return c.status === "published";
    if (filter === "overridden") return c.score_overridden;
    return true;
  });

  const counts = {
    all: campaigns.length,
    held: campaigns.filter((c) => c.status === "held").length,
    published: campaigns.filter((c) => c.status === "published").length,
    overridden: campaigns.filter((c) => c.score_overridden).length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050D09", color: "#E8F4FF", padding: 24, fontFamily: '"Geist Mono", "JetBrains Mono", monospace' }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 500, color: "#00D282", letterSpacing: "-0.02em" }}>
            Loopi Admin
          </div>
          <div style={{ fontSize: 12, color: "#7D8590", marginTop: 2 }}>Campaign score editor</div>
        </div>
        <div style={{ flex: 1 }} />
        {lastRun && (
          <span style={{ fontSize: 11, color: "#7D8590" }}>Last run: {lastRun}</span>
        )}
        <button onClick={triggerAggregator} disabled={triggering}
          style={{
            padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
            cursor: triggering ? "not-allowed" : "pointer",
            background: triggering ? "#161B22" : "#00D282",
            color: triggering ? "#7D8590" : "#050D09", border: "none",
          }}>
          {triggering ? "Running aggregator…" : "Run aggregator now"}
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
        {[
          { label: "Total campaigns", val: counts.all, color: "#E8F4FF" },
          { label: "Needs review", val: counts.held, color: "#D2991F" },
          { label: "Published", val: counts.published, color: "#00D282" },
          { label: "Overridden", val: counts.overridden, color: "#58A6FF" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: "#0D1117", border: "0.5px solid #21262D", borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, color: "#7D8590", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 500, color, fontVariantNumeric: "tabular-nums" }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, background: "#0D1117", border: "0.5px solid #21262D", borderRadius: 8, padding: 3, width: "fit-content", marginBottom: 16 }}>
        {(["all", "held", "published", "overridden"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: "5px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: "none",
              background: filter === f ? "#161B22" : "transparent",
              color: filter === f ? "#E8F4FF" : "#7D8590",
              fontWeight: filter === f ? 500 : 400,
            }}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Campaign list */}
      {loading ? (
        <div style={{ color: "#7D8590", fontSize: 13 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "#7D8590", fontSize: 13 }}>No campaigns match this filter.</div>
      ) : (
        filtered.map((c) => (
          <CampaignRow
            key={c.id}
            campaign={c}
            onUpdate={handleUpdate}
            onPublish={handlePublish}
            onHold={handleHold}
          />
        ))
      )}
    </div>
  );
}
