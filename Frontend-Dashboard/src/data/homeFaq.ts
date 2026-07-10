export type FaqCategory = "general" | "pricing" | "program";

export type FaqItem = { q: string; a: string };

export const FAQ_TABS: { id: FaqCategory; label: string }[] = [
  { id: "general", label: "General" },
  { id: "pricing", label: "Pricing" },
  { id: "program", label: "Program" },
];

export const FAQS_BY_CATEGORY: Record<FaqCategory, FaqItem[]> = {
  general: [
    {
      q: "What is The Syndicate?",
      a: "The Syndicate is a private online business education platform — not a university, not an exam board, and not a crypto coin.\nWe train operators in money mastery, Syndicate Trading, AI automation, Syndicate business models, and Syndicate behaviour psychology. You buy lifetime vaults and courses, or run The Knight membership, then execute from your dashboard.",
    },
    {
      q: "Is The Syndicate a university or Examination Syndicate?",
      a: "No. We are not the University of the Punjab, not an Examination Syndicate, and not a degree-granting school.\nThe Syndicate is an independent operator education brand. If you searched for campus exams or academic departments, that is a different organisation. We sell digital programs, vault packs, and membership for people building leverage in business, trading, and AI systems.",
    },
    {
      q: "What is The Syndicate vault / Money Mastery?",
      a: "The Syndicate vault is the lifetime library. Money Mastery is the full vault unlock — one payment, permanent access to Level 1 courses plus the three mid-ticket packs: Agentic AI, AI Content Automation (including the Syndicate faceless YouTube pack), and Syndicate Trading.\nBuy a single pack or course if you want a narrower strike. Money Mastery is the all-in command option.",
    },
    {
      q: "What is Syndicate Trading?",
      a: "Syndicate Trading is our Advanced Technical Analysis vault — chart discipline, setups, and execution frameworks for operators who refuse to gamble on hope.\nYou can unlock the full trading pack or take modules one at a time from the Programs page. It sits beside Money Mastery, not inside a university syllabus.",
    },
    {
      q: "What are Syndicate business models and Syndicate behaviour psychology?",
      a: "Syndicate business models are the Level 1 tracks that teach real operating models you can start and scale — pick the lanes that fit your edge.\nSyndicate behaviour psychology is the correction layer: how you think under pressure, how you decide, and how you stop sabotaging your own execution. Both live in the Programs library under The Syndicate brand.",
    },
    {
      q: "What does Money Mastery unlock?",
      a: "Money Mastery is the full lifetime bundle — $333, one payment. It opens the whole library: every Level 1 course, all three big program packs (Agentic AI, AI Content Automation, Trading), and everything inside your dashboard that normally stays locked.\nBuy one vault course on its own and you only get that pack or that single course. Money Mastery is the “all of it” option.",
    },
    {
      q: "What are the mid-ticket program packs?",
      a: "On the Programs page you will see three larger packs. Each one lets you buy the full bundle or pick courses one at a time.\nAgentic AI is $150 for the full pack (about $200 if you bought every course separately) — about 26 courses on automation, agents, and similar tools.\nAI Content Automation is $150 for the full pack (about $200 separately) — the Syndicate faceless YouTube pack: shorts, documentaries, finance channels, that kind of machine.\nTrading Advanced Technical Analysis is $150 for the full pack (about $200 separately) — four trading programs at $50 each, or single lessons inside each module.\nHit Unlock on any of those cards and you can choose the full pack or just the courses you want.",
    },
    {
      q: "How does the affiliate program work?",
      a: "You get your own link. When people click it, sign up, or buy through you, it shows up in your affiliate dashboard. You can see your numbers there and cash out once you have enough earned.\nLog in through the affiliate section on the site to grab your link and check how you are doing.",
    },
    {
      q: "How long will I have access to what I buy?",
      a: "Lifetime buys — Money Mastery, a full program pack, a single course from a pack, or a Level 1 course — stay on your account. The exact wording is in the footer legal pages when you checkout.\nThe Knight membership is different: it is $19.99 a month and stays active while you keep paying. Stop the subscription and that access ends, same as any monthly plan.",
    },
    {
      q: "Will this work if I have a job or study at university?",
      a: "Yes. Everything is on your schedule — watch when you can, around work or classes.\nThat does not mean coast. If you never apply what you learn, you are wasting your own time. Studying at a university and training inside The Syndicate are not the same thing — one is campus academia; we are operator education.",
    },
  ],
  pricing: [
    {
      q: "How much does everything cost?",
      a: "Check the Programs page — that is where prices are listed and where you pay.\nMoney Mastery is $333 lifetime and unlocks all features and all program packs.\nThe Knight is $19.99 a month — pick a few courses, use the dashboard, Syndicate Mode, goals, and member content.\nAgentic AI, AI Content Automation, and Trading: $150 each for the full pack (about $200 if you bought every module separately).\nLevel 1 Business Model and Business Behaviour Psychology courses are priced across eleven programs per column ($150 total if you bought all eleven in a column separately — most are about $13–$14 each). Buying a full vault pack is cheaper than grabbing every course inside it separately.",
    },
    {
      q: "Can I buy one course inside a pack instead of the whole thing?",
      a: "Yes. Open Agentic AI, AI Content Automation, or Trading from the Programs page, tap Unlock, and you will see the full pack at the top and single courses underneath.\nPay for only what you want. Each course is its own checkout. If you already have Money Mastery, you do not need to buy again — those items will show as Open.",
    },
    {
      q: "Do I have to pay monthly to get started?",
      a: "No. You can buy a single Level 1 course, one course from a big pack, a full pack, or Money Mastery — all one-time unless the page says otherwise.\nThe Knight is the monthly option for people who want membership perks: choosing courses, weekly drops, Syndicate Mode, and the goals section.",
    },
    {
      q: "Can I cancel The Knight membership?",
      a: "Yes, after you are on a live subscription. How cancellation works is spelled out in the Subscription Conditions and Terms links in the footer — read those before you argue with support.\nMoney Mastery and the lifetime program packs are one-off payments, not monthly bills.",
    },
    {
      q: "How do refunds and guarantees work?",
      a: "Refund Policy, Terms, Subscription Conditions, and Privacy Policy are all in the footer. Those documents are what actually apply.\nThis is training, not a get-rich guarantee. If a refund is possible, it follows the Refund Policy — nothing beyond that.",
    },
    {
      q: "What payment methods are accepted?",
      a: "Card checkout through Stripe — whatever cards and local options Stripe shows you at payment time.\nAfter you pay, the purchase shows in your dashboard under billing so you have a record of it.",
    },
  ],
  program: [
    {
      q: "Is the content live or recorded?",
      a: "Most of it is recorded video you watch on your own time, plus any PDFs or extras tied to the course.\nThe big program packs are still growing — new lessons get added over time. If you bought the pack or a single course, you keep access to what you paid for as new material lands. Watch it, then use it. Sitting through videos without doing anything will not change your bank account.",
    },
    {
      q: "What about the free ticket from the quiz?",
      a: "If you finish the quiz, you may unlock one free psychology course — Zero to 1 Million or 9 to 5 Exit Strategy.\nUse the same email you entered in the quiz, confirm the code we send you, and only that course unlocks on the Programs page. It is a single free course, not Money Mastery and not the Agentic AI, Content, or Trading packs.\nWant everything? That is Money Mastery or buying the packs/courses yourself.",
    },
    {
      q: "Who is The Syndicate for?",
      a: "People building something — business owners, side hustlers, traders, creators — who want straight talk and systems they can actually run.\nIf you are looking for effortless passive income with zero work, this is not your place.",
    },
    {
      q: "How do I know if it is right for me?",
      a: "Read the homepage and Our Methods. Browse the Programs page and see if the topics match what you are trying to fix in your life or business.\nYou can start small — one Level 1 course or one course from a pack — or go straight to Money Mastery if you already know you want the full library.",
    },
    {
      q: "Do I need special tools or software?",
      a: "A phone or computer and internet is enough to log in and watch.\nSome courses mention specific tools — automation software, AI apps, charting platforms, whatever the lesson needs. Those details are inside the course you buy.",
    },
    {
      q: "How much time should I commit each week?",
      a: "Plan on a few solid hours a week if you want to get anywhere.\nYou set the schedule. We set the bar — use what you learn or do not bother buying it.",
    },
  ],
};

/** Priority FAQs for rich results / AI Overviews — entity first, then products. */
const STRUCTURED_FAQ_PRIORITY: readonly string[] = [
  "What is The Syndicate?",
  "Is The Syndicate a university or Examination Syndicate?",
  "What is The Syndicate vault / Money Mastery?",
  "What is Syndicate Trading?",
  "What are Syndicate business models and Syndicate behaviour psychology?",
  "What does Money Mastery unlock?",
  "What are the mid-ticket program packs?",
  "Who is The Syndicate for?",
];

/** Flat list for FAQ rich results (Google recommends a focused subset). */
export function homeFaqForStructuredData(limit = 8): FaqItem[] {
  const byQuestion = new Map<string, FaqItem>();
  for (const category of ["general", "pricing", "program"] as const) {
    for (const item of FAQS_BY_CATEGORY[category]) {
      byQuestion.set(item.q, item);
    }
  }

  const picked: FaqItem[] = [];
  for (const q of STRUCTURED_FAQ_PRIORITY) {
    const item = byQuestion.get(q);
    if (item) {
      picked.push(item);
      if (picked.length >= limit) return picked;
    }
  }

  for (const category of ["general", "pricing", "program"] as const) {
    for (const item of FAQS_BY_CATEGORY[category]) {
      if (picked.some((p) => p.q === item.q)) continue;
      picked.push(item);
      if (picked.length >= limit) return picked;
    }
  }
  return picked;
}
