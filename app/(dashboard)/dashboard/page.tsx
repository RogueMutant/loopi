"use client";

import Image from "next/image";
import { ScoreBadge } from "@/components/ScoreBadge";
import { usePrivy } from "@privy-io/react-auth";

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function CopyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      width={14}
      height={14}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
      />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={16}
      height={16}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
      />
    </svg>
  );
}

// ─── Dashboard View ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { authenticated, user } = usePrivy();

  let displayName = "User";
  if (authenticated) {
    const address = user?.wallet?.address || user?.email?.address || "";
    if (address.length > 20) {
      displayName = `${address.slice(0, 5)}...${address.slice(-4)}`;
    } else if (address) {
      displayName = address;
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 animate-in fade-in duration-500 pb-12">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-sans text-t1 tracking-wide">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm text-t2">
            Your analyst profile is performing in the top 2% this week.
          </p>
        </div>

        <div className="flex items-center gap-4 p-2 pl-4 border border-border bg-elevated rounded-lg shadow-sm">
          <span className="text-[10px] font-mono text-t3 uppercase tracking-wider">
            Referral Link
          </span>
          <div className="flex items-center gap-2 px-2 py-1 bg-accentGreen/10 rounded">
            <span className="text-xs font-mono text-accentGreen truncate max-w-[140px]">
              loopi.intel/0x3f9a
            </span>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-t2 hover:text-t1 hover:bg-surface rounded border border-transparent hover:border-border transition-colors">
            <CopyIcon />
            Copy
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="flex flex-col justify-between p-5 h-28 border border-border bg-surface rounded-xl shadow-sm">
          <span className="text-[10px] font-mono text-t3 uppercase tracking-widest">
            Earned
          </span>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-mono text-accentGreen">
              1,240.50 LPI
            </span>
            <span className="text-xs font-mono text-accentGreen">+12%</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="flex flex-col justify-between p-5 h-28 border border-border bg-surface rounded-xl shadow-sm">
          <span className="text-[10px] font-mono text-t3 uppercase tracking-widest">
            Completions
          </span>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-mono text-t1">42</span>
            <span className="text-xs font-mono text-accentBlue">Stable</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="flex flex-col justify-between p-5 h-28 border border-border bg-surface rounded-xl shadow-sm">
          <span className="text-[10px] font-mono text-t3 uppercase tracking-widest">
            Avg Score
          </span>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-mono text-accentGreen">94.2</span>
            <span className="text-xs font-mono text-accentGreen">+2.4</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="flex flex-col justify-between p-5 h-28 border border-border bg-surface rounded-xl shadow-sm">
          <span className="text-[10px] font-mono text-t3 uppercase tracking-widest">
            Referrals
          </span>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-mono text-t1">08</span>
            <span className="text-xs font-mono text-accentGreen">+1</span>
          </div>
        </div>
      </div>

      {/* Data Layout: Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Col: Active Campaigns */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-[10px] font-mono text-t2 uppercase tracking-widest px-1">
            Active Campaigns
          </h2>

          <div className="space-y-3">
            {/* Campaign 1 */}
            <button className="w-full relative group flex items-center justify-between p-4 border border-border bg-surface hover:bg-elevated/80 transition-colors rounded-xl text-left">
              <div className="flex items-center gap-4">
                <ScoreBadge score={98} size={42} animate={false} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-t1 truncate pr-4">
                    Arbitrum STIP Post-Anal...
                  </span>
                  <span className="text-xs text-t3">240 LPI Reward Pool</span>
                </div>
              </div>
              <ChevronRightIcon className="text-t3 group-hover:text-t1 transition-colors" />
            </button>

            {/* Campaign 2 */}
            <button className="w-full relative group flex items-center justify-between p-4 border border-border bg-surface hover:bg-elevated/80 transition-colors rounded-xl text-left">
              <div className="flex items-center gap-4">
                <ScoreBadge score={82} size={42} animate={false} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-t1 truncate pr-4">
                    ZkSync Era Throughput I...
                  </span>
                  <span className="text-xs text-t3">500 LPI Reward Pool</span>
                </div>
              </div>
              <ChevronRightIcon className="text-t3 group-hover:text-t1 transition-colors" />
            </button>

            {/* Campaign 3 */}
            <button className="w-full relative group flex items-center justify-between p-4 border border-border bg-surface hover:bg-elevated/80 transition-colors rounded-xl text-left">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-[42px] h-[42px] rounded-full border border-border bg-elevated text-[11px] font-mono text-t3">
                  N/A
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-t1 truncate pr-4">
                    EigenLayer Restaking Th...
                  </span>
                  <span className="text-xs text-t3">Bounty: 1.2 ETH</span>
                </div>
              </div>
              <ChevronRightIcon className="text-t3 group-hover:text-t1 transition-colors" />
            </button>
          </div>
        </div>

        {/* Right Col: Earnings History */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-[10px] font-mono text-t2 uppercase tracking-widest px-1">
            Earnings History
          </h2>

          <div className="w-full border border-border bg-elevated/20 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[100px_1fr_120px_80px] gap-4 items-center p-4 py-3 border-b border-border bg-surface/50 text-[10px] font-mono text-t3 uppercase tracking-wider">
              <span>Date</span>
              <span>Campaign</span>
              <span>Reward</span>
              <span>Status</span>
            </div>

            <div className="divide-y divide-border/50">
              {/* Row 1 */}
              <div className="grid grid-cols-[100px_1fr_120px_80px] gap-4 items-center p-4 hover:bg-surface/50 transition-colors">
                <span className="text-xs font-mono text-t3">2023-11-24</span>
                <span className="text-sm font-medium text-t1 truncate">
                  LayerZero Sybil Check
                </span>
                <span className="text-xs font-mono text-accentGreen">
                  120.00 LPI
                </span>
                <div>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-accentGreen/10 text-[9px] font-mono font-medium text-accentGreen uppercase">
                    Paid
                  </span>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-[100px_1fr_120px_80px] gap-4 items-center p-4 hover:bg-surface/50 transition-colors">
                <span className="text-xs font-mono text-t3">2023-11-22</span>
                <span className="text-sm font-medium text-t1 truncate">
                  Blast TVL Narrative
                </span>
                <span className="text-xs font-mono text-accentGreen">
                  450.00 LPI
                </span>
                <div>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-accentAmber/10 text-[9px] font-mono font-medium text-accentAmber uppercase">
                    Pending
                  </span>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-[100px_1fr_120px_80px] gap-4 items-center p-4 hover:bg-surface/50 transition-colors">
                <span className="text-xs font-mono text-t3">2023-11-20</span>
                <span className="text-sm font-medium text-t1 truncate">
                  Solana JUP Liquidity Report
                </span>
                <span className="text-xs font-mono text-accentGreen">
                  12.50 LPI
                </span>
                <div>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-accentRed/10 text-[9px] font-mono font-medium text-accentRed uppercase">
                    Failed
                  </span>
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-[100px_1fr_120px_80px] gap-4 items-center p-4 hover:bg-surface/50 transition-colors">
                <span className="text-xs font-mono text-t3">2023-11-18</span>
                <span className="text-sm font-medium text-t1 truncate">
                  Celestia Staking Dynamics
                </span>
                <span className="text-xs font-mono text-accentGreen">
                  85.00 LPI
                </span>
                <div>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-accentGreen/10 text-[9px] font-mono font-medium text-accentGreen uppercase">
                    Paid
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Score Trend (Full Width) */}
      <div className="w-full relative h-[220px] rounded-xl overflow-hidden border border-border mt-8 group cursor-default">
        {/* The generated wave image spanning the entire card */}
        <Image
          src="/images/wave_background.png"
          alt="Intelligence Score Trend"
          fill
          className="object-cover object-center opacity-60 mix-blend-screen pointer-events-none transition-opacity duration-700 group-hover:opacity-80"
          priority
        />

        {/* Gradient overlays to darken edges and make text readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-surface/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/20 to-transparent pointer-events-none" />

        {/* Text container anchored to bottom left */}
        <div className="absolute bottom-0 left-0 p-6 md:p-8 flex flex-col space-y-1 z-10 w-full sm:max-w-md">
          <h2 className="text-lg md:text-xl font-medium text-t1">
            Intelligence Score Trend
          </h2>
          <p className="text-sm text-t2">
            Your analysis quality is up 14% this month.
          </p>
        </div>
      </div>
    </div>
  );
}
