"use client";


import { ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  const previousRoute = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-[#06080A] flex flex-col items-center justify-center p-6 relative overflow-hidden font-mono tracking-tight selection:bg-[#00D282] selection:text-black">
      {/* Subtle background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#00D282 1px, transparent 1px), linear-gradient(90deg, #00D282 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-2xl text-center">
        {/* System Alert Header */}
        <p className="text-[#FF453A] text-[10px] sm:text-xs tracking-[0.3em] uppercase font-bold mb-6">
          System Alert :: Connection Dropped
        </p>

        {/* Large Serif Title */}
        <h1
          className="text-5xl sm:text-7xl lg:text-8xl text-white mb-16 leading-tight tracking-tight"
          style={{
            fontFamily:
              "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
          }}
        >
          <span className="italic font-medium">Error 404:</span> Signal
          <br />
          Lost
        </h1>

        {/* HUD Ring Graphic */}
        <div className="relative flex items-center justify-center mb-16">
          <svg
            className="w-48 h-48 sm:w-56 sm:h-56 animate-[spin_30s_linear_infinite]"
            viewBox="0 0 100 100"
            fill="none"
          >
            {/* Outer dashed ring */}
            <circle
              cx="50"
              cy="50"
              r="48"
              stroke="#FF453A"
              strokeWidth="1.5"
              strokeDasharray="14 8"
              opacity="0.8"
            />
            {/* Inner faint ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#21262D"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[#FF453A] text-2xl sm:text-3xl tracking-[0.2em] font-light mb-1">
              0 0
            </span>
            <span className="text-[#7D8590] text-[8px] sm:text-[9px] tracking-[0.4em] uppercase">
              Intelligence Index
            </span>
          </div>
        </div>

        {/* Terminal Error Block */}
        <div className="bg-[#0D1117] border border-[#21262D] rounded-lg p-5 sm:p-6 mb-10 max-w-lg text-left relative shadow-2xl flex items-start gap-3">
          <button className="absolute top-3 right-3 text-[#7D8590] hover:text-[#C9D1D9] transition-colors">
            <X className="w-3 h-3" />
          </button>
          <div className="flex-1 text-[13px] leading-relaxed text-[#8B949E]">
            <span className="text-[#FF453A] font-semibold">
              DATA_PACKET_NOT_FOUND.
            </span>{" "}
            The requested intelligence fragment does not exist in the current
            ledger or has been redacted. Check your hash or return to a valid
            entry point.
          </div>
        </div>

        {/* Call to Action */}
        <button
          onClick={previousRoute}
          className="group relative flex items-center gap-3 px-8 py-3 text-[13px] font-medium text-[#00D282] uppercase tracking-widest overflow-hidden transition-all hover:bg-[#00D282] hover:text-black border border-[#00D282]"
        >
          <span className="relative z-10 transition-transform group-hover:-translate-x-1">
            Return to Terminal
          </span>
          <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" />
        </button>

        {/* Session ID */}
        <div className="mt-16 text-[#484F58] text-[9px] sm:text-[10px] tracking-[0.3em] uppercase">
          Session ID: LP-992-ERR-SYNC
        </div>
      </div>
    </div>
  );
}
