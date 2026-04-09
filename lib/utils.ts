/**
 * Loopi Utility Functions
 * ───────────────────────
 * Score color helpers, date formatters, chain color map, urgency check.
 */

// ─── Score color thresholds ───────────────────────────────────────────────────

export function getScoreColor(score: number): string {
  if (score >= 75) return "#00D282";
  if (score >= 40) return "#D2991F";
  return "#F85149";
}

// ─── Date formatting ─────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatDeadline(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

// ─── Reward formatting ───────────────────────────────────────────────────────

export function formatReward(usd: number): string {
  return `$${usd.toLocaleString("en-US")}`;
}

// ─── Chain colors ─────────────────────────────────────────────────────────────

const CHAIN_COLORS: Record<string, string> = {
  solana: "#9945FF",
  arbitrum: "#12AAFF",
  ethereum: "#627EEA",
  base: "#0052FF",
};

export function getChainColor(chain: string): string {
  return CHAIN_COLORS[chain.toLowerCase()] ?? "#7D8590";
}

export function getChainName(chain: string): string {
  return chain.toUpperCase();
}

// ─── Urgency check ────────────────────────────────────────────────────────────

export function isUrgent(deadline: string): boolean {
  const msRemaining = new Date(deadline).getTime() - Date.now();
  const hoursRemaining = msRemaining / (1000 * 60 * 60);
  return hoursRemaining > 0 && hoursRemaining < 72;
}

// ─── Type chip colors ─────────────────────────────────────────────────────────

export interface ChipStyle {
  bg: string;
  text: string;
  border: string;
}

export function getTypeChipStyle(type: string): ChipStyle {
  switch (type) {
    case "bounty":
      return {
        bg: "rgba(0,210,130,0.12)",
        text: "#00D282",
        border: "rgba(0,210,130,0.25)",
      };
    case "infofi":
      return {
        bg: "rgba(88,166,255,0.12)",
        text: "#58A6FF",
        border: "rgba(88,166,255,0.25)",
      };
    case "onchain":
      return {
        bg: "rgba(210,153,34,0.12)",
        text: "#D2991F",
        border: "rgba(210,153,34,0.25)",
      };
    default:
      return {
        bg: "rgba(125,133,144,0.12)",
        text: "#7D8590",
        border: "rgba(125,133,144,0.25)",
      };
  }
}

export const URGENT_CHIP_STYLE: ChipStyle = {
  bg: "rgba(248,81,73,0.10)",
  text: "#F85149",
  border: "rgba(248,81,73,0.2)",
};

// ─── Type label formatting ───────────────────────────────────────────────────

export function getTypeLabel(type: string): string {
  switch (type) {
    case "bounty":
      return "BOUNTY";
    case "infofi":
      return "INFOFI";
    case "onchain":
      return "ON-CHAIN";
    default:
      return type.toUpperCase();
  }
}
