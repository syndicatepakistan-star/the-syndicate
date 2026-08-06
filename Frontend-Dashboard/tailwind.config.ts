import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      screens: {
        /** Dell Vostro 1080p @ ~125% Windows scale (~1536px) — does not affect mobile, iPad, or ≥1680 desktops */
        laptop: { min: "1400px", max: "1679px" },
      },
      keyframes: {
        "hud-bob": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
      },
      animation: {
        "hud-bob": "hud-bob 2.2s ease-in-out infinite",
      },
      fontFamily: {
        /** Paragraph / UI body — CS Daine Mono */
        sans: ["CS Daine Mono", "ui-monospace", "monospace"],
        /** Titles / headings — Thryon */
        heading: ["Thryon", "Thyron", "ui-sans-serif", "system-ui", "sans-serif"],
        /** Digits + code — CS Daine Mono */
        mono: ["CS Daine Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
