import Link from "next/link";
import BrandHeader from "@/components/quiz-funnel/BrandHeader";
import { GamingBenefitCards } from "@/components/GamingBenefitCards";

const WILL_GET_ITEMS = [
  {
    tone: "cyan",
    title: "Mindset Training",
    desc: "Two guides to build the mental toughness you need for business.",
  },
  {
    tone: "violet",
    title: "Full Diagnosis",
    desc: "Your personal profile, your main weakness, and how to fix it.",
  },
  {
    tone: "gold",
    title: "Strengths Check",
    desc: "See what you do best and where you need help.",
  },
  {
    tone: "pink",
    title: "Business Match",
    desc: "Find a way to make money that actually fits your skills.",
  },
  {
    tone: "amber",
    title: "Mistake Finder",
    desc: "Spot the hidden habits keeping you stuck.",
  },
  {
    tone: "green",
    title: "Exit Blueprint",
    desc: "A realistic plan to leave the 9-to-5 trap behind.",
  },
] as const;

export default function QuizFunnelLandingPage() {
  return (
    <main className="page-wrap">
      <section className="card card-landing">
        <BrandHeader />
        <h2 className="section-title public-heading-lightning public-heading-lightning--violet">
          The 17 Point Audit that predicts Business Success
        </h2>
        <p className="section-subtitle">
          Most people in the hood have the engine, but they are driving in circles. You are either a
          System Asset or a System Liability. This 17-point Audit exposes the &quot;viruses&quot; in your
          psychology and identifies the exact &quot;Digital Weapon&quot; you need to build your War Chest.
        </p>
        <div className="landing-details-grid">
          <div className="landing-detail-card landing-detail-card--cyan landing-detail-frame-bracket">
            <h3>What You Unlock</h3>
            <p>
              A full tactical diagnosis with designation, fatal flaw, and a personalized
              execution prescription aligned to your profile.
            </p>
          </div>
          <div className="landing-detail-card landing-detail-card--violet landing-detail-frame-double">
            <h3>How It Works</h3>
            <p>
              Answer 17 strategic audit questions, get scored instantly, and receive a custom
              blueprint that maps your next moves with precision.
            </p>
          </div>
          <div className="landing-detail-card landing-detail-card--gold landing-detail-frame-rail">
            <h3>Built For Operators</h3>
            <p>
              This is not generic motivation. It is a tactical report focused on leverage,
              execution, and system-level growth.
            </p>
          </div>
        </div>
        <GamingBenefitCards
          className="mx-auto mt-3 mb-4 w-full max-w-full sm:mt-4"
          headingId="landing-will-get-heading"
          title="What You Will Get"
          titleLightning="cyan"
          frameTone="green"
          items={WILL_GET_ITEMS}
        />
        <p className="section-subtitle">
          <strong>Inside Your Report:</strong> Score out of 170, designation analysis, detected
          virus breakdown, recommended skill track, and a direct call-to-action to execute fast.
        </p>
        <Link href="/quiz/questions">
          <button type="button" className="btn btn-primary">
            START DIAGNOSIS
          </button>
        </Link>
      </section>
    </main>
  );
}
