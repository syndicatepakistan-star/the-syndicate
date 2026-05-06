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
      a: 'An elite organisation focused on money, power, and mastery—practical frameworks inside the real economy, with honour and alliance, not conformity or hype.\nLevel 1 courses (Money, Power, Self) and Our Methods explain how to apply it; deeper paths exist only for those who qualify.',
    },
    {
      q: 'How long will I have access to what I buy?',
      a: 'Level 1 courses are sold as separate products with prices on Courses; they are offered for a limited window and may be removed.\nExact access length and rules are set at checkout and in the legal pages linked in the footer.',
    },
    {
      q: 'How do levels, vetting, and advanced training work?',
      a: 'The site describes seven levels of power; only Level 1 foundation is sold online for a limited time.\nAdvanced training is private: selection is strict and only a small fraction of applicants are accepted.',
    },
    {
      q: 'How often are new programmes or offers released?',
      a: 'There is no fixed TV-style schedule.\nWatch Courses, pricing, What You Get, and the homepage for enrolment windows and new drops as they go live.',
    },
    {
      q: 'Will this work if I have a job or study at university?',
      a: 'Yes—course material is on-demand so you can fit it around work or study.\nThe Syndicate still expects real discipline: this is for people who execute, not casual viewers.',
    },
  ],
  pricing: [
    {
      q: 'Can I cancel a subscription when memberships go live?',
      a: 'Memberships are shown as coming soon until checkout is active.\nWhen billing exists, cancellation and renewal rules will be in Subscription Conditions and Terms in the footer—those documents are binding.',
    },
    {
      q: 'How do refunds and guarantees work?',
      a: 'The footer links to Refund Policy, Terms, Subscription Conditions, and Privacy.\nContent is educational; results are not guaranteed. Use the Refund Policy for any refund request.',
    },
    {
      q: 'Do I have to pay monthly to get started?',
      a: 'No—you can start with a Level 1 course from Courses without any membership.\nThe King membership on the pricing page is an optional recurring tier once it launches.',
    },
    {
      q: 'What do membership tiers cost?',
      a: 'On the pricing page: The King is listed at £77.77/month (coming soon), with register-your-interest style CTAs.\nThe full bundle lifetime price is shown separately on the same page; use that page as the source of truth.',
    },
    {
      q: 'What payment methods are accepted?',
      a: 'Supported methods appear at checkout for your region when you pay.\nUntil a product checkout is live, follow register-interest flows on the site.',
    },
  ],
  program: [
    {
      q: 'Is the content live or recorded?',
      a: 'Level 1 is structured PDF and VIDEO learning with filters on Courses.\nOur Methods stresses applying techniques from the first lesson—not passive theory.',
    },
    {
      q: 'What if I need help?',
      a: 'What You Get describes a network built on integrity alongside the curriculum.\nExact support channels depend on the product you buy—check that product page and the legal terms at purchase.',
    },
    {
      q: 'Who is The Syndicate for?',
      a: 'People who want money and power mastery with a moral code—founders, professionals, and serious learners willing to strive.\nIt is not for anyone chasing effortless passive income or guaranteed riches.',
    },
    {
      q: 'How do I know if it is right for me?',
      a: 'If you want practical wealth and influence frameworks and accept that outcomes depend on you, the homepage and Our Methods describe the fit.\nIf you want guaranteed results or entertainment-only content, this is not the match.',
    },
    {
      q: 'Do I need special tools or software?',
      a: 'You need a device and internet to stream or download materials.\nAnything extra ships with the course product itself.',
    },
    {
      q: 'How much time should I commit each week?',
      a: 'Plan for several focused hours weekly to absorb and apply lessons properly.\nOur Methods is built for immediate use; pacing is still yours.',
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
        <Image src="/assets/tt.gif" alt="" fill sizes="100vw" className={styles.bgImage} unoptimized />
        <div className={styles.bgOverlay} />
      </div>
      <div className={styles.container}>
        <h2 className={styles.title}>
          Frequently Asked Questions
        </h2>
        <p className={styles.subtitle}>Short answers—full legal detail lives in the footer policies.</p>
        <div className={styles.tabs} role="tablist" aria-label="FAQ categories">
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
