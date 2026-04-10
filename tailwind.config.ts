import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050D09",
        foreground: "#E8F4FF",
        surface: "#0D1117",
        elevated: "#161B22",
        border: "#21262D",
        "border-strong": "#30363D",
        accentGreen: "#00D282",
        accentBlue: "#58A6FF",
        accentAmber: "#D2991F",
        accentRed: "#F85149",
        t1: "#E8F4FF",
        t2: "#C9D1D9",
        t3: "#7D8590",
      },
      fontFamily: {
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        mono: ['"IBM Plex Mono"', '"Courier New"', "monospace"],
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
      },
      keyframes: {
        tick: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        tick: "tick 80s linear infinite",
        "tick-slow": "tick 110s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
