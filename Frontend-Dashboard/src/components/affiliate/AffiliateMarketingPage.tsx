"use client";

import Image from "next/image";
import Link from "next/link";
import { NavApp } from "@/components/NavApp";
import SiteFooter from "@/components/SiteFooter";
import { CyberChamferFrame, CyberInsetPanel, cx } from "@/components/cyber/CyberChamferFrames";
import type { CyberFrameAccent } from "@/components/cyber/CyberChamferFrames";
import { AFFILIATE_LOGIN_HREF } from "@/lib/affiliateSession";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";

type ShowcaseAccent = Extract<CyberFrameAccent, "cyan" | "violet" | "amber">;

const SHOWCASE = [
  {
    src: "/assets/affiliate-page/01-affiliate-dashboard.png",
    width: 1024,
    height: 335,
    accent: "cyan" as const satisfies ShowcaseAccent,
    title: "Affiliate dashboard — revenue on glass",
    body: "Your dashboard is your operational command centre. Every critical metric is visible: referral performance, lead activity, conversion movement, revenue generation, earnings status. No hidden layers. No confusing reports. Everything you need to understand your position is placed directly in front of you.",
  },
  {
    src: "/assets/affiliate-page/02-referrals-board.png",
    width: 1024,
    height: 512,
    accent: "violet" as const satisfies ShowcaseAccent,
    title: "Referrals board — every dossier tagged",
    body: "Every referral becomes a tracked record. Review who entered through your network, who completed registration, who converted into a buyer, what revenue was generated, and what commission belongs to you. The referrals board is your evidence layer — a complete record of your influence and execution.",
  },
  {
    src: "/assets/affiliate-page/03-referrals-feed.png",
    width: 1024,
    height: 388,
    accent: "amber" as const satisfies ShowcaseAccent,
    title: "Paged lead feed — subscription + earning split",
    body: "Growth creates volume. As your network expands, your lead feed becomes your operational archive. Every entry shows activity status, conversion stage, purchase movement, and commission outcome. Clear visibility. Clean intelligence. The system scales with your ambition.",
  },
  {
    src: "/assets/affiliate-page/04-conversion-formula.png",
    width: 988,
    height: 735,
    accent: "cyan" as const satisfies ShowcaseAccent,
    title: "Conversion formula — numbers on the table",
    body: "Real operators understand numbers. The conversion system reveals the mechanics behind your performance: traffic, engagement, conversion, revenue. No mystery calculations. The formula is visible because control requires understanding.",
  },
  {
    src: "/assets/affiliate-page/05-withdraw-airlock.png",
    width: 894,
    height: 730,
    accent: "violet" as const satisfies ShowcaseAccent,
    title: "Withdraw rails — bank fields under lock",
    body: "Your earnings remain protected behind controlled withdrawal access. The system manages available balance, withdrawal limits, payment information, and processing status. Your results are tracked. Your withdrawals are controlled. When the threshold is reached, the value you created becomes accessible.",
  },
] as const;

type ShowcaseLayout = "wide" | "standard" | "tall";

function showcaseLayout(width: number, height: number): ShowcaseLayout {
  const aspect = width / height;
  if (aspect > 2.1) return "wide";
  if (aspect < 1.45) return "tall";
  return "standard";
}

/** Min height for the image frame — taller on laptop+ so UI screenshots stay readable. */
function showcaseFrameMinHeight(layout: ShowcaseLayout): string {
  switch (layout) {
    case "wide":
      return "min-h-[clamp(11rem,34vh,16rem)] md:min-h-[clamp(13rem,38vh,20rem)] lg:min-h-[clamp(15rem,40vh,22rem)] xl:min-h-[clamp(16rem,42vh,24rem)]";
    case "tall":
      return "min-h-[clamp(16rem,52vh,28rem)] md:min-h-[clamp(22rem,58vh,38rem)] lg:min-h-[clamp(28rem,68vh,46rem)] xl:min-h-[clamp(32rem,72vh,52rem)]";
    default:
      return "min-h-[clamp(13rem,42vh,22rem)] md:min-h-[clamp(18rem,50vh,30rem)] lg:min-h-[clamp(22rem,58vh,38rem)] xl:min-h-[clamp(24rem,62vh,42rem)]";
  }
}

function showcaseImageMaxHeight(layout: ShowcaseLayout): string {
  switch (layout) {
    case "wide":
      return "max-h-[clamp(11rem,40vw,22rem)] md:max-h-[clamp(13rem,44vh,28rem)] lg:max-h-[clamp(15rem,46vh,30rem)] xl:max-h-[clamp(16rem,48vh,32rem)]";
    case "tall":
      return "max-h-[clamp(16rem,54vw,30rem)] md:max-h-[clamp(22rem,62vh,42rem)] lg:max-h-[clamp(30rem,72vh,50rem)] xl:max-h-[clamp(34rem,76vh,56rem)]";
    default:
      return "max-h-[clamp(13rem,46vw,26rem)] md:max-h-[clamp(18rem,54vh,36rem)] lg:max-h-[clamp(24rem,64vh,44rem)] xl:max-h-[clamp(26rem,68vh,48rem)]";
  }
}

export default function AffiliateMarketingPage() {
  return (
    <div className="relative min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-[#04060c]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <video className="absolute inset-0 h-full w-full object-cover opacity-25" autoPlay muted loop playsInline>
          <source src="/assets/video.mp4" type="video/mp4" />
        </video>
        <div className="absolute left-[-10%] top-[8%] h-[min(400px,70vw)] w-[min(400px,70vw)] rounded-full bg-cyan-400/18 blur-[clamp(80px,18vw,140px)]" />
        <div className="absolute right-[-12%] top-[14%] h-[min(440px,72vw)] w-[min(440px,72vw)] rounded-full bg-violet-500/20 blur-[clamp(90px,20vw,150px)]" />
        <div className="absolute left-[36%] top-[54%] h-[min(500px,80vw)] w-[min(500px,80vw)] rounded-full bg-rose-500/10 blur-[clamp(100px,22vw,160px)]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(34,211,238,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.2)_1px,transparent_1px),linear-gradient(rgba(167,139,250,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.14)_1px,transparent_1px)] [background-size:74px_74px,74px_74px,18px_18px,18px_18px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(56,189,248,0.1),transparent_58%),radial-gradient(ellipse_90%_80%_at_50%_100%,rgba(244,63,94,0.11),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040816]/74 via-[#05040c]/88 to-[#020208]/96" />
      </div>

      <NavApp />

      <div className="affiliate-page-login-fab pointer-events-none fixed left-[max(0.75rem,env(safe-area-inset-left))] top-[max(4.5rem,calc(env(safe-area-inset-top)+3.75rem))] z-[55] sm:left-5">
        <Link
          href={AFFILIATE_LOGIN_HREF}
          prefetch
          className="affiliate-page-login-fab__btn cta-nav-button pointer-events-auto whitespace-nowrap text-xs font-semibold sm:text-sm"
        >
          Affiliate login
        </Link>
      </div>

      <section className="relative z-10 px-[clamp(0.75rem,3vw,2.2rem)] pb-[clamp(2rem,6vw,2.75rem)] pt-[clamp(4.75rem,12vw,6.75rem)] sm:pt-[clamp(5.5rem,10vw,6.65rem)]">
        <div className="mx-auto w-full max-w-[min(96rem,100%)]">
          <CyberChamferFrame
            accent="hero"
            chamfer={24}
            hideOuterRing
            className="min-h-[clamp(18rem,52vh,34rem)]"
            innerClassName="p-[clamp(1.25rem,4vw,3rem)]"
          >
            <div className="mx-auto max-w-[min(56rem,100%)] text-center">
              <h1
                className={`font-heading public-heading-lightning public-heading-lightning--cyan text-[clamp(1.75rem,5.5vw,3.6rem)] font-black uppercase leading-[0.95] tracking-[0.08em] sm:tracking-[0.1em]`}
              >
                Turn attention into withdrawals
              </h1>
              <p className="mx-auto mt-[clamp(1rem,3vw,1.5rem)] max-w-3xl text-[clamp(0.9rem,2.2vw,1.05rem)] leading-relaxed text-zinc-100/88 sm:text-lg">
                Attention is only valuable when it creates movement. Deploy your Syndicate referral link and transform your audience into a measurable growth engine. Every journey is tracked: clicks, leads, purchases, commissions. You do not guess. You do not hope. You operate through data. The Affiliate Programme gives you visibility into the entire chain, allowing you to refine your strategy, strengthen your influence, and build a revenue stream based on execution.
              </p>
            </div>
          </CyberChamferFrame>
        </div>
      </section>

      <div className="relative z-10 space-y-[clamp(1.75rem,5vw,3rem)] px-[clamp(0.75rem,3vw,2.2rem)] pb-[clamp(2.5rem,8vw,5rem)]">
        <div className="mx-auto w-full max-w-[min(96rem,100%)] space-y-[clamp(1.75rem,5vw,3rem)]">
          {SHOWCASE.map((block, i) => {
            const layout = showcaseLayout(block.width, block.height);
            return (
            <CyberChamferFrame
              key={block.src}
              accent={block.accent}
              chamfer={22}
              className="mx-auto w-full min-w-0"
              innerClassName="p-[clamp(1rem,3.5vw,2.5rem)]"
            >
              <div
                className={cx(
                  "grid min-w-0 items-center gap-[clamp(1.25rem,4vw,3rem)]",
                  "grid-cols-1",
                  "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.28fr)] xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.38fr)] lg:gap-[clamp(1.5rem,3vw,3rem)]",
                  i % 2 === 1 && "lg:[direction:rtl]",
                )}
              >
                <div
                  className={cx(
                    "order-2 min-w-0 space-y-[clamp(0.65rem,2vw,1rem)] text-left lg:order-none",
                    i % 2 === 1 && "lg:[direction:ltr]",
                  )}
                >
                  <h2
                    className={`${publicHeadingLightning("amber")} text-[clamp(1.35rem,4.2vw,2.35rem)] font-black uppercase leading-tight tracking-[0.06em] text-zinc-50 drop-shadow-[0_2px_10px_rgba(0,0,0,0.72)] sm:tracking-[0.08em]`}
                  >
                    {block.title}
                  </h2>
                  <CyberInsetPanel variant={block.accent === "amber" ? "amber" : block.accent === "violet" ? "violet" : "cyan"}>
                    <p className="text-[clamp(0.9rem,2.2vw,1.05rem)] leading-relaxed text-zinc-100/92 sm:text-lg">
                      {block.body}
                    </p>
                  </CyberInsetPanel>
                </div>

                <div
                  className={cx(
                    "order-1 min-w-0 w-full lg:order-none",
                    i % 2 === 1 && "lg:[direction:ltr]",
                  )}
                >
                  <CyberChamferFrame
                    accent="video"
                    chamfer={16}
                    decorSize="compact"
                    className="w-full min-w-0"
                    innerClassName="p-[clamp(0.35rem,1.2vw,0.65rem)]"
                  >
                    <div
                      className={cx(
                        "relative flex w-full min-w-0 items-center justify-center overflow-hidden bg-[#050510] p-[clamp(0.25rem,1vw,0.5rem)]",
                        showcaseFrameMinHeight(layout),
                      )}
                      style={{ aspectRatio: `${block.width} / ${block.height}` }}
                    >
                      <Image
                        src={block.src}
                        alt={block.title}
                        width={block.width}
                        height={block.height}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, (max-width: 1536px) 56vw, 52rem"
                        className={cx(
                          "h-auto w-full max-w-full object-contain object-center",
                          showcaseImageMaxHeight(layout),
                        )}
                        priority={i === 0}
                      />
                    </div>
                  </CyberChamferFrame>
                </div>
              </div>
            </CyberChamferFrame>
            );
          })}
        </div>

        <div className="mx-auto w-full max-w-[min(96rem,100%)]">
          <CyberChamferFrame
            accent="amber"
            chamfer={20}
            innerClassName="px-[clamp(1rem,4vw,2.5rem)] py-[clamp(1.75rem,5vw,3rem)] text-center"
          >
            <h2
              className={`${publicHeadingLightning("amber")} text-[clamp(1.35rem,4vw,2rem)] font-black uppercase tracking-[0.1em] text-amber-100 sm:tracking-[0.12em]`}
            >
              Already cleared as a partner?
            </h2>
            <p className="mx-auto mt-[clamp(0.75rem,2.5vw,1rem)] max-w-2xl text-[clamp(0.9rem,2.2vw,1.05rem)] leading-relaxed text-zinc-100/88 sm:text-lg">
              Your access is already prepared. Verify your identity. Enter your secure code. Enter your affiliate command centre. Your network is waiting. Your commissions are waiting. The next move is yours.
            </p>
            <div className="mt-[clamp(1.25rem,4vw,2rem)] flex flex-wrap justify-center gap-3">
              <Link href={AFFILIATE_LOGIN_HREF} prefetch className="cta-nav-button text-sm font-semibold">
                Affiliate login
              </Link>
            </div>
          </CyberChamferFrame>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
