"use client";

/**
 * PrivyProvider wrapper — must be a client component.
 * Wraps the entire app with PrivyProvider for wallet auth.
 */

import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";

export function PrivyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <BasePrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#00D282",
        },
        loginMethods: ["wallet", "email"],
      }}
    >
      {children}
    </BasePrivyProvider>
  );
}
