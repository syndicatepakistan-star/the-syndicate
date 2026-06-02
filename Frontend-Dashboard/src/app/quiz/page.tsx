import Link from "next/link";
import BrandHeader from "@/components/quiz-funnel/BrandHeader";

export default function QuizFunnelLandingPage() {
  return (
    <main className="page-wrap">
      <section className="card card-landing">
        <BrandHeader />
        <h2 className="section-title public-heading-lightning public-heading-lightning--violet">
          THE SYSTEM HAS A FILE ON YOU. IT&apos;S TIME YOU HAD THE FILE ON THE SYSTEM.
        </h2>
        <p className="section-subtitle">
          Most people from the struggle have the engine, but they are driving in circles. You are
          either a System Asset or a System Liability. This 17-point Audit exposes the &quot;viruses&quot;
          in your psychology and identifies the exact &quot;Digital Weapon&quot; you need to build your War
          Chest.
        </p>
        <div className="landing-details-grid">
          <div className="landing-detail-card">
            <h3>What You Unlock</h3>
            <p>
              A full Project Obsidian diagnosis with designation, fatal flaw, and a personalized
              execution prescription aligned to your profile.
            </p>
          </div>
          <div className="landing-detail-card">
            <h3>How It Works</h3>
            <p>
              Answer 17 strategic audit questions, get scored instantly, and receive a custom
              blueprint that maps your next moves with precision.
            </p>
          </div>
          <div className="landing-detail-card">
            <h3>Built For Operators</h3>
            <p>
              This is not generic motivation. It is a tactical report focused on leverage,
              execution, and system-level growth.
            </p>
          </div>
        </div>
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
