"use client";

/**
 * TopBar — Sticky top navigation bar.
 * Full-width. Wordmark left (mobile), tabs center-right, wallet pill far right.
 */

import { usePathname } from "next/navigation";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";

const TABS = [
  { label: "Feed", href: "/feed" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Squad", href: "/squad" },
  { label: "Pre-market", href: "/pre-market" },
];

export function TopBar() {
  const pathname = usePathname();
  const { ready, authenticated, user, login, logout } = usePrivy();

  const walletAddress = user?.wallet?.address;
  const shortAddress = walletAddress
    ? `0x...${walletAddress.slice(-4)}`
    : null;

  return (
    <header
      className="sticky top-0 z-50 w-full h-[52px] bg-[#050D09]
        border-b-[0.5px] border-[#21262D] flex items-center px-5"
    >
      {/* Wordmark — visible on mobile when sidebar is collapsed */}
      <span
        className="md:hidden text-[18px] font-semibold text-[#00D282] mr-4"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        Loopi
      </span>

      {/* Desktop wordmark */}
      <span
        className="hidden md:inline text-[18px] font-semibold text-[#00D282] mr-8"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        Loopi
      </span>

      {/* Tab links */}
      <nav className="hidden md:flex items-center gap-8 flex-1">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href === "/feed" && pathname === "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`text-[14px] transition-colors duration-100
                ${isActive ? "text-[#00D282] font-medium" : "text-[#7D8590] hover:text-[#C9D1D9]"}`}
              style={{ fontFamily: "var(--font-geist)" }}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Spacer on mobile */}
      <div className="flex-1 md:hidden" />

      {/* Wallet pill */}
      <div className="ml-auto">
        {ready && authenticated && shortAddress ? (
          <button
            onClick={() => logout()}
            aria-label="Wallet account"
            className="flex items-center gap-2 px-[14px] py-[6px] rounded-[20px]
              text-[13px] border-[0.5px]
              bg-[rgba(88,166,255,0.08)] border-[#58A6FF] text-[#E8F4FF]
              hover:bg-[rgba(88,166,255,0.14)] transition-colors duration-150"
            style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
          >
            <span className="w-[6px] h-[6px] rounded-full bg-[#00D282]" />
            {shortAddress}
          </button>
        ) : (
          <button
            onClick={() => login()}
            aria-label="Connect wallet"
            className="flex items-center px-[14px] py-[6px] rounded-[20px]
              text-[13px] font-medium border-[0.5px]
              bg-[#00D28218] border-[#00D28244] text-[#00D282]
              hover:bg-[#00D28228] transition-colors duration-150"
            style={{ fontFamily: "var(--font-geist)" }}
          >
            Connect wallet
          </button>
        )}
      </div>
    </header>
  );
}
