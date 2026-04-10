"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

interface ConnectButtonProps {
  variant?: "hero" | "nav";
  className?: string;
}

export function ConnectButton({ variant = "hero", className = "" }: ConnectButtonProps) {
  const { login, authenticated } = usePrivy();
  const router = useRouter();

  const handleAction = () => {
    if (authenticated) {
      router.push("/feed");
    } else {
      login();
    }
  };

  /**
   * Navigation Variant:
   * Used in the top navbar. Smaller, more compact, and no icon.
   */
  if (variant === "nav") {
    return (
      <button 
        onClick={handleAction}
        className={`font-mono text-xs font-medium text-background bg-accentGreen border-none px-[18px] py-[7px] rounded-md cursor-pointer tracking-[-0.01em] hover:bg-[#00e68f] transition-colors ${className}`}
      >
        {authenticated ? "Open dashboard" : "Connect wallet"}
      </button>
    );
  }

  /**
   * Hero Variant (Default):
   * Large, rounded, with an icon and shadow. Used in main landing page actions.
   */
  return (
    <button
      onClick={handleAction}
      className={`w-full sm:w-auto font-mono text-[14px] font-medium bg-accentGreen text-background border-none px-8 py-3.5 rounded-xl cursor-pointer tracking-[-0.01em] hover:bg-[#00e68f] transition-colors shadow-[0_0_20px_rgba(0,210,130,0.15)] flex items-center justify-center gap-2 ${className}`}
    >
      {authenticated ? "Open the feed" : "Connect Wallet"}
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}
