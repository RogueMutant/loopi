import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

// ─── Dashboard Layout ─────────────────────────────────────────────────────────
// Wraps all authenticated/app pages with Sidebar + TopBar chrome.
// This layout applies to /feed, /campaign/[id], /dashboard, etc.

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Sidebar (desktop) + bottom tab bar (mobile) */}
      <Sidebar />

      {/* Main area — offset by sidebar width on desktop */}
      <div className="md:ml-[240px] min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1 px-5 md:px-8 py-6 pb-[80px] md:pb-6">
          {children}
        </main>
      </div>
    </>
  );
}
