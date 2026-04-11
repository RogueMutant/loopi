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

import { Instrument_Serif, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { PrivyWrapper } from "@/components/PrivyWrapper";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geist.variable} ${instrumentSerif.variable} ${ibmPlexMono.variable} ${spaceGrotesk.variable} antialiased bg-[#050D09] text-[#E8F4FF]`}
        style={{ fontFamily: "var(--font-geist)" }}
      >
        <PrivyWrapper>
          {children}
        </PrivyWrapper>
      </body>
    </html>
  );
}

