import type { Metadata } from "next";
import DeferredLetterGlitch from "@/components/quiz-funnel/DeferredLetterGlitch";
import { DeferredQuizFunnelCss } from "@/components/quiz-funnel/DeferredQuizFunnelCss";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "The Syndicate Diagnosis",
  description:
    "Take The Syndicate Diagnosis — a short quiz to find your operator path, program fit, and next step inside the Syndicate ecosystem.",
  path: "/quiz",
});

/**
 * Critical landing CSS so heading + CTA paint before deferred quiz-funnel.css (~100KB).
 */
const QUIZ_LCP_CRITICAL_CSS = `
.quiz-funnel-root{position:relative;min-height:100dvh;background:#050814;color:#fff;overflow-x:clip}
.quiz-funnel-root .global-letter-glitch{position:fixed;inset:0;z-index:0;pointer-events:none}
.quiz-funnel-root .global-app-layer{position:relative;z-index:1}
.quiz-funnel-root .page-wrap{width:100%;max-width:52rem;margin:0 auto;padding:1.25rem 1rem 3rem}
.quiz-funnel-root .card-landing{position:relative;border-radius:1.25rem;border:1px solid rgba(45,198,232,.28);background:rgba(2,6,16,.72);padding:1.25rem 1rem 1.5rem}
.quiz-funnel-root .brand-header{display:flex;flex-direction:column;align-items:center;gap:.75rem;text-align:center;margin-bottom:1rem}
.quiz-funnel-root .brand-title{margin:0;font-size:clamp(1.35rem,5.2vw,2.1rem);font-weight:900;letter-spacing:.06em;line-height:1.15;text-transform:uppercase;color:#e9d5ff}
.quiz-funnel-root .section-title{margin:.5rem 0 0;font-size:clamp(1.05rem,4.2vw,1.45rem);font-weight:800;line-height:1.25;text-align:center;color:#ddd6fe}
.quiz-funnel-root .landing-free-offer{margin:.85rem 0 0;text-align:center;font-weight:700;color:#fbbf24}
.quiz-funnel-root .landing-free-note{margin:.35rem 0 0;text-align:center;font-size:.85rem;color:rgba(226,232,240,.75)}
.quiz-funnel-root .btn-primary,.quiz-funnel-root .landing-top-start-btn{display:inline-flex;align-items:center;justify-content:center;min-height:3rem;padding:.85rem 1.4rem;border-radius:999px;border:1px solid rgba(56,189,248,.55);background:linear-gradient(180deg,#22d3ee,#0284c7);color:#04101a;font-weight:900;letter-spacing:.08em;text-transform:uppercase;text-decoration:none}
.quiz-funnel-root .landing-top-start-wrap{display:flex;justify-content:center;margin:1.25rem 0}
.quiz-funnel-root .quiz-featured-in{margin:1rem 0;text-align:center}
.quiz-funnel-root .brand-logo{width:auto;height:auto;max-width:160px}
`;

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="quiz-funnel-root">
      <style dangerouslySetInnerHTML={{ __html: QUIZ_LCP_CRITICAL_CSS }} />
      <DeferredQuizFunnelCss />
      <div className="global-letter-glitch">
        <div className="quiz-glitch-placeholder" aria-hidden />
        <DeferredLetterGlitch
          glitchColors={["#24345f", "#2dc6e8", "#be992e"]}
          glitchSpeed={55}
          centerVignette
          outerVignette
          smooth
          className="quiz-glitch-canvas"
        />
      </div>
      <div className="global-app-layer">{children}</div>
    </div>
  );
}
