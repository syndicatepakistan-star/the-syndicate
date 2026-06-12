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
      a: 'It is a private channel for people who want real leverage — money, power, and self-mastery — not motivational noise.\nYou get courses, bigger program packs, membership if you want it, and a way to earn as an affiliate. Head to the Programs page to see everything that is open right now.',
    },
    {
      q: 'What does Money Mastery unlock?',
      a: 'Money Mastery is the full lifetime bundle — $333, one payment. It opens the whole library: every Level 1 course, all three big program packs (Agentic AI, AI Content Automation, Trading), and everything inside your dashboard that normally stays locked.\nBuy one vault course on its own and you only get that pack or that single course. Money Mastery is the “all of it” option.',
    },
    {
      q: 'What are the mid-ticket program packs?',
      a: 'On the Programs page you will see three larger packs. Each one lets you buy the full bundle or pick courses one at a time.\nAgentic AI is $199 for the full pack, or $19 per course — about 26 courses on automation, agents, and similar tools.\nAI Content Automation is $149 for the full pack, or $15 per course — faceless YouTube, shorts, documentaries, that kind of thing.\nTrading Advanced Technical Analysis is $99 for the full pack, or $35 per course — four trading programs.\nHit Unlock on any of those cards and you can choose the full pack or just the courses you want.',
    },
    {
      q: 'How does the affiliate program work?',
      a: 'You get your own link. When people click it, sign up, or buy through you, it shows up in your affiliate dashboard. You can see your numbers there and cash out once you have enough earned.\nLog in through the affiliate section on the site to grab your link and check how you are doing.',
    },
    {
      q: 'How long will I have access to what I buy?',
      a: 'Lifetime buys — Money Mastery, a full program pack, a single course from a pack, or a Level 1 course — stay on your account. The exact wording is in the footer legal pages when you checkout.\nThe Knight membership is different: it is $19.99 a month and stays active while you keep paying. Stop the subscription and that access ends, same as any monthly plan.',
    },
    {
      q: 'Will this work if I have a job or study at university?',
      a: 'Yes. Everything is on your schedule — watch when you can, around work or classes.\nThat does not mean coast. If you never apply what you learn, you are wasting your own time.',
    },
  ],
  pricing: [
    {
      q: 'How much does everything cost?',
      a: 'Check the Programs page — that is where prices are listed and where you pay.\nMoney Mastery is $333 lifetime and unlocks all features and all program packs.\nThe Knight is $19.99 a month — pick a few courses, use the dashboard, Syndicate Mode, goals, and member content.\nAgentic AI: $199 full pack or $19 per course. AI Content Automation: $149 full pack or $15 per course. Trading pack: $99 full pack or $35 per course.\nLevel 1 courses on the same page have their own prices. Buying a full pack is cheaper than grabbing every course inside it separately.',
    },
    {
      q: 'Can I buy one course inside a pack instead of the whole thing?',
      a: 'Yes. Open Agentic AI, AI Content Automation, or Trading from the Programs page, tap Unlock, and you will see the full pack at the top and single courses underneath.\nPay for only what you want. Each course is its own checkout. If you already have Money Mastery, you do not need to buy again — those items will show as Open.',
    },
    {
      q: 'Do I have to pay monthly to get started?',
      a: 'No. You can buy a single Level 1 course, one course from a big pack, a full pack, or Money Mastery — all one-time unless the page says otherwise.\nThe Knight is the monthly option for people who want membership perks: choosing courses, weekly drops, Syndicate Mode, and the goals section.',
    },
    {
      q: 'Can I cancel The Knight membership?',
      a: 'Yes, after you are on a live subscription. How cancellation works is spelled out in the Subscription Conditions and Terms links in the footer — read those before you argue with support.\nMoney Mastery and the lifetime program packs are one-off payments, not monthly bills.',
    },
    {
      q: 'How do refunds and guarantees work?',
      a: 'Refund Policy, Terms, Subscription Conditions, and Privacy Policy are all in the footer. Those documents are what actually apply.\nThis is training, not a get-rich guarantee. If a refund is possible, it follows the Refund Policy — nothing beyond that.',
    },
    {
      q: 'What payment methods are accepted?',
      a: 'Card checkout through Stripe — whatever cards and local options Stripe shows you at payment time.\nAfter you pay, the purchase shows in your dashboard under billing so you have a record of it.',
    },
  ],
  program: [
    {
      q: 'Is the content live or recorded?',
      a: 'Most of it is recorded video you watch on your own time, plus any PDFs or extras tied to the course.\nThe big program packs are still growing — new lessons get added over time. If you bought the pack or a single course, you keep access to what you paid for as new material lands. Watch it, then use it. Sitting through videos without doing anything will not change your bank account.',
    },
    {
      q: 'What about the free ticket from the quiz?',
      a: 'If you finish the quiz, you might get offered one free course — something like The Micro Business Protocol.\nPut in your email, confirm the code we send you, and that one course unlocks on the Programs page. It is a single free course, not Money Mastery and not the big Agentic AI, Content, or Trading packs.\nWant everything? That is Money Mastery or buying the packs/courses yourself.',
    },
    {
      q: 'Who is The Syndicate for?',
      a: 'People building something — business owners, side hustlers, traders, creators — who want straight talk and systems they can actually run.\nIf you are looking for effortless passive income with zero work, this is not your place.',
    },
    {
      q: 'How do I know if it is right for me?',
      a: 'Read the homepage and Our Methods. Browse the Programs page and see if the topics match what you are trying to fix in your life or business.\nYou can start small — one Level 1 course or one course from a pack — or go straight to Money Mastery if you already know you want the full library.',
    },
    {
      q: 'Do I need special tools or software?',
      a: 'A phone or computer and internet is enough to log in and watch.\nSome courses mention specific tools — automation software, AI apps, charting platforms, whatever the lesson needs. Those details are inside the course you buy.',
    },
    {
      q: 'How much time should I commit each week?',
      a: 'Plan on a few solid hours a week if you want to get anywhere.\nYou set the schedule. We set the bar — use what you learn or do not bother buying it.',
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
        <h2 className={`${styles.title} public-heading-lightning public-heading-lightning--amber`}>
          Frequently Asked Questions
        </h2>
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
