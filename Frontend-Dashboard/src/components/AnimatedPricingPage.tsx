'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Shield, Star, Swords } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getAuthorizationHeader, hasSimpleAuthSessionClient, resolveClientApiUrl } from '@/lib/portal-api'
import { AffiliatePublicSection } from '@/components/affiliate/AffiliatePublicSection'

type PlanKey = 'bundle' | 'pawn' | 'knight' | 'king'
type BillingKey = 'monthly' | 'yearly'

interface PricingTier {
  price: Record<BillingKey, string>
  oldPrice?: Record<BillingKey, string>
  badge: string
  title: string
  description: string
  features: string[]
  accent: 'gold'
  icon: ReactNode
  cta: string
  billingMode?: 'lifetime' | 'recurring'
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const pricingData: Record<PlanKey, PricingTier> = {
  bundle: {
    price: { monthly: '£333', yearly: '£3,330' },
    oldPrice: { monthly: '£555', yearly: '£5,550' },
    badge: 'MONEY MASTERY',
    title: 'MONEY MASTERY',
    description:
      'You will access everything with full lifetime coverage across the complete Syndicate ecosystem.',
    features: [
      'You will access everything',
      'All programs lifetime',
      'Complete Access of Dashboard',
      'Quick Access to all social apps',
    ],
    accent: 'gold',
    icon: <Shield className="h-4 w-4" />,
    cta: 'Get Full Bundle',
    billingMode: 'lifetime',
  },
  pawn: {
    price: { monthly: '£19.19', yearly: '£191.90' },
    oldPrice: { monthly: '£29.99', yearly: '£299.90' },
    badge: 'THE PAWN · BASIC',
    title: 'The Pawn Basic',
    description:
      'Enter the world of The Syndicate. Ideal for newcomers building momentum with structured direction.',
    features: [
      'Core foundation vault access',
      'New member roadmap',
      'Weekly action prompts',
      'Private community entry',
      'Monthly mission briefing',
      'Starter accountability framework',
    ],
    accent: 'gold',
    icon: <Star className="h-4 w-4" />,
    cta: 'Join The Pawn Basic',
    billingMode: 'recurring',
  },
  knight: {
    price: { monthly: '£33.33', yearly: '£333.30' },
    oldPrice: { monthly: '£49.99', yearly: '£499.90' },
    badge: 'THE KNIGHT',
    title: 'The Knight',
    description:
      'Expand your knowledge base with our more indepth offering focused on strategic execution and systems.',
    features: [
      'Everything in The Pawn',
      'Advanced strategy modules',
      'Deep-dive weekly workshops',
      'Execution playbooks and SOPs',
      'Faster support response lane',
      'Early access to selected releases',
    ],
    accent: 'gold',
    icon: <Swords className="h-4 w-4" />,
    cta: 'Join The Knight',
    billingMode: 'recurring',
  },
  king: {
    price: { monthly: '£77.77', yearly: '£777.70' },
    oldPrice: { monthly: '£99.99', yearly: '£999.90' },
    badge: 'THE KING',
    title: 'The King',
    description:
      'Your membership, your curriculum: hand-pick 4–5 courses, then stay inside weekly drops, the dashboard, articles, and Syndicate Mode challenges.',
    features: [
      'Select 4–5 courses yourself from the catalog',
      'Weekly content and member drops',
      'Full dashboard access',
      'Membership articles and briefings',
      'Exclusive Membership Section',
      'Goals & Milestone section',
      'Syndicate Challenges Mode',
    ],
    accent: 'gold',
    icon: <Crown className="h-4 w-4" />,
    cta: 'Join The King',
    billingMode: 'recurring',
  },
}

function TierCard({
  planKey,
  tier,
  billing,
  highlighted,
  onJoin,
}: {
  planKey: PlanKey
  tier: PricingTier
  billing: BillingKey
  highlighted?: boolean
  onJoin?: (plan: PlanKey, billing: BillingKey, amount: string) => Promise<void> | void
}) {
  const isLifetime = tier.billingMode === 'lifetime'
  const activeBilling: BillingKey = isLifetime ? 'monthly' : billing
  const isBundle = planKey === 'bundle'
  const hudThemeByPlan: Record<
    PlanKey,
    {
      panel: string
      accentText: string
      frameOuter: string
      frameInner: string
      frameOuterGlow: string
      frameInnerGlow: string
      underGlow: string
      lightningColor: string
      lightningSoft: string
      frame: string
      glow: string
      row: string
    }
  > = {
    bundle: {
      panel: 'bg-[linear-gradient(160deg,rgba(5,9,22,0.96)_0%,rgba(4,5,15,0.98)_55%,rgba(3,8,22,0.98)_100%)]',
      accentText: 'text-cyan-300',
      frameOuter: 'border-cyan-300/50',
      frameInner: 'border-violet-300/30',
      frameOuterGlow: 'shadow-[0_0_30px_rgba(34,211,238,0.72),0_0_62px_rgba(34,211,238,0.42)]',
      frameInnerGlow: 'shadow-[inset_0_0_18px_rgba(167,139,250,0.42),0_0_22px_rgba(167,139,250,0.32)]',
      underGlow: 'radial-gradient(65%_85%_at_50%_100%, rgba(34,211,238,0.5) 0%, rgba(139,92,246,0.28) 45%, transparent 78%)',
      lightningColor: 'rgba(34,211,238,0.96)',
      lightningSoft: 'rgba(34,211,238,0.62)',
      frame: 'border-transparent hover:border-transparent',
      glow: 'shadow-[0_0_0_1px_rgba(56,236,255,0.9),0_0_42px_rgba(56,236,255,0.6),0_0_104px_rgba(139,92,246,0.34)]',
      row: 'border-cyan-300/35 bg-cyan-950/10',
    },
    pawn: {
      panel: 'bg-[linear-gradient(160deg,rgba(11,7,18,0.96)_0%,rgba(8,5,16,0.98)_55%,rgba(4,9,22,0.98)_100%)]',
      accentText: 'text-violet-300',
      frameOuter: 'border-violet-300/50',
      frameInner: 'border-cyan-300/30',
      frameOuterGlow: 'shadow-[0_0_30px_rgba(192,132,252,0.72),0_0_62px_rgba(232,121,249,0.44)]',
      frameInnerGlow: 'shadow-[inset_0_0_18px_rgba(34,211,238,0.38),0_0_22px_rgba(34,211,238,0.28)]',
      underGlow: 'radial-gradient(65%_85%_at_50%_100%, rgba(192,132,252,0.56) 0%, rgba(232,121,249,0.3) 45%, transparent 78%)',
      lightningColor: 'rgba(192,132,252,0.96)',
      lightningSoft: 'rgba(232,121,249,0.62)',
      frame: 'border-transparent hover:border-transparent',
      glow: 'shadow-[0_0_0_1px_rgba(196,181,253,0.9),0_0_40px_rgba(192,132,252,0.58),0_0_98px_rgba(232,121,249,0.34)]',
      row: 'border-fuchsia-300/35 bg-fuchsia-950/12',
    },
    knight: {
      panel: 'bg-[linear-gradient(160deg,rgba(10,7,14,0.96)_0%,rgba(8,5,13,0.98)_55%,rgba(9,6,15,0.98)_100%)]',
      accentText: 'text-violet-300',
      frameOuter: 'border-fuchsia-300/50',
      frameInner: 'border-cyan-300/25',
      frameOuterGlow: 'shadow-[0_0_30px_rgba(232,121,249,0.74),0_0_62px_rgba(232,121,249,0.44)]',
      frameInnerGlow: 'shadow-[inset_0_0_18px_rgba(34,211,238,0.36),0_0_22px_rgba(34,211,238,0.26)]',
      underGlow: 'radial-gradient(65%_85%_at_50%_100%, rgba(232,121,249,0.45) 0%, rgba(34,211,238,0.2) 44%, transparent 78%)',
      lightningColor: 'rgba(232,121,249,0.96)',
      lightningSoft: 'rgba(232,121,249,0.62)',
      frame: 'border-transparent hover:border-transparent',
      glow: 'shadow-[0_0_0_1px_rgba(193,120,255,0.84),0_0_34px_rgba(193,120,255,0.5),0_0_88px_rgba(34,211,238,0.26)]',
      row: 'border-violet-300/35 bg-violet-950/10',
    },
    king: {
      panel: 'bg-[linear-gradient(160deg,rgba(7,14,8,0.96)_0%,rgba(5,12,7,0.98)_55%,rgba(8,16,10,0.98)_100%)]',
      accentText: 'text-lime-300',
      frameOuter: 'border-lime-300/55',
      frameInner: 'border-emerald-300/35',
      frameOuterGlow: 'shadow-[0_0_30px_rgba(132,204,22,0.72),0_0_62px_rgba(16,185,129,0.42)]',
      frameInnerGlow: 'shadow-[inset_0_0_18px_rgba(16,185,129,0.38),0_0_22px_rgba(16,185,129,0.28)]',
      underGlow: 'radial-gradient(65%_85%_at_50%_100%, rgba(132,204,22,0.52) 0%, rgba(16,185,129,0.3) 45%, transparent 78%)',
      lightningColor: 'rgba(132,204,22,0.96)',
      lightningSoft: 'rgba(16,185,129,0.62)',
      frame: 'border-transparent hover:border-transparent',
      glow: 'shadow-[0_0_0_1px_rgba(190,242,100,0.9),0_0_40px_rgba(132,204,22,0.56),0_0_98px_rgba(16,185,129,0.32)]',
      row: 'border-lime-300/35 bg-lime-950/12',
    },
  }
  const accentText = hudThemeByPlan[planKey].accentText

  return (
    <div className="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col pt-2">
      <div
        className="pointer-events-none absolute -bottom-12 left-1/2 h-24 w-[84%] -translate-x-1/2 blur-[22px]"
        style={{ background: hudThemeByPlan[planKey].underGlow }}
      />
      <div
        className={cn(
          'lightning-glow-card relative flex min-h-0 flex-1 flex-col rounded-3xl p-0 [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]',
        )}
        style={{
          ['--lightning-color' as any]: hudThemeByPlan[planKey].lightningColor,
          ['--lightning-color-soft' as any]: hudThemeByPlan[planKey].lightningSoft,
        }}
      >
        <span className="pointer-events-none absolute inset-[-1px] bg-inherit opacity-95 blur-[16px]" />
      <div
        className={cn(
          'relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border transition-all duration-300 will-change-transform hover:scale-[1.02] [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]',
          hudThemeByPlan[planKey].panel,
          'border-transparent',
          highlighted && 'ring-1 ring-white/10',
        )}
      >
        <div className={cn('pointer-events-none absolute inset-[6px] rounded-[20px] border', hudThemeByPlan[planKey].frameOuter, hudThemeByPlan[planKey].frameOuterGlow)} />
        <div className={cn('pointer-events-none absolute inset-[12px] rounded-[16px] border', hudThemeByPlan[planKey].frameInner, hudThemeByPlan[planKey].frameInnerGlow)} />

        <div className="relative flex min-h-0 flex-1 flex-col p-5 sm:p-6">
        <div className="flex shrink-0 items-center justify-between gap-4">
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-3.5 py-1.5 text-[0.8rem] font-bold tracking-[0.16em] shadow-[0_0_16px_rgba(34,211,238,0.25)] sm:text-[0.86rem]',
              accentText,
            )}
          >
            {tier.icon}
            <span>{tier.badge}</span>
          </div>

          {planKey === 'bundle' && (
            <div className="inline-flex items-center gap-1 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1 text-[0.78rem] font-semibold text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.28)] sm:text-[0.82rem]">
              <Star className="h-3.5 w-3.5 text-cyan-300" />
              Recommended
            </div>
          )}
        </div>
        <h3 className={cn('mt-3 shrink-0 text-2xl font-semibold tracking-wide sm:text-[2rem]', accentText)} style={{ textShadow: '0 0 18px rgba(255,255,255,0.12)' }}>
          {tier.title}
        </h3>

        <div className="mt-4 flex shrink-0 items-end justify-between gap-4">
          <motion.div
            key={`${planKey}-${billing}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex items-center gap-3">
              {tier.oldPrice?.[activeBilling] && (
                <div
                  className="text-lg font-semibold text-white/40 line-through sm:text-xl"
                  style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
                >
                  {tier.oldPrice[activeBilling]}
                </div>
              )}
            </div>

            <div className="mt-1 flex items-baseline gap-2">
              <div
                className="text-4xl font-black text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.28)] sm:text-5xl"
                style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
              >
                {tier.price[activeBilling]}
              </div>
              <div className="text-sm text-white/60">
                /{isLifetime ? 'lifetime' : billing === 'monthly' ? 'mo' : 'yr'}
              </div>
            </div>

            <div className="mt-2 max-w-none text-sm text-white/70 font-body sm:max-w-[52ch]">
              {tier.description}
            </div>
          </motion.div>

        </div>

        <div className="mt-5 flex min-h-0 flex-1 flex-col gap-2">
          {tier.features.map((f) => (
            <div
              key={f}
              className={cn(
                'flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5',
                hudThemeByPlan[planKey].row,
              )}
            >
              <Check className={cn('mt-0.5 h-4 w-4 shrink-0', accentText)} />
              <span className="text-[13px] leading-snug text-white/80 drop-shadow-[0_0_8px_rgba(34,211,238,0.15)]">{f}</span>
            </div>
          ))}
        </div>

          <button
            type="button"
            onClick={() => onJoin?.(planKey, activeBilling, tier.price[activeBilling])}
            className={cn(
              'hamburger-attract mt-6 w-full shrink-0 rounded-2xl border border-[#bd9b4f]/70 bg-[linear-gradient(180deg,rgba(189,155,79,0.18)_0%,rgba(0,0,0,0.22)_100%)] px-5 py-2.5 text-sm font-semibold tracking-wide text-[#f6e7bf] shadow-[0_0_0_1px_rgba(189,155,79,0.55),0_0_20px_rgba(189,155,79,0.38),inset_0_0_16px_rgba(189,155,79,0.12)] transition-all hover:scale-[1.02] hover:shadow-[0_0_0_1px_rgba(189,155,79,0.72),0_0_30px_rgba(189,155,79,0.52),inset_0_0_18px_rgba(189,155,79,0.18)] active:scale-[0.99]',
            )}
          >
            {tier.cta}
          </button>
        </div>
      </div>
    </div>
    </div>
  )
}

export function PricingPage({
  className,
  onSelectPlan,
}: {
  className?: string
  onSelectPlan?: (plan: PlanKey) => void
}) {
  const router = useRouter()
  const [billing, setBilling] = useState<BillingKey>('monthly')
  const [checkoutError, setCheckoutError] = useState('')
  const goToSignupPurchase = (plan: PlanKey, selectedBilling: BillingKey, amount: string) => {
    const params = new URLSearchParams({
      plan,
      billing: selectedBilling,
      amount,
      buy: '1',
    })
    router.push(`/signup?${params.toString()}`)
  }
  const goToAuth = (plan: PlanKey, selectedBilling: BillingKey, amount: string) => {
    const params = new URLSearchParams({
      plan,
      billing: selectedBilling,
      amount,
    })
    router.push(`/login?${params.toString()}`)
  }
  const handleJoinPlan = async (plan: PlanKey, selectedBilling: BillingKey, rawAmount: string) => {
    const amount = rawAmount.replace(/[^0-9.]/g, '')
    if (!hasSimpleAuthSessionClient()) {
      goToAuth(plan, selectedBilling, amount)
      return
    }
    setCheckoutError('')

    try {
      const authHeader = getAuthorizationHeader()
      const response = await fetch(resolveClientApiUrl('/api/auth/checkout/create-session/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({
          return_base_url: typeof window !== 'undefined' ? window.location.origin : undefined,
          selected_plan: plan,
          selected_billing: selectedBilling,
          selected_amount: amount,
        }),
      })
      const payload = (await response.json().catch(() => ({}))) as {
        checkout_url?: string;
        is_unlocked?: boolean;
        already_purchased?: boolean;
        message?: string;
      }
      const checkoutUrl = typeof payload.checkout_url === 'string' ? payload.checkout_url.trim() : ''
      if (response.ok && checkoutUrl) {
        window.location.assign(checkoutUrl)
        return
      }
      if (response.ok && (payload.is_unlocked || payload.already_purchased)) {
        router.push("/dashboard")
        return
      }
      goToSignupPurchase(plan, selectedBilling, amount)
    } catch {
      goToSignupPurchase(plan, selectedBilling, amount)
    }
  }

  const tiers = useMemo(
    () => [
      { key: 'bundle' as const, tier: pricingData.bundle },
      { key: 'king' as const, tier: pricingData.king },
    ],
    [],
  )

  return (
    <section
      id="pricing"
      className={cn(
        'relative w-full min-h-screen overflow-hidden bg-background px-[clamp(0.75rem,2.2vw,2rem)] py-20 md:py-24',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <Image src="/assets/g.gif" alt="" aria-hidden fill sizes="100vw" className="object-cover opacity-18" unoptimized />
        <div className="absolute inset-0 bg-black/70" />
      </div>
      <div className="relative mx-auto flex w-full max-w-none flex-col items-center">
        <header className="mb-12 px-6 py-8 text-center md:mb-16 md:px-10 md:py-10">
          <h2 className="mt-2 font-display text-6xl font-black uppercase tracking-[0.14em] text-white md:text-7xl">
            Syndicate Offers
          </h2>
          <p className="mx-auto mt-4 max-w-3xl font-mono text-lg tracking-[0.1em] text-zinc-300 md:text-xl">
            Choose your access tier: Money Mastery lifetime bundle, or The King membership with 4–5 self-selected courses,
            weekly content, dashboard, articles, and Syndicate Mode challenges.
          </p>
          {checkoutError ? (
            <p className="mx-auto mt-3 max-w-3xl text-sm text-rose-300">{checkoutError}</p>
          ) : null}

          <div className="mt-8 inline-flex items-center justify-center gap-4 rounded-xl bg-black/10 px-6 py-4 text-sm font-mono tracking-[0.2em] uppercase shadow-[0_0_18px_rgba(251,191,36,0.2)]">
            <span className={billing === 'monthly' ? 'text-amber-300' : 'text-zinc-500'}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setBilling((b) => (b === 'monthly' ? 'yearly' : 'monthly'))}
              className={cn(
                'relative h-7 w-14 rounded-full border border-amber-300/25 bg-black/40 p-1 transition-all duration-200',
                billing === 'yearly' && 'border-amber-300/45 bg-amber-300/12',
              )}
              aria-label="Toggle billing period"
            >
              <span
                className={cn(
                  'block h-5 w-5 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.5)] transition-all duration-200',
                  billing === 'yearly' ? 'translate-x-7' : 'translate-x-0',
                )}
              />
            </button>
            <span className={billing === 'yearly' ? 'text-amber-300' : 'text-zinc-500'}>
              Yearly
            </span>
          </div>
        </header>

        <div className="mx-auto grid w-full max-w-[min(1320px,calc(100vw-1.25rem))] grid-cols-1 gap-6 px-[clamp(0.5rem,2vw,1.25rem)] sm:gap-7 md:grid-cols-2 md:items-stretch md:gap-8 md:[grid-template-columns:minmax(0,1fr)_minmax(0,1fr)]">
          {tiers.map(({ key, tier }) => (
            <div
              key={key}
              onClick={() => onSelectPlan?.(key)}
              className="flex min-h-0 min-w-0 w-full cursor-default md:h-full"
            >
              <TierCard
                planKey={key}
                tier={tier}
                billing={billing}
                highlighted={key === 'bundle'}
                onJoin={handleJoinPlan}
              />
            </div>
          ))}
        </div>

        <AffiliatePublicSection className="mt-[clamp(2.75rem,8vw,5rem)]" />
      </div>
    </section>
  )
}
