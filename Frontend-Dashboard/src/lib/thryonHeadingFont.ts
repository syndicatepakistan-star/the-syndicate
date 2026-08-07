import localFont from "next/font/local";

/**
 * Thryon for “What You Get” / “Plus You Get”.
 * Best match vs git era 191bd21–5652e51 (body was Thryon → headings inherited it).
 * JetBrains Mono has a normal A — does not match the cyberpunk multi-line A.
 * Single master weight: keep 400 + font-synthesis:none (faux-bold fills the strokes).
 */
export const thryonHeadingFont = localFont({
  src: [
    {
      path: "../assets/fonts/Thryon.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/Thryon.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Thryon", "Thyron", "ui-sans-serif", "system-ui", "sans-serif"],
});
