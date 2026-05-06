import type { Metadata } from "next";
import LetterGlitch from "@/components/quiz-funnel/LetterGlitch";
import "./quiz-funnel.css";

export const metadata: Metadata = {
  title: "THE SYNDICATE",
  description: "Syndicate sovereign entity audit funnel.",
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="quiz-funnel-root">
      <div className="global-letter-glitch">
        <LetterGlitch
          glitchColors={["#24345f", "#2dc6e8", "#be992e"]}
          glitchSpeed={55}
          centerVignette
          outerVignette
          smooth
        />
      </div>
      <div className="global-app-layer">{children}</div>
    </div>
  );
}
