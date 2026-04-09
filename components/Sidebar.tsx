"use client";

/**
 * Sidebar — Fixed left navigation panel.
 * 240px on desktop, collapses to bottom tab bar on mobile (<768px).
 */

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutGrid, Grid2X2, Users, Timer } from "lucide-react";
import type { ReactNode } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Feed", href: "/feed", icon: <LayoutGrid size={18} /> },
  { label: "Dashboard", href: "/dashboard", icon: <Grid2X2 size={18} /> },
  { label: "Squad", href: "/squad", icon: <Users size={18} /> },
  { label: "Pre-market", href: "/pre-market", icon: <Timer size={18} /> },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0
          w-[240px] bg-[#050D09] border-r-[0.5px] border-[#21262D] z-40"
      >
        {/* Wordmark */}
        <div className="px-5 pt-6 pb-2">
          <h1
            className="text-[22px] font-semibold text-[#00D282] leading-tight"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Loopi Intelligence
          </h1>
          <p
            className="text-[12px] text-[#7D8590] mt-0.5"
            style={{ fontFamily: "var(--font-geist)" }}
          >
            The Sovereign Analyst
          </p>
        </div>

        {/* Spacer */}
        <div className="h-6" />

        {/* Nav items */}
        <nav className="flex-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/feed" && pathname === "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`flex items-center gap-2 w-full h-[44px] px-3 mb-0.5
                  text-[14px] transition-colors duration-100
                  ${
                    isActive
                      ? "bg-[#161B22] text-[#E8F4FF] border-l-[3px] border-l-[#00D282] rounded-r-[8px] rounded-l-none"
                      : "text-[#7D8590] hover:bg-[#0D1117] rounded-[8px]"
                  }`}
                style={{ fontFamily: "var(--font-geist)" }}
              >
                <span className={isActive ? "text-[#00D282]" : "text-[#7D8590]"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Market Status widget */}
        <div className="px-4 pb-4">
          <div
            className="bg-[#0D1117] border-[0.5px] border-[#21262D] rounded-[10px] p-3"
          >
            <p
              className="text-[11px] uppercase tracking-[0.08em] text-[#7D8590] mb-2"
              style={{ fontFamily: "var(--font-geist)" }}
            >
              MARKET STATUS
            </p>
            <div className="flex items-center justify-between">
              <span
                className="text-[13px] text-[#C9D1D9]"
                style={{ fontFamily: "var(--font-geist)" }}
              >
                Volatility Index
              </span>
              <span
                className="text-[12px] font-medium text-[#00D282]"
                style={{ fontFamily: "var(--font-geist)" }}
              >
                {/* TODO: fetch real volatility index */}
                Low
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-[56px] bg-[#050D09]
          border-t-[0.5px] border-[#21262D] z-50 flex items-center justify-around px-2"
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/feed" && pathname === "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`flex flex-col items-center gap-0.5 text-[10px] py-1 px-3
                ${isActive ? "text-[#00D282]" : "text-[#7D8590]"}`}
              style={{ fontFamily: "var(--font-geist)" }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
