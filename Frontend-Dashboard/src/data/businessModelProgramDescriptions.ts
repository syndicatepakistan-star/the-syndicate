/**
 * Curated Business Model program copy — fixes legacy ù encoding and overrides API text.
 */
export const BUSINESS_MODEL_PROGRAM_DESCRIPTIONS: Readonly<Record<string, string>> = {
  "n8n-ai-automation": `Introduction
The modern landscape demands a brutal truth: if your operations require constant human intervention, you are building a prison, not an empire. Trading time for output is the definition of operational fragility. True digital sovereignty is achieved only through absolute automation—the ability to deploy intelligent agents that execute, scale, and generate leverage without your physical presence. This is not a basic software tutorial; it is a cyber-executive blueprint for constructing an autonomous infrastructure. By mastering n8n and advanced AI integration, you will replace human error with the cold, relentless efficiency of autonomous AI agents. Reclaim your seat as the Architect and let the machine handle the execution.

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

  "framer-crash-course": `Introduction
If you rely on external developers to build your digital real estate, you do not own your empire—you are leasing it. You are bleeding capital, burning time, and surrendering absolute control to intermediaries who dictate your speed to market. In a digital economy built on speed, dependency is a fatal vulnerability. This course is the exact strategic weapon you need to sever that leash. It is the ultimate leverage: the ability to rapidly design, animate, and deploy high-converting digital fortresses from scratch, with zero code.

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

  "app-building-flutter": `Introduction
If your product only exists as an idea in a slide deck, you do not have a business — you have a fantasy. The mobile economy is not waiting for you to find a developer, raise funding, or learn five frameworks before you ship. App Building with Flutter is the Syndicate protocol for seizing the means of production on iOS and Android simultaneously: one codebase, native performance, and deployment speed that destroys the amateur cycle of endless planning and zero launches. Operators who cannot ship mobile products are permanently dependent on someone else's timeline. This course removes that dependency.

What You Will Learn
Flutter project setup and cross-platform fundamentals
Widget trees, layouts, and responsive mobile design
State management for real-world app behaviour
Navigation, routing, and user flow architecture
API integration and backend connectivity
Authentication and user session patterns
Building production-ready UI components
Packaging and publishing to iOS and Android stores`,

  "building-apps-react-js": `Introduction
The web is the highest-leverage real estate on earth — and most operators still rent their presence on platforms they do not control. Building Apps using React JS is your extraction protocol from template dependency and no-code limitations into full sovereign control over web applications that scale. React is not a trend; it is the infrastructure layer powering modern SaaS, dashboards, marketplaces, and client portals. If you cannot build in React, you are permanently subcontracting your most valuable digital territory to developers who bill by the hour and vanish when complexity arrives.

What You Will Learn
Modern React fundamentals and component architecture
Routing, navigation, and multi-page application structure
State management and data flow patterns
Consuming REST and API endpoints securely
Forms, validation, and user input handling
Authentication and protected route patterns
Building and styling production UI systems
Deploying React applications to production environments`,

  "amazon-kdp": `Introduction
Publishing empires are not built in boardrooms — they are built in distribution channels that compound while you sleep. Amazon KDP is one of the highest-leverage publishing weapons available to a solo operator: zero inventory, global reach, and royalty streams that do not require your face, your office, or your constant presence. Amateurs treat KDP like a lottery ticket — upload once, hope for sales, quit after thirty days. Syndicate operators treat it like a publishing factory: research-driven niches, systematic production, and covers and copy engineered for conversion.

What You Will Learn
Amazon KDP platform setup and publishing workflow
Niche research and market validation techniques
Manuscript formatting and interior design standards
Cover design principles that convert browsers to buyers
Keyword, category, and listing optimization
Launch strategy for new titles
Building a compounding back catalogue
Long-term royalty architecture without inventory overhead`,

  "graphics-design-canva": `Introduction
Visual trust is decided in milliseconds — and most businesses lose the war before a prospect reads a single word. If you depend on designers for every thumbnail, ad, deck, and social asset, you are bleeding time and capital on work that should be systematized inside your operation. Graphics Design Using Canva is not a hobby course for making pretty posts. It is the Syndicate protocol for engineering high-converting visual assets at speed: brand-consistent, platform-ready, and deployable without a creative agency on retainer.

What You Will Learn
Canva workspace mastery and brand kit architecture
Template systems for repeatable high-speed production
Thumbnail, ad, and social asset design principles
Typography, colour, and visual hierarchy for conversion
Animated and video-ready creative workflows
Platform-specific sizing and export standards
Building a personal creative library for your empire
Designing assets that match premium brand positioning`,

  "print-on-demand": `Introduction
Inventory is a prison. Warehouses, upfront stock, and unsold units have destroyed more side hustles than competition ever did. Print On Demand is the Syndicate extraction protocol: products manufactured only when a customer pays, shipped without you touching a box, and scaled across apparel, accessories, and home goods without capital tied up in dead stock. Amateurs upload random designs and wonder why nothing sells. Operators engineer niches, brands, and listing systems that turn POD stores into automated merchandise engines.

What You Will Learn
Print on demand platform setup and workflow
Niche and audience research for merchandise
Design creation and brand-consistent product lines
Mockups, listings, and conversion-focused product pages
Pricing, margins, and marketplace fee structure
Organic and paid traffic strategies for POD stores
Scaling catalogue volume without inventory risk
Building a merchandise brand that compounds over time`,

  "python-programming": `Introduction
In the modern economy, illiteracy is not about reading — it is about code. Operators who cannot speak the language of automation, data, and software will always depend on someone else to build their leverage. Python Programming is the Syndicate foundation course for seizing technical sovereignty: the most versatile language on earth for automation, AI integration, data analysis, scraping, scripting, and backend systems. You do not need a computer science degree. You need a weaponized understanding of Python that turns repetitive work into scripts and scripts into scalable systems.

What You Will Learn
Python fundamentals: variables, types, and operators
Control flow, loops, and conditional logic
Functions, modules, and reusable code structure
File handling and data processing basics
Working with APIs and external data sources
Error handling and debugging discipline
Introductory automation scripts for business tasks
Foundation skills for AI, scraping, and backend development`,

  "wordpress-blog": `Introduction
Your website is either an asset you own or a liability you rent. Platforms come and go, algorithms change overnight, and operators who build entirely on rented land wake up one morning to find their traffic, audience, and revenue gone with a policy update. WordPress Blog is the Syndicate protocol for owning your digital territory: a self-hosted publishing engine that compounds SEO, captures email, and monetizes attention without surrendering control to a Silicon Valley middleman. If you cannot publish on infrastructure you own, you are building on borrowed time.

What You Will Learn
WordPress installation, hosting, and site architecture
Theme selection and customization for professional presentation
Essential plugins for SEO, security, and performance
Content structure and publishing workflow
On-page SEO fundamentals for organic discovery
Monetization integration: ads, affiliates, and lead capture
Site speed, maintenance, and security best practices
Building a compounding content asset you fully control`,
};

const LEVEL1_SLUG_TO_DESCRIPTION_KEY: Record<string, keyof typeof BUSINESS_MODEL_PROGRAM_DESCRIPTIONS> = {
  "level1-model-01": "n8n-ai-automation",
  "level1-model-02": "ai-automations",
  "level1-model-03": "app-building-flutter",
  "level1-model-04": "building-apps-react-js",
  "level1-model-05": "amazon-kdp",
  "level1-model-06": "building-games-using-unreal-engine",
  "level1-model-07": "framer-crash-course",
  "level1-model-08": "graphics-design-canva",
  "level1-model-09": "print-on-demand",
  "level1-model-10": "python-programming",
  "level1-model-11": "wordpress-blog",
};

const BY_TITLE = new Map<string, string>(
  Object.entries({
    "n8n ai automation": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["n8n-ai-automation"],
    "ai automations": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["ai-automations"],
    "app building using flutter": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["app-building-flutter"],
    "building apps using react js": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["building-apps-react-js"],
    "book publishing on amazon kindle": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["amazon-kdp"],
    "amazon kdp": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["amazon-kdp"],
    "building games using unreal engine": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["building-games-using-unreal-engine"],
    "framer crash course": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["framer-crash-course"],
    "graphics design using canva": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["graphics-design-canva"],
    "full canva tutorial": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["graphics-design-canva"],
    "print on demand clothing": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["print-on-demand"],
    "print on demand": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["print-on-demand"],
    "python programming": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["python-programming"],
    "python full course": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["python-programming"],
    "wordpress blog": BUSINESS_MODEL_PROGRAM_DESCRIPTIONS["wordpress-blog"],
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
