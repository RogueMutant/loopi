"use client";

import { usePrivy, useLogin } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { ArrowRight, Wallet } from "lucide-react";

interface ConnectButtonProps {
  variant?: "hero" | "nav";
  className?: string;
  displayIcon?: boolean;
}

export function ConnectButton({
  variant = "hero",
  className = "",
  displayIcon = true,
}: ConnectButtonProps) {
  const { authenticated, user } = usePrivy();
  const router = useRouter();
  const { login } = useLogin({
    onComplete: ({ wasAlreadyAuthenticated }) => {
      // Only redirect to feed if they just actively logged in, NOT when restoring an existing session on page load
      if (!wasAlreadyAuthenticated) {
        router.push("/feed");
      }
    },
  });

  const handleAction = () => {
    if (authenticated) {
      router.push("/feed");
    } else {
      login();
    }
  };

  if (authenticated) {
    const address = user?.wallet?.address || user?.email?.address || "";
    // Truncate wallet addresses to 0x12..3456
    const shortAddress =
      address.length > 20
        ? `${address.slice(0, 5)}...${address.slice(-4)}`
        : address || "Connected";

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={handleAction}
          className={`font-mono font-medium text-[#00D282] bg-[#0D1117] border-[0.5px] border-[#21262D] cursor-pointer hover:border-[#30363D] transition-colors flex items-center justify-center ${
            variant === "hero"
              ? "text-[14px] px-6 py-3 rounded-xl"
              : "text-[12px] px-3 py-1.5 rounded-md"
          }`}
        >
          {shortAddress}
        </button>
        {displayIcon && (
          <button
            onClick={handleAction}
            className={`flex items-center justify-center bg-[#8B949E] text-[#0D1117] hover:bg-[#C9D1D9] transition-colors cursor-pointer ${
              variant === "hero" ? "p-3 rounded-xl" : "p-1.5 rounded-md"
            }`}
          >
            <Wallet className={variant === "hero" ? "w-5 h-5" : "w-4 h-4"} />
          </button>
        )}
      </div>
    );
  }

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
        Connect wallet
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
      Connect Wallet
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}
