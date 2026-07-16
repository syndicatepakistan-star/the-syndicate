import Link from "next/link";
import { CyberChamferFrame } from "@/components/cyber/CyberChamferFrames";
import BrandHeader from "@/components/quiz-funnel/BrandHeader";
import { QuizPressLogosStrip } from "@/components/quiz-funnel/QuizPressLogosStrip";

export default function QuizFunnelLandingPage() {
  return (
    <main className="page-wrap">
      <section className="card card-landing">
        <BrandHeader />
        <h2 className="section-title public-heading-lightning public-heading-lightning--violet">
          The 17 Point Audit that predicts Business Success
        </h2>
        <p className="landing-free-offer public-heading-lightning public-heading-lightning--gold">
          You get all of these benefits for free and 4 free programmes worth $396
        </p>
        <p className="landing-free-note">No strings attached. No hidden fees. No hidden obligations.</p>
        <div className="landing-top-start-wrap">
          <Link href="/quiz/questions" prefetch={false} className="landing-top-start-link">
            <span className="btn btn-primary landing-top-start-btn">START DIAGNOSIS</span>
          </Link>
        </div>

        <div className="landing-details-grid">
          <CyberChamferFrame
            accent="cyan"
            chamfer={22}
            className="landing-detail-unlock-frame w-full"
            innerClassName="h-full p-0"
            contentClassName="h-full max-lg:!p-0"
            decorSize="compact"
          >
            <div className="landing-detail-card landing-detail-card--cyan h-full">
              <h3>What You Unlock</h3>
              <ol className="landing-detail-list landing-detail-list--numbered">
                <li>
                  <strong>Your Full Diagnosis Check</strong>
                  <span>Discover what you do best and get matched with the business model that fits you.</span>
                </li>
                <li>
                  <strong>Your True Strength</strong>
                  <span>Find what you are naturally gifted at and learn how to turn it into a business.</span>
                </li>
                <li>
                  <strong>The Perfect Business Model</strong>
                  <span>
                    Match your natural business personality with the right model instead of wasting money on ideas that
                    do not suit you.
                  </span>
                </li>
                <li>
                  <strong>Real-World Business Models</strong>
                  <span>Choose from 11 practical online business models matched to your strengths and budget.</span>
                </li>
                <li>
                  <strong>Low-Cost Business Models</strong>
                  <span>Receive safer, lower-cost options you can start today and reduce the risk of losing money.</span>
                </li>
                <li>
                  <strong>Your Business Path</strong>
                  <span>
                    Get a fast-track blueprint that uses your natural talents and helps you work toward earning your
                    first dollar.
                  </span>
                </li>
                <li>
                  <strong>Your Growth Plan</strong>
                  <span>Follow a simple plan designed around two focused hours a day.</span>
                </li>
                <li>
                  <strong>The Exact Next Step</strong>
                  <span>Replace confusion with a clear and simple blueprint for what to do tomorrow.</span>
                </li>
              </ol>
            </div>
          </CyberChamferFrame>

          <QuizPressLogosStrip />

          <div className="landing-detail-pair-row">
            <div className="landing-detail-card landing-detail-card--violet landing-detail-frame-double">
              <h3>How It Works</h3>
              <ol className="landing-detail-list landing-detail-list--steps">
                <li>
                  <strong>Remove the Guessing</strong>
                  <span>Answer 17 easy questions to discover what has been holding you back.</span>
                </li>
                <li>
                  <strong>Remove the Confusion</strong>
                  <span>Receive an online business model matched to your natural business instincts.</span>
                </li>
                <li>
                  <strong>Get the Blueprint</strong>
                  <span>Leave with a proven and safer real-world business model you can start building.</span>
                </li>
              </ol>
            </div>

            <div className="landing-detail-card landing-detail-card--gold landing-detail-frame-rail">
              <h3>Built For Operators</h3>
              <ul className="landing-detail-list landing-detail-list--bullets">
                <li>
                  <strong>Real-World Action</strong>
                  <span>Receive actionable, step-by-step instructions that work in the real world.</span>
                </li>
                <li>
                  <strong>Professional Direction</strong>
                  <span>Build a highly respected, professional business you can be proud of.</span>
                </li>
                <li>
                  <strong>Long-Term Value</strong>
                  <span>Focus your effort on building something real that can last for years.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <Link href="/quiz/questions" prefetch={false}>
          <span className="btn btn-primary">START DIAGNOSIS</span>
        </Link>
      </section>
    </main>
  );
}
