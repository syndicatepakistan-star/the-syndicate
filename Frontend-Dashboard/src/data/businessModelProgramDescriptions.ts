/**
 * Curated Business Model program copy — fixes legacy ù encoding and overrides API text.
 */
export const BUSINESS_MODEL_PROGRAM_DESCRIPTIONS: Readonly<Record<string, string>> = {
  "n8n-ai-automation": `The Hook
The modern landscape demands a brutal truth: if your operations require constant human intervention, you are building a prison, not an empire. Trading time for output is the definition of operational fragility. True digital sovereignty is achieved only through absolute automation—the ability to deploy intelligent agents that execute, scale, and generate leverage without your physical presence. This is not a basic software tutorial; it is a cyber-executive blueprint for constructing an autonomous infrastructure. By mastering n8n and advanced AI integration, you will replace human error with the cold, relentless efficiency of autonomous AI agents. Reclaim your seat as the Architect and let the machine handle the execution.

The Core Protocol
This curriculum is a high-grade mechanical schematic for engineering intelligent business systems. We strip away theoretical fluff and dive directly into the neural network of automation: core API logic, webhooks, and advanced RAG architectures. You will command the deployment of specialized AI agents—from invoice processing and inbound sales to self-learning research protocols and autonomous content engines. This is the exact technological framework required to scale an enterprise exponentially. By mastering this architecture, you secure absolute operational dominance, transforming complex, time-draining workflows into silent, unyielding engines of wealth generation.

What you will Learn
Module 1 — Getting Started with n8n (Foundations)
What automation really means and how it applies to everyday tasks
Understanding the n8n dashboard, pricing, and workflow executions
Building your first workflow step-by-step
Understanding triggers, nodes, variables, and expressions
Workflow best practices and debugging
Module 2 — Core n8n Foundations (Automation Logic & APIs)
How APIs and Webhooks actually work
Making your first HTTP request inside n8n
Understanding requests, responses, headers, and API keys
Error handling, evaluations, and testing automations safely
Module 3 — AI Agent Fundamentals
Understand what are AI Agents
How they differ from normal workflows
How they operate in n8n
Build Your First AI Agent
Module 4 — Building Smarter AI Systems (Frameworks & Prompts)
How to combine AI with automation to build intelligent systems
Understanding how to structure prompts and chain reasoning
Architecture for building scalable AI systems
Module 5 — Real-World AI Agent Projects
RAG AI Agent
Customer Support AI Agent
Invoice Processing AI Agent
Sales Team AI Agent (Human-in-the-Loop)
Self-Learning AI Agent
Resume Screening AI Agent
Inbox Automation AI Agent
Blog Writing AI System
Research AI Agent (with Perplexity AI)
Voice AI Agent (using ElevenLabs)
Stock Analyst AI Agent
Personal AI Assistant
Module 6 — Real-World Workflow Projects
Instagram Content AI System
Viral Content Writing AI System
Viral Content Finder AI System
Client Onboarding Automation (Notion + n8n)
LinkedIn Outreach Automation AI System
Sales Call Analysis AI System
Lead Scraper AI System`,

  "ai-automations": `The Hook
The era of the "personality-driven" creator is a trap—a high-maintenance prison that requires your face, your voice, and your constant presence to generate revenue. To achieve true digital sovereignty, you must remove yourself from the production line. The YouTube algorithm doesn't care about your ego; it cares about attention arbitrage. If you are still trading your physical image for views, you are operating with 20th-century limitations. This protocol is designed to help you build a faceless empire, utilizing AI as a force multiplier to dominate multiple niches simultaneously while you remain completely invisible.

The Core Protocol
This curriculum is engineered for absolute execution. We eliminate theoretical noise and vanity metrics to focus strictly on high-yield, automated media production. This protocol provides the exact mechanical frameworks required to deploy faceless digital assets—from AI-generated Stoic philosophy and historical documentaries to high-converting product shorts. You will command the deployment of talking AI avatars, master hyper-efficient editing workflows, and integrate a definitive, end-to-end monetization architecture. This is the exact digital machinery required to build, scale, and extract maximum capital from the YouTube algorithm.

What you will Learn
Intro
In this YouTube automation course...
What videos we will create?
Faceless philosophical and motivational videos
Faceless trending stoic videos
Make $10,000/month by promoting products with AI shorts
Monetizable shorts with AI generated anime
How to create a talking AI avatar
How to create self-improvement videos with AI like FarFromWeak
Creating monetizable wisdom shorts
Creating a historical documentary only with AI
Create automated AI shorts with just one tool
How to create talking AI avatar reels
Pro-level CapCut editing course
Full YouTube monetization guide`,

  "building-games-using-unreal-engine": `The Hook
The masses are conditioned to consume realities engineered by corporate monopolies, trading their most valuable asset—time—for fleeting entertainment. You are currently trapped in the consumer matrix, lacking the technical leverage to construct, control, and monetize your own digital worlds. This protocol is your strategic extraction. It is the exact operational weapon required to shatter your dependency, seize the means of digital production, and architect a massive, interactive sandbox empire from the ground up. You are no longer a player in their game; you are the architect of your own.

The Core Protocol
Theoretical game design is weakness; ruthless execution is power. This module delivers the exact digital infrastructure required to deploy AAA-level mechanics within Unreal Engine 5. You will strip away the coding noise and master the implementation of high-level frameworks: motion-matching physics, aggressive AI police protocols, dynamic traffic algorithms, and sprawling city generation. By seizing control of these advanced systems—from escalating wanted-level hierarchies to complex civilian crowd interactions—you acquire the ultimate leverage. You are engineering a self-sustaining digital reality designed to command attention and yield absolute control.

What You Will Learn
Intro
Project Creation
Migrating Motion Matching (GAS)
Pistol Overlay
Aiming
Pistol Model
Lucia Recreation (Character Creator 4 - You Can Skip)
Adding Lucia
Firing
Health
Phone
Wanted Level
Police
Traffic Vehicles
City Creation
Civilians
Drivable Vehicle
NPCs Interaction`,

  "framer-crash-course": `The Hook
If you rely on external developers to build your digital real estate, you do not own your empire—you are leasing it. You are bleeding capital, burning time, and surrendering absolute control to intermediaries who dictate your speed to market. In a digital economy built on speed, dependency is a fatal vulnerability. This course is the exact strategic weapon you need to sever that leash. It is the ultimate leverage: the ability to rapidly design, animate, and deploy high-converting digital fortresses from scratch, with zero code.

The Core Protocol
We eliminate the theoretical bloat and hand you the raw, operational mechanics of Framer. You will master the exact visual architecture required to build responsive, high-performance web assets at scale. From engineering dynamic layouts with advanced Stacks and Grids to weaponizing Content Management Systems (CMS) for infinite digital scalability, this protocol gives you absolute sovereign control over your web presence. You will not just design pages; you will engineer automated, interactive digital environments that command authority and capture wealth.

What You Will Learn
Introduction to Framer
Project Planning & Setup
Building the Navigation Bar
Hero Section
Client & Feature Sections
Testimonials & Bento Grids
Call to Action (CTA) & Footer
Responsive Design
Animations & Interactions
CMS (Content Management System)`,
};

const LEVEL1_SLUG_TO_DESCRIPTION_KEY: Record<string, keyof typeof BUSINESS_MODEL_PROGRAM_DESCRIPTIONS> = {
  "level1-model-01": "n8n-ai-automation",
  "level1-model-02": "ai-automations",
  "level1-model-06": "building-games-using-unreal-engine",
  "level1-model-07": "framer-crash-course",
};

const BY_TITLE = new Map<string, string>(
  Object.entries({
    "n8n ai automation": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["n8n-ai-automation"],
    "ai automations": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["ai-automations"],
    "building games using unreal engine": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["building-games-using-unreal-engine"],
    "framer crash course": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["framer-crash-course"],
  }),
);

export function curatedBusinessModelDescription(
  slug: string | null | undefined,
  title: string | null | undefined,
): string | undefined {
  const slugKey = slug?.trim().toLowerCase();
  if (slugKey && LEVEL1_SLUG_TO_DESCRIPTION_KEY[slugKey]) {
    const descKey = LEVEL1_SLUG_TO_DESCRIPTION_KEY[slugKey];
    return BUSINESS_MODEL_PROGRAM_DESCRIPTIONS[descKey];
  }
  if (slugKey && BUSINESS_MODEL_PROGRAM_DESCRIPTIONS[slugKey]) {
    return BUSINESS_MODEL_PROGRAM_DESCRIPTIONS[slugKey];
  }
  const titleKey = title
    ?.toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (titleKey && BY_TITLE.has(titleKey)) return BY_TITLE.get(titleKey);
  return undefined;
}
