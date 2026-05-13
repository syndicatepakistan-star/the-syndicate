import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
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
        sans: ['"CS Daine Mono"', "ui-monospace", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["Thryon", "Thyron", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      }
    }
  },
  plugins: []
} satisfies Config;

