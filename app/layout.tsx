import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// ─── Fonts ────────────────────────────────────────────────────────────────────

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist",
  weight: "100 900",
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Loopi — Crypto Intelligence Platform",
  description:
    "Loopi scores Web3 bounty campaigns, infofi programs, and on-chain drops by expected ROI. The sovereign analyst for crypto intelligence.",
};

// ─── Root Layout ──────────────────────────────────────────────────────────────
// Minimal shell — fonts, global CSS, and base HTML structure only.
// Dashboard pages get Sidebar/TopBar via the (dashboard)/layout.tsx group layout.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geist.variable} antialiased bg-[#050D09] text-[#E8F4FF]`}
        style={{ fontFamily: "var(--font-geist)" }}
      >
        {children}
      </body>
    </html>
  );
}
