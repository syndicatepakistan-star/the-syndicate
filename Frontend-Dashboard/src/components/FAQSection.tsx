'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import styles from './FAQSection.module.css'

type FaqCategory = 'general' | 'pricing' | 'program'

const FAQ_TABS: { id: FaqCategory; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'program', label: 'Program' },
]

const FAQS_BY_CATEGORY: Record<FaqCategory, { q: string; a: string }[]> = {
  general: [
    {
      q: 'What is The Syndicate?',
      a: 'A closed circuit built for money, power, and mastery in the real economy — frameworks you can run, not slogans you can tweet. Honour and alliance over conformity; execution over hype.\nLevel 1 (Money, Power, Self) plus Our Methods is where you wire it in. Deeper levels stay gated — you earn the key, not the landing page.',
    },
    {
      q: 'How long will I have access to what I buy?',
      a: 'Level 1 is sold as separate products on Courses — windows close, listings can vanish. No infinite “library forever” fantasy unless the checkout says so.\nAccess length and rules are stamped at purchase and in the footer legal stack — that is the contract.',
    },
    {
      q: 'How do levels, vetting, and advanced training work?',
      a: 'Seven levels of power are on the record; only Level 1 ships in public, for a limited time.\nBeyond that: private selection, hard vetting, most applicants never clear the gate. If you need a guarantee of admission, you are already off brief.',
    },
    {
      q: 'How often are new programmes or offers released?',
      a: 'No broadcast schedule — we drop when the channel is ready.\nWatch Courses, pricing, What You Get, and the homepage for windows and new fire as it goes live.',
    },
    {
      q: 'Will this work if I have a job or study at university?',
      a: 'Yes — the material is on-demand; you stack reps around a job or degree.\nThe Syndicate still demands discipline: on-demand is not “when I feel like it.” If you only consume, you will bleed time and learn nothing.',
    },
  ],
  pricing: [
    {
      q: 'Can I cancel a subscription when memberships go live?',
      a: 'Memberships read “coming soon” until checkout is live — nothing to cancel until billing exists.\nWhen it does: cancellation and renewal live in Subscription Conditions and Terms in the footer. Read them — they win every argument.',
    },
    {
      q: 'How do refunds and guarantees work?',
      a: 'Footer: Refund Policy, Terms, Subscription Conditions, Privacy — all binding.\nThis is education, not a lottery ticket: outcomes are not guaranteed. Refunds follow the Refund Policy only.',
    },
    {
      q: 'Do I have to pay monthly to get started?',
      a: 'No. Buy a Level 1 course from Courses and move — no membership required.\nThe King tier on pricing is optional recurring muscle once it launches; not a toll gate on your first move.',
    },
    {
      q: 'What do membership tiers cost?',
      a: 'Pricing page is source of truth: The King at £19.99/month (yearly on the same card), checkout when signed in.\nFull bundle lifetime is listed there too — do not trust hearsay; trust the page.',
    },
    {
      q: 'What payment methods are accepted?',
      a: 'Whatever checkout exposes for your region when you pay is what runs.\nUntil checkout is live, use the register-interest flows on the site.',
    },
  ],
  program: [
    {
      q: 'Is the content live or recorded?',
      a: 'Level 1 is structured PDF + video on Courses — filter, select, execute.\nOur Methods beats one rule into you: apply from lesson one. No passive “cinema mode.”',
    },
    {
      q: 'What if I need help?',
      a: 'What You Get frames the network and integrity layer beside the curriculum.\nConcrete support channels ride on the product you bought — check that product page and the legal terms at purchase.',
    },
    {
      q: 'Who is The Syndicate for?',
      a: 'Founders, operators, serious learners who want money and power under a moral code — people who strive, not spectators hunting passive income fairy tales.\nIf you want guaranteed riches or zero effort, close the tab.',
    },
    {
      q: 'How do I know if it is right for me?',
      a: 'If you want wealth and influence frameworks and you own the outcome, the homepage and Our Methods spell the fit.\nIf you need guaranteed results or entertainment-only fluff, this channel is not yours.',
    },
    {
      q: 'Do I need special tools or software?',
      a: 'Device + internet to stream or download. That is the baseline.\nAnything specialised ships with the product you buy.',
    },
    {
      q: 'How much time should I commit each week?',
      a: 'Budget several focused hours weekly to absorb and run the drills properly.\nOur Methods is built for immediate use — the cadence is still yours, the standard is not.',
    },
  ],
}

export default function FAQSection() {
  const [category, setCategory] = useState<FaqCategory>('general')
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = FAQS_BY_CATEGORY[category]

  useEffect(() => {
    setOpenIndex(0)
  }, [category])

  return (
    <section id="faq" className={styles.faq}>
      <div className={styles.bgMedia} aria-hidden>
        <Image
          src="/assets/tt.gif"
          alt=""
          fill
          sizes="100vw"
          className={styles.bgImage}
          unoptimized
          loading="eager"
          fetchPriority="low"
          decoding="async"
        />
        <div className={styles.bgOverlay} />
      </div>
      <div className={styles.container}>
        <h2 className={styles.title}>Frequently Asked Questions</h2>
        <div className={`${styles.tabs} mt-4`} role="tablist" aria-label="FAQ categories">
          {FAQ_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={category === tab.id}
              className={`${styles.tab} ${category === tab.id ? styles.tabActive : ''}`}
              onClick={() => setCategory(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={styles.list} role="tabpanel">
          {faqs.map((f, i) => (
            <div
              key={`${category}-${f.q}`}
              className={`${styles.item} ${openIndex === i ? styles.open : ''}`}
            >
              <button type="button" className={styles.question} onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                <span className={styles.questionText}>{f.q}</span>
                <span className={styles.icon}>{openIndex === i ? '−' : '+'}</span>
              </button>
              <div className={styles.answerWrap}>
                <p className={styles.answer}>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
