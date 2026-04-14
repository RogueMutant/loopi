"use client";

import { useState } from "react";

// Faint background data table overlay generator
function FauxTable() {
  const rows = Array.from({ length: 12 });
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none">
      {/* Table Headers */}
      <div className="grid grid-cols-4 gap-4 px-8 py-4 border-b border-border/30 text-[9px] font-mono text-[#1a212a] uppercase">
        <span>Asset_Ident</span>
        <span>Est_FDV</span>
        <span>TGE_Date</span>
        <span className="text-right">Risk_Delta</span>
      </div>
      {/* Table Rows */}
      <div className="flex flex-col">
        {rows.map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-4 gap-4 px-8 py-3 border-b border-border/20 text-[10px] font-mono text-t3/10"
          >
            <span>{["$ZRO", "$L3", "$EIGEN", "$MON"][i % 4]}</span>
            <span>{["1.2B", "900M", "15.4B", "TBA"][i % 4]}</span>
            <span>{["Q3_24", "PENDING", "TBA", "Q4_24"][i % 4]}</span>
            <span className="text-right">0.00</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PremarketPage() {
  const [alertState, setAlertState] = useState<"idle" | "loading" | "success">(
    "idle",
  );
  const [email, setEmail] = useState("");

  const handleSetAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setAlertState("loading");
    // Simulate network delay for effect
    setTimeout(() => {
      setAlertState("success");
    }, 600);
  };

  const tickerItems = [
    "$ZRO: ???",
    "$L3: ???",
    "$EIGEN: ???",
    "$MON: ???",
    "$BERA: ???",
    "$TAO: ???",
    "$ALEPH: ???",
  ];

  // Double the ticker array to ensure seamless marquee looping
  const duplicatedTicker = [
    ...tickerItems,
    ...tickerItems,
    ...tickerItems,
    ...tickerItems,
  ];

  return (
    <div className="mx-auto max-w-6xl w-full flex items-center justify-center min-h-[calc(100vh-140px)] animate-in fade-in duration-500 p-4">
      {/* Main Terminal Card */}
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border flex flex-col border-border bg-surface shadow-2xl">
        {/* Ghost Grid Layer (Obscurity) */}
        <FauxTable />
        <div className="absolute inset-0 backdrop-blur-[6px] bg-surface/60 pointer-events-none" />

        {/* Content Layer */}
        <div className="relative z-10 p-8 md:p-10 flex flex-col min-h-[380px]">
          {/* Top Badge */}
          <div className="absolute top-8 right-8 text-[10px] sm:text-[11px] font-mono text-accentAmber tracking-widest uppercase">
            [ Status: Decrypting Alpha ]
          </div>

          {/* Header Content */}
          <div className="mt-8 sm:mt-4 mb-10">
            <h1 className="text-lg md:text-xl font-sans font-medium text-t1 mb-3">
              Premarket Intelligence Terminal
            </h1>
            <p className="text-sm md:text-base text-t2 max-w-[480px] leading-relaxed">
              Aggregating pre-TGE sentiment and whale movement. Accessing the
              FDV gap before the claim goes live.
            </p>
          </div>

          {/* Signal Alert Form */}
          <form
            onSubmit={handleSetAlert}
            className="mt-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ENTER ACCESS EMAIL..."
              disabled={alertState !== "idle"}
              className="flex-1 bg-transparent border border-border hover:border-border-strong rounded-lg px-4 py-3.5 text-sm font-mono text-t1 placeholder-t3 focus:outline-none focus:border-t2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
            <button
              type="submit"
              disabled={alertState !== "idle"}
              className={`px-8 py-3.5 font-mono text-sm font-medium rounded-lg transition-all duration-300 min-w-[200px] flex items-center justify-center ${
                alertState === "success"
                  ? "bg-accentGreen/10 border border-accentGreen text-accentGreen"
                  : "bg-accentGreen hover:bg-[#00e68f] text-background border border-transparent"
              }`}
            >
              {alertState === "idle" && "SET ALERT"}
              {alertState === "loading" && "PROCESSING..."}
              {alertState === "success" && "> SUCCESS: WALLET_ID_LINKED"}
            </button>
          </form>
        </div>

        {/* Bloomberg Ticker at the absolute bottom of the card */}
        <div className="relative z-10 border-t border-border/50 bg-[#06080a]/50 py-3 overflow-hidden flex whitespace-nowrap">
          {/* Using Tailwind's animate-tick (which is typically a linear slide-left). 
              Will place identical content side-by-side that takes up 200% width so it wraps flawlessly. */}
          <div className="animate-tick flex items-center gap-4 w-max">
            {duplicatedTicker.map((item, i) => (
              <span
                key={i}
                className="text-[10px] font-mono text-t3 opacity-65 mx-4 tracking-widest shrink-0"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
