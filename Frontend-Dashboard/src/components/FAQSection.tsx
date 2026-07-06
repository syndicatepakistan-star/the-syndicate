'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { FAQS_BY_CATEGORY, FAQ_TABS, type FaqCategory } from '@/data/homeFaq'
import styles from './FAQSection.module.css'

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
