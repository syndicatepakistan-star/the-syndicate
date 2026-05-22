export type InstructorSlide = {
  src: string;
  programName: string;
  instructorName: string;
  description: string;
};

const INSTRUCTOR_IMAGE_BASE = "/instructors";

const instructorImage = (fileName: string) =>
  `${INSTRUCTOR_IMAGE_BASE}/${encodeURIComponent(fileName)}`;

/** Dashboard instructor hero — images from `public/instructors`. */
export const INSTRUCTOR_SLIDES: InstructorSlide[] = [
  {
    src: instructorImage("1 Minute Scalpel.png"),
    programName: "The 1 Minute Scalpel",
    instructorName: "Trading Desk Lead",
    description:
      "Precision entries and exits for fast-moving markets without living on the charts. Learn setup filters, risk caps, and execution drills you can run in under a minute per decision."
  },
  {
    src: instructorImage("Affiliate Marketing.jpg"),
    programName: "Affiliate Marketing",
    instructorName: "Growth Ops Instructor",
    description:
      "Build offer stacks, tracking links, and content funnels that convert cold traffic into commissions. From niche selection to compliance-safe promos—ship campaigns that scale without guessing."
  },
  {
    src: instructorImage("AI Faceless YouTube Automation.png"),
    programName: "Faceless YouTube AI Content Creator",
    instructorName: "Content Systems Lead",
    description:
      "Launch faceless channels with AI-assisted scripting, voice, and edit pipelines. Automate research-to-publish workflows while keeping quality high enough to pass platform review."
  },
  {
    src: instructorImage("App Building (using Flutter).png"),
    programName: "App Building (using Flutter)",
    instructorName: "Mobile Engineering Lead",
    description:
      "Ship cross-platform apps from wireframe to store listing with Flutter fundamentals and release hygiene. State management, API hooks, and UI polish—built for real devices, not toy demos."
  },
  {
    src: instructorImage("Avatar - Building A.I Agents.jpg"),
    programName: "How To Build A.I Agents",
    instructorName: "AI Systems Instructor",
    description:
      "Design agents that plan, call tools, and hand off work reliably across multi-step tasks. Tool schemas, guardrails, and evaluation loops—so automations survive production traffic."
  },
  {
    src: instructorImage("Avatar - Building Apps Using React JS.jpg"),
    programName: "Building Apps using React JS",
    instructorName: "Frontend Architecture Lead",
    description:
      "Modern React patterns for dashboards, auth flows, and API-backed UIs that feel fast. Component boundaries, data fetching, and deploy-ready builds aligned with how teams ship today."
  },
  {
    src: instructorImage("Avatar - Crypto Trading with Technical Analysis.jpg"),
    programName: "Trading with Technical Analysis",
    instructorName: "Markets Strategy Lead",
    description:
      "Read structure, momentum, and levels on crypto charts without indicator clutter. Risk frameworks, journal discipline, and playbook entries built for volatile, 24/7 markets."
  },
  {
    src: instructorImage("Avatar - Framer Crash Course.jpg"),
    programName: "Framer Crash Course",
    instructorName: "Product Design Lead",
    description:
      "Prototype and publish marketing sites in Framer with motion that sells the offer. Layout systems, CMS hooks, and handoff-ready components—launch pages in days, not quarters."
  },
  {
    src: instructorImage("Avatar - Graphic Designing Using Canva.jpg"),
    programName: "Graphics Design Using Canva",
    instructorName: "Brand Visual Lead",
    description:
      "Command Canva like a production studio: templates, brand kits, and ad creatives that look agency-grade. Speed workflows for social, decks, and thumbnails without sacrificing consistency."
  },
  {
    src: instructorImage("Avatar - Print on Demand Clothing.jpg"),
    programName: "Print On Demand Clothing",
    instructorName: "E‑commerce Ops Lead",
    description:
      "Launch apparel lines with zero inventory—designs, mockups, and store listings that convert. Supplier selection, margin math, and ad angles tuned for POD winners."
  },
  {
    src: instructorImage("Avatar - Prompt Engineering.png"),
    programName: "Prompt Engineering",
    instructorName: "LLM Workflow Lead",
    description:
      "Write prompts that stay on-spec across models and use cases. Chain-of-thought control, eval sets, and reusable prompt libraries for content, code, and ops automations."
  },
  {
    src: instructorImage("Avatar 3 - A.I Automation.png"),
    programName: "AI Automations",
    instructorName: "Automation Architect",
    description:
      "Wire no-code and API automations that replace repetitive ops work. Triggers, error handling, and observability—pipelines your team can trust when volume spikes."
  },
  {
    src: instructorImage("Block Chain and Smart Contract Building.png"),
    programName: "Blockchain & Smart Contracts (Solidity)",
    instructorName: "Web3 Engineering Lead",
    description:
      "Build and deploy smart contracts with Solidity—from tokens to simple dApp flows. Testing, gas awareness, and security basics before anything touches mainnet."
  },
  {
    src: instructorImage("Book Publishing on Amazon Kindle.png"),
    programName: "Book Publishing On Amazon (Kindle)",
    instructorName: "Publishing Ops Lead",
    description:
      "Research niches, outline manuscripts, and publish Kindle titles that rank. Covers, metadata, and launch sequences designed for long-tail royalty income."
  },
  {
    src: instructorImage("Building Games Using UnReal Engine.jpg"),
    programName: "Building Games Using Unreal Engine",
    instructorName: "Game Dev Lead",
    description:
      "Blueprint and level-design fundamentals inside Unreal—prototype playable loops fast. Asset pipelines, lighting passes, and packaging builds you can share or sell."
  },
  {
    src: instructorImage("Python Programming.png"),
    programName: "Python Programming",
    instructorName: "Software Foundations Lead",
    description:
      "Python from syntax to scripts that automate real tasks—files, APIs, and data pulls. Clear patterns for beginners who want a path into backends, AI tooling, or analytics."
  },
  {
    src: instructorImage("WordPress Blog.png"),
    programName: "WordPress Blog",
    instructorName: "Content Platform Lead",
    description:
      "Stand up SEO-ready blogs on WordPress: themes, plugins, and publishing cadence that compounds traffic. Monetization hooks and performance tuning without drowning in tech debt."
  }
];
