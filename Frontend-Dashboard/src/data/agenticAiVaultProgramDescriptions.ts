/**
 * Curated Agentic AI vault pack + module copy — vault modals and program library.
 * Section headers: Programme Introduction, Programme Description, Projects You Will Build, What You Will Learn.
 */
import type { VaultPackKey } from "@/components/programs/planOfferCatalog";
import { extractProgrammeIntroductionTeaser } from "@/lib/structuredDescription";

export const AGENTIC_VAULT_PACK_TITLE = "Agentic AI";

export const AGENTIC_VAULT_PACK_STRUCTURED_DESCRIPTION = `Programme Introduction
Are you tired of losing hours to repetitive computer tasks, drowning in a cluttered email inbox, or feeling blocked from building your own software because you do not have a computer science degree? The Agentic AI masterclass bundle is the definitive, zero-coding roadmap designed to hand you complete digital sovereignty.

Instead of struggling with confusing tech jargon and outdated tutorials, this program serves as the master umbrella for 26 specialized modules. You will go from absolute beginner to automation expert, learning a clear, step-by-step system to turn plain English into fully working web applications, deploy autonomous digital workers, and build automated video and blogging machines. By the end of this comprehensive journey, you will have a complete suite of self-operating systems running your business and daily operations on autopilot, allowing you to reclaim your time, energy, and freedom.

Programme Description
This massive bundle is a step-by-step operational blueprint for deploying a highly efficient team of virtual AI coworkers. Spanning 26 comprehensive modules, this curriculum guides you through setting up, training, and connecting advanced autonomous tools like Claude Code, n8n, Google Antigravity, Gemini 3.1, and vector databases.

You will master the art of "Vibe Coding" to build software using conversational text, configure multi-agent networks that execute complex tasks in parallel, and build self-updating memory vaults so your digital assistants never forget your business rules. This master program replaces theoretical guessing with highly valuable, market-ready technical skills. It is an investment designed to eliminate busywork permanently, replacing it with resilient automated systems that work for you 24/7.

Projects You Will Build
Throughout the 26 core modules of the Agentic AI masterclass, you will build a robust portfolio of exactly 30 practical, real-world digital projects and automated systems. The beginner-friendly projects appear first, followed by the more advanced systems.

Module 1: Beginner-Friendly Everyday Projects
The Morning Briefing Generator: A helpful assistant that checks your calendar, emails, and active work, then sends you one simple summary of your priorities for the day.
The Receipt and Invoice Downloader: A financial helper that finds billing emails, saves attached invoices, and files them neatly in your chosen cloud folder.
The Automated Gmail Sorter and Optimizer: A smart inbox manager that understands incoming emails, applies useful labels, drafts natural replies, and helps clean older messages.
The Meeting-Notes Organizer: A system that turns recorded meetings into clear notes, action points, and assigned tasks in tools such as Trello or Notion.
The Voice-to-Task Mobile Pipeline: A simple mobile tool that turns spoken ideas into written tasks and sends them to the correct list automatically.
The Personal Customer Relationship Manager: A smart contact book that tracks professional relationships, watches for useful updates, and reminds you when to follow up.
The Automated Newsletter Publisher: A content helper that gathers important weekly news, writes a clear summary, and prepares it inside your email marketing tool.
The Automated Job-Application Bot: A digital assistant that finds suitable job opportunities and prepares tailored cover letters using your résumé.
The Social Media Reply Engine: A brand assistant that reads social media mentions and prepares suitable responses for you to approve.
The Automated Bookkeeping Sync: A workflow that records payments, sorts transactions, and updates your accounting records without repeated manual entry.
The Spreadsheet Charts Generator: A data helper that turns messy spreadsheet exports into clear visual summaries, charts, and useful reports.
The Competitor Price Tracker: A daily monitor that checks competitor prices and alerts you when something important changes.
The Dynamic Real Estate and Asset Scraper: A personal deal finder that watches housing, vehicles, or equipment listings and sends the best matches to your phone.
The Telegram-to-WordPress Blogging Bot: A blogging assistant that receives a topic by message, researches useful keywords, writes the article, creates a cover image, and publishes it.
The Hands-Free YouTube Shorts Machine: A video-making system that takes ideas from a spreadsheet, prepares scripts, voices and visuals, then assembles and uploads the finished short.

Module 2: Advanced Apps and Autonomous Systems
The Live WhatsApp AI Assistant: A 24/7 customer support assistant connected to an official WhatsApp Business account to answer questions, manage leads, and record details.
The Dynamic Lead Generation Funnel: A smart form that changes its follow-up questions according to the answers each visitor provides.
The Brand Voice Enforcer System: A quality-control system that keeps every piece of AI-written content consistent with your company’s tone and style.
The Live Database-Driven Web App: A responsive web application with secure user accounts and saved information, built through conversational English instructions.
The Cinematic 3D Landing Page: A professional promotional website with 3D elements and interactive movement, created by guiding AI with clear layout instructions.
The Firecrawl-Powered Web Scraper: An automated information collector that gathers public website data, cleans it, and records it in Google Sheets.
The Custom Knowledge Chatbot — Chat with Your Docs: A private assistant that reads your company PDFs, spreadsheets, and manuals so you can ask questions and receive accurate answers.
The Long-Term Memory Vault: A private memory system that helps your AI remember business rules and important context from earlier conversations.
The Trend Intelligence Dashboard: A command centre that reviews research and market changes to reveal opportunities and warn you about important industry shifts.
The Local Sandbox Development Environment: A safe testing space on your computer where you can check AI-created software and automations before publishing them.
The API Credential Vault: A protected place for storing and managing the access keys used by your connected digital tools.
The Custom Subagent Debate Team: A group of specialist AI reviewers—such as a writer, editor, and critic—that improve one another’s work before delivering the result.
The Extreme Parallel Task Engine: A coordinated team of AI workers that divides large coding or research assignments and completes different parts at the same time.
The Browser Automation and Testing Bot: A testing assistant that navigates websites, behaves like a visitor, identifies problems, and helps prepare corrections.
The Fully Autonomous Bug Fixer: A development assistant that detects software errors, prepares a correction, and submits it for your review.

What You Will Learn
Autonomous App Development (Vibe Coding): How to use Gemini 3.1, Claude Code, and Google Antigravity to design, test, fix, and launch working web applications using plain English commands.
Visual Workflow Automation (n8n): How to connect your favourite apps, handle information safely, and run everyday processes automatically.
Next-Generation GENTIC Workflows: How to move from visual drag-and-drop builders to text-driven automations that follow natural-language instructions.
Advanced Memory Systems and RAG: How to give AI a long-term memory of your private business files, PDFs, and operating procedures.
Advanced Context and Prompt Optimization: How to stop your AI workspace becoming cluttered by using clean instructions, focused helpers, and organized project structures.
No-Code Web Scraping: How to collect current public information from websites and organize it clearly without manual copying.
Hands-Free Content and Video Factories: How to automatically prepare search-friendly blog posts, natural voiceovers, visual assets, and short-form videos.
Multi-Agent Orchestration: How to organize specialist AI helpers that pass work between one another, research topics, and complete tasks at the same time.
Operational and Administrative Automation: How to simplify daily work such as email sorting, invoice filing, lead tracking, and business reporting.`;

export const AGENTIC_AI_PROGRAM_DESCRIPTIONS: Readonly<Record<string, string>> = {
  __module_pack__: AGENTIC_VAULT_PACK_STRUCTURED_DESCRIPTION,

  "Build a Blog Writing Agent With N8N": `Programme Introduction
Tired of staring at a blank screen trying to write blog posts that rank on Google? This course fixes that. You'll learn to build a smart AI "blogging agent" that acts as your personal writer, editor, and graphic designer. After this course, you'll have a powerful digital assistant that generates high-quality content for your website effortlessly.
Programme Description
This course shows you how to create an automated blogging assistant using a tool called n8n. You will learn exactly how to set up an AI that researches topics, writes SEO-friendly articles, generates matching pictures, and posts them for you. It will save you hours of typing and significantly improve your website's search engine traffic.
Projects You Will Build
•	Total Projects: 1
•	Project Type: Autonomous Content Publisher
•	What You Build: You will build a Telegram-to-WordPress Blogging Bot. You will create a system where you text a topic to a private chat, and the AI automatically researches keywords, writes a full article, generates a featured image, and publishes it live to your blog.
What You Will Learn
•	How to build an AI agent that you can chat with to create content
•	How the AI generates articles perfectly optimized for SEO
•	How to automatically create cover images for your posts
•	Storing your favorite keywords and writing preferences
•	How to instantly publish the finished blog to WordPress
•	Techniques to train the AI to sound more like you over time
•	How to text your agent using Telegram from your phone
•	Step-by-step instructions for wiring it all together in n8n`,

  "Build a WhatsApp Agent with n8n": `Programme Introduction
Are you drowning in customer messages on WhatsApp? Is it hard to reply to everyone while trying to run your business? This course teaches you how to set up an AI assistant that answers your WhatsApp messages for you. You will automate your replies, book meetings, and get back the time you need to focus on what really matters.
Programme Description
This course is a step-by-step guide to creating a smart customer service bot for WhatsApp using n8n. You will learn how to connect an AI brain to your business number. By the end, you will have a fully functioning digital employee that chats with your customers 24/7. It’s a massive upgrade for any small business.
Projects You Will Build
•	Total Projects: 1
•	Project Type: Automated Customer CRM Bot
•	What You Build: You will build a Live WhatsApp AI Assistant. You will set up an official Facebook developer app, connect it to n8n, and program an AI agent to read incoming customer texts, answer common questions, and manage interactions automatically.
What You Will Learn
•	How to set up a WhatsApp connection (trigger) inside n8n
•	Creating an official business account on Facebook
•	Generating the secure IDs and passwords for WhatsApp
•	Setting up the AI brain to understand and answer messages
•	Connecting your new AI directly to your phone number
•	Generating access tokens to send messages safely
•	Testing your setup so you know it won't ignore customers
•	Customizing how the AI speaks to match your brand
•	Handling dozens of messages at once without high costs
•	Tricks to make your WhatsApp automation flawless`,

  "Build Apps With secret Claude Code Skill": `Programme Introduction
Do you have a great app idea but feel totally confused about where to start? Most apps fail because they lack a solid plan. This course shows you how to use AI to map out, plan, and structure your application before you build it. You will learn the "secret skills" to turn a vague idea into a professional roadmap, making building the actual app incredibly easy.
Programme Description
This course focuses on the planning and architecture side of software. You will learn how to use Claude Code to automatically generate the blueprints for your app. By the end, you'll have all the necessary documents, roadmaps, and tech choices decided for you. It simplifies the hardest part of software development so you avoid costly mistakes.
Projects You Will Build
•	Total Projects: 1
•	Project Type: Professional Application Blueprint
•	What You Build: You will build a Complete Software Specification Roadmap. You will guide the AI through an interactive planning session to generate a structured feature list, technology stack plan, and monetization strategy for a custom app idea.
What You Will Learn
•	What "agent skills" are and why they are game-changers
•	How to command Claude Code to build software architecture
•	The exact steps to plan an app before writing any code
•	How to use the "Product-Led AI Development" framework
•	"Vision Intake": Answering structured questions to clarify your idea
•	Generating the essential technical documents developers need
•	Mapping out product vision, roadmaps, and marketing strategies
•	Using "Skills OSH" to find extra tools for your project
•	Installing and setting up Claude Code correctly
•	Deciding on the best tech stack, logins, and payment systems
•	How to actually launch the app and get your first users`,

  "Claude Code + Consensus for INSANE $50k+ App Ideas": `Programme Introduction
Want to build an app but have no idea what people actually want? Stop guessing! This course shows you how to use AI to find million-dollar app ideas backed by actual scientific research. You will learn how to scan real-world data to find massive problems that people will happily pay you to solve.
Programme Description
This course pairs Claude Code with an AI tool called Consensus, which reads over 200 million research papers. You will learn how to extract massive, proven problems from this data and design software solutions for them. You'll stop building apps based on guesswork and start building tools based on hard facts and real human needs.
Projects You Will Build
•	Total Projects: 1
•	Project Type: Data-Validated Software Concept
•	What You Build: You will build a Research-Backed App Blueprint. By linking Claude with Consensus, you will scan academic papers to find an unaddressed market problem, and draft a complete feature outline for an app designed to solve it.
What You Will Learn
•	How to stop guessing and uncover proven software ideas
•	What Consensus is and how it reads millions of documents
•	How to connect Consensus directly into Claude Code
•	Searching through peer-reviewed data for business opportunities
•	Identifying specific pain points your app can fix
•	Creating unique, highly valuable software concepts
•	Structuring your app's features based entirely on data
•	Why focusing on a specific user need guarantees sales
•	Tips for building these researched apps using AI coding
•	Enhancing your app's value with scientific insights`,

  "Is Claude Code Better than n8n": `Programme Introduction
Do visual drag-and-drop workflow tools give you a headache? Are you tired of connecting endless messy boxes in n8n? This course will show you a better way. You will learn how to use Claude Code to simply type what you want to happen, and let the AI build the n8n workflow for you perfectly.
Programme Description
This course merges the power of AI coding with workflow automation. Instead of getting lost in complicated visual maps, you will learn how to command Claude Code to write and deploy n8n workflows for you. It’s a massively efficient skill that lets you build complex automations in half the time.
Projects You Will Build
•	Total Projects: 1
•	Project Type: Programmatic Workflow System
•	What You Build: You will build a Text-Driven Automation Environment. You will connect your coding software to n8n and use plain text commands to build and deploy a complex, automated To-Do List manager without dragging a single visual node.
What You Will Learn
•	An introduction to linking Claude Code and n8n together
•	Setting up Visual Studio Code for your automation workspace
•	Connecting your AI directly to your n8n account
•	Creating and managing workflows strictly through code
•	Understanding and utilizing MCP server tools
•	Installing special skills into your n8n environment
•	Building a fully automated To-Do list system
•	How to troubleshoot when a workflow break
•	Planning out massive, complex business automations
•	Customizing your setups for highly specific tasks
•	Finalizing and turning your workflows on
•	The best ways to talk to Claude to get perfect automations
•	Fixing annoying API and connection errors`,

  "Claude Code Memory Change": `Programme Introduction
Are you tired of having to re-explain your business, your project, or your coding rules to your AI every single day? This course introduces a groundbreaking fix. You will learn how to give your AI an infinite, permanent memory. Once you set this up, your AI will never forget a detail, making it feel like a true digital partner.
Programme Description
This course teaches you how to build a "semantic memory system" using Claude and a database called Pinecone. You will learn how to automatically save every important rule, file, and conversation you have. When you ask a question weeks later, the AI instantly searches this vault and remembers exactly what you are talking about.
Projects You Will Build
•	Total Projects: 1
•	Project Type: AI Knowledge Database
•	What You Build: You will build a Long-Term Memory Vault. You will link your AI to a vector database, allowing it to securely store your documents and project rules, so it can instantly recall details from past conversations months later.
What You Will Learn
•	How to build an infinite memory vault using Claude and Pinecone
•	Why combining AI with a vector database change everything
•	Step-by-step instructions to set up the system in minutes
•	How to save and pull back information instantly
•	What "semantic search" is and why it's smarter than a keyword search
•	How to turn text into "vectors" for the AI to understand
•	Connecting this memory to your emails and project boards
•	Best practices so your database doesn't get messy
•	Real-world examples of how these speeds up your daily work
•	Adding extra tools to make your memory system even more powerful`,

  "Claude Cowork Automations": `Programme Introduction
Are you sick of doing boring, repetitive tasks on your computer every day? Downloading invoices, filling out forms, and copying data are massive wastes of your time. This course teaches you how to turn your AI into a digital coworker that handles all your boring office chores for you automatically.
Programme Description
This course is all about taking your life back from tedious administrative work. You will learn how to use AI to build small, powerful automations that run in the background. From automatically downloading your receipts to finding sales leads, you will set up digital robots that do the heavy lifting so you can focus on real work.
Projects You Will Build
•	Total Projects: 1 (Containing 8 mini-tools)
•	Project Type: Virtual Assistant Workspace
•	What You Build: You will build a Master Productivity Hub. This includes setting up 8 mini-automations: an invoice downloader, a job-application bot, a lead scraper, a meeting-notes organizer, a finance analyzer, a data charter, a competitor tracker, and an auto-responder.
What You Will Learn
•	How to treat AI like a real coworker who does your chores
•	Automating actions inside the software you already use
•	Automatically finding, downloading, and sorting invoices
•	Scraping the internet for leads without copying and pasting
•	Creating a bot that applies for jobs on Indeed for you
•	Extracting meeting notes and putting them into your task manager
•	Scanning your credit card statements for spending habits
•	Taking messy CRM data and turning it into beautiful charts
•	Automating competitor analysis to stay ahead in business
•	Running split tests on websites to see what gets more clicks
•	Getting an automatic morning email with your tasks for the day
•	Having the AI draft email replies that actually sound like you`,

  "Scrap Any Website with N8N": `Programme Introduction
Do you need to copy pricing data, news articles, or competitor lists from a website, but don't know how to code? Stop doing it manually! This course teaches you how to build a digital robot that goes to any website, reads the information, and neatly saves it into a spreadsheet for you, entirely code-free.
Programme Description
This course focuses on the highly valuable skill of "web scraping." You will learn how to set up n8n workflows that act like a human browsing the internet. You will command the system to extract specific text and numbers from websites and organize that messy data into clean, easy-to-read Google Sheets. 
Projects You Will Build
•	Total Projects: 1
•	Project Type: Automated Data Harvester
•	What You Build: You will build a Live Web Scraping Pipeline. You will connect n8n to Firecrawl to scan a target website, use AI to extract the specific text or numbers you need, and automatically push that organized data into a Google Sheet.
What You Will Learn
•	The beginner basics of how web scraping actually works
•	Setting up your n8n workspace for data extraction
•	Connecting a powerful scraping tool called Firecrawl
•	Building the data-grabbing workflows without writing a single line of code
•	Pulling real-time, live data from public websites
•	Automatically sending the scraped information into Google Sheets
•	Using AI to read the scraped data and summarize or format it
•	Running these workflows on a timer so they happen while you sleep
•	Creating forms so users can ask the scraper to find specific things
•	Using RSS feeds to automatically track daily news or blog posts
•	Structuring the final data so it looks clean and professional
•	The ethical rules of scraping so you don't get banned from websites
•	Fixing common errors when websites try to block you`,

  "Set up Google Credentials in n8n": `Programme Introduction
Trying to connect Google Drive or Gmail to your automations, but getting blocked by confusing security screens? Dealing with cloud permissions can be a nightmare for beginners. This rapid-fire course removes all the headache. In just five minutes, you will learn exactly which buttons to click to securely connect your Google apps to n8n.
Programme Description
This is a strict, no-fluff technical guide to navigating Google Cloud security. You will learn how to generate the exact keys, passwords, and permissions needed to make n8n talk to your Google account safely. This is a foundational skill that unlocks the ability to automate spreadsheets, documents, and emails.
Projects You Will Build
•	Total Projects: 1
•	Project Type: Secure API Authentication Setup
•	What You Build: You will build a Verified Google Cloud Connection. You will navigate the Google developer console to generate OAuth credentials, open API pathways, and successfully link your private Google Drive and Gmail to your n8n workspace.
What You Will Learn
•	How to create a proper Google Cloud developer account
•	The exact steps to set up a new security project
•	How to fill out the confusing "OAuth consent screen"
•	Adding yourself as a test user to bypass strict security
•	Generating your secret "Client ID" passwords
•	Authorizing the final connection so n8n can access your files
•	Turning on the specific APIs for Google Drive, Docs, and Gmail
•	How to pull files from Drive directly into your automation workflows
•	Tips for adding extra apps like Google Sheets or Slides later`,

  "Google Antigravity FULL COURSE 2 HOURS": `Programme Introduction
Tired of paying developers thousands of dollars for simple apps? Or spending months trying to learn complex code? Google Antigravity is a revolutionary new way to build software. This course teaches you how to simply talk to AI agents, give them instructions, and watch as they write, test, and launch your application for you.
Programme Description
This is a comprehensive guide to building software without coding. You will learn how to use a team of AI agents inside Google Antigravity to design websites and automate tools. The AI does the heavy lifting; your job is just to manage the project. This is the fastest way to turn your ideas into real, working technology.
Projects You Will Build
•	Total Projects: 2
•	Project Type: Autonomous Self-Coding Apps
•	What You Build:
1.	A High-Converting Landing Page built entirely through conversational text commands.
2.	An Autonomous Software Tool that actively tests its own code and rewrites itself to fix errors.
What You Will Learn
•	What Google Antigravity is and why it changes everything
•	How to properly set up the workspace on your computer
•	Creating your very first app using only simple text commands
•	Managing AI agents like they are your employees
•	How the system automatically finds bugs and fixes its own code
•	Building different projects, from landing pages to complex tools
•	Advanced tricks to make the AI build things even faster
•	Optimizing your apps so they run quickly and smoothly
•	Making multiple AI agents work together on a big project
•	Watching real apps being built live on screen
•	How to troubleshoot if the AI gets confused`,

  "n8n Tutorial 37 Tips and Tricks (n8n Masterclass)": `Programme Introduction
Feeling overwhelmed by n8n? Whether you are a total beginner making your first workflow, or an intermediate user getting stuck on errors, this masterclass is for you. We cover 37 essential, rapid-fire tips that will teach you how to navigate the software, fix broken automations, and organize your projects like a seasoned professional.
Programme Description
This is a massive collection of "aha!" moments for n8n users. You will learn the hidden shortcuts, debugging tricks, and data management skills that separate beginners from experts. By the time you finish, you will know how to confidently build, test, and host complex automations without getting frustrated.
Projects You Will Build
•	Total Projects: 2
•	Project Type: System Architecture & Testing
•	What You Build:
1.	A Local Sandbox Environment running on your computer to test AI connections safely.
2.	A Cloud Deployment Setup where you launch n8n on a virtual private server to handle large data files and queries.
What You Will Learn
•	The fastest ways to navigate the n8n visual canvas
•	Why you must save often and how to recover lost work
•	How to read your "executions" to figure out exactly why a workflow broke
•	"Pinning" data so you can test fixes without running the whole process again
•	What session IDs are and why they matter for tracking data
•	Connecting to dozens of different AI brains using OpenRouter
•	Sharing and backing up your workflows using simple JSON files
•	Having ChatGPT check your code for errors
•	Organizing massive workflows using tags and strict naming rules
•	Connecting to any website using HTTP requests and cURL
•	Storing your passwords and API keys safely inside n8n
•	Knowing exactly when to use a simple AI vs. a smart Agent
•	Using merge nodes to combine data from two different paths
•	Splitting up massive lists of data so the system doesn't crash
•	Hosting n8n on your own private server for ultimate control
•	Querying databases directly using RAG techniques`,

  "CLAUDE CODE ADVANCED COURSE ? 3 HOURS": `Programme Introduction
Already know the basics of Claude Code but feel like you've hit a wall? This course is for users who want to go from beginner to absolute expert. You will push past the frustration of simple prompts and learn how to manage massive projects, automate your web browser, and command entire teams of AI agents to work for you simultaneously.
Programme Description
This is an in-depth masterclass for advanced AI users. You will learn how to drastically optimize how your AI writes code, handle massive files, and run extreme parallel tasks (making the AI do 10 things at once). These are the professional skills that save developers thousands of hours and completely change how they work.
Projects You Will Build
•	Total Projects: 2
•	Project Type: Multi-Agent Systems & Automations
•	What You Build:
1.	An Extreme Parallel Task Engine that splits a massive project among multiple AI agents to finish in record time.
2.	A Browser Automation Bot that navigates websites on its own to test for bugs and gather data.
What You Will Learn
•	Advanced techniques for system prompt and Cloud.andes files
•	Writing system instructions that guarantee perfect outputs
•	Understanding "agent heart disease" (when AI gets stuck) and how to fix it
•	Extreme task parallelization: Making sub-agents work at the same time
•	Managing complex skills and organizing your AI teams
•	The "Carpathese auto-research method" for self-improving code
•	Practical use cases for deploying these high-level techniques
•	Using browser automation tools to test websites automatically
•	Handling days when the AI model is acting slow or dumb
•	Alternatives to Claude Code to boost your workflow
•	Organizing workspaces to separate personal, business, and client work
•	Enterprise-level security for large software projects
•	What the future of AI coding looks like`,

  "CLAUDE CODE FULL COURSE 4 HOURS ? Build & Sell (2026)": `Programme Introduction
Always wanted to build a web app but don't know the first thing about coding? This 4-hour masterclass is your complete A-to-Z guide. We start at the very beginning—downloading the tools—and take you all the way to building and launching a live web app. You will learn the exact skills needed to build digital products you can actually sell.
Programme Description
This is the ultimate beginner-to-intermediate coding bootcamp using Claude Code. You will learn everything from setting up your digital workspace to managing complex folders, using different AI coding modes, and automating your daily life. It is highly practical; you will learn by building real things you can use immediately.
Projects You Will Build
•	Total Projects: 3
•	Project Type: Full-Stack Applications & Workflows
•	What You Build:
1.	A Live Web Application hosted on the internet for public use.
2.	An Automated Email Manager that sorts and replies to messages.
3.	An Automated Bookkeeping Tool to track your project expenses.
What You Will Learn
•	How to download and securely set up Claude Code
•	Understanding what an IDE (coding workspace) is
•	Setting up your project's "brain" (the .md file)
•	Building a functional web app and putting it live on the internet
•	Navigating folders and the "Subagents" directory
•	Using Plan Mode vs. Permissions Mode effectively
•	Managing the AI's memory to stop it from getting confused
•	Using slash commands to speed up your work
•	Implementing "hooks" to make tasks happen automatically
•	Creating custom skills for highly specialized AI workers
•	Setting up the Model Context Protocol (MCP) for deep automation
•	Building an automatic email manager and a bookkeeping tool
•	Exploring plugins and the AI marketplace
•	Connecting Google Chrome's developer tools to your AI
•	Using subagents with special tool access
•	Managing "work trees" so you never lose your progress
•	Scaling your projects up for real-world production`,

  "4 Claude Code Hacks To Make Any Website Look Pro": `Programme Introduction
Frustrated that your websites look like they were made by a beginner? This course is the shortcut to creating stunning, high-end websites instantly. Using four simple tools, you will learn to make your web pages look professional, modern, and eye-catching. You will leave this course able to design landing pages that immediately grab attention.
Programme Description
This course teaches you how to transform a boring website into a visual masterpiece. You will learn four easy "hacks" using Claude Code that require absolutely zero graphic design or traditional coding skills. You’ll learn to add impressive 3D graphics and animations that make your site look like you paid an agency thousands of dollars to build it.
Projects You Will Build
•	Total Projects: 1
•	Project Type: 3D Animated Landing Page
•	What You Build: You will build a Cinematic Product Showcase Website. You will integrate real 3D graphics, high-speed AI background videos, and interactive image sliders, and launch it live on the internet for free.
What You Will Learn
•	How to build beautiful landing pages in just 10 minutes
•	How to create stunning 3D graphics to enhance your layout
•	Using AI videos to showcase products or services
•	Making interactive before-and-after images for marketing
•	Using simple tools like 3JS and Spline for dynamic visuals
•	Developing high-end websites without typing code
•	Deploying your website live for free using GitHub and Vercel
•	Optimizing your video sizes so your site loads incredibly fast
•	Stealing design inspiration from giants like Netflix
•	Creating engaging content that keeps visitors scrolling`,

  "12 Ways to Fix Context in Claude Code": `Programme Introduction
Are you struggling to keep your instructions clear while using Claude Code? Just like a messy desk, your AI's "context" can get cluttered the more you use it. This course will show you 12 simple ways to organize that workspace. After taking this course, you'll be able to manage your AI better and make Claude Code work for you much faster.
Programme Description
This course is all about improving how you communicate with Claude Code. You'll learn 12 practical tips to keep your AI's memory organized and efficient. By the end, you'll be able to code without getting bogged down by unnecessary information. This will save you hours of frustration and help you work effectively.
Projects You Will Build
•	Total Projects: 1
•	Project Type: Workspace Performance Setup
•	What You Build: You will build a Custom Context Cleanup System. You will set up an ultra-lean .claudemd memory file, establish strict prompt rules, and create a system to handle massive files without crashing your AI.
What You Will Learn
•	Why AI memory (context) gets cluttered over time
•	How to shorten your cloud.md file for faster performance
•	The importance of adding limits to your prompts
•	How to break big tasks into smaller "skills"
•	Using reference files so the AI doesn't get overwhelmed
•	Handling large files without breaking the system
•	How changing AI models affects your usage
•	Using the /context command to check your status
•	How and when to safely reset your AI's memory
•	Managing files to avoid a messy workspace
•	Removing unused connections to save memory space
•	Using "subagents" to break down massive projects`,

  "27 Claude Code TIPS": `Programme Introduction
Are you feeling lost when using Claude Code? Don't waste time trying to figure out all the buttons and commands on your own! This course is here to save you time. With 27 highly practical tips, you'll be able to use Claude Code like a seasoned pro. After completing this, you'll confidently build beautiful websites and manage digital projects with ease.
Programme Description
This program gives you 27 direct, easy-to-understand shortcuts that will drastically improve your coding experience. You will learn the hidden tricks to creating stunning websites and handling multiple tasks at once. These tips will help you avoid the most common beginner mistakes and rapidly speed up your learning curve.
Projects You Will Build
•	Total Projects: 1
•	Project Type: AI-Guided Responsive Website
•	What You Build: You will build a Polished Web Application. Using design inspiration, you will set up custom shortcuts, deploy a project specification file, and use parallel AI agents to build a complete, beautiful website layout.
What You Will Learn
•	How to download and set up VS Code or Antigravity for Claude Code
•	Tips for turning Dribbble design inspiration into real websites
•	Why using multiple tabs speeds up your workflow
•	How to bypass annoying permission prompts
•	Adding voice dictation to code with your speech
•	The best questions to ask Claude to guide your project
•	How to use Cloud.MD and project_specs files
•	Ways to get better code using feedback loops
•	How to keep the AI focused during long conversations
•	Setting up a memory system so Claude remembers your preferences
•	How to queue multiple messages at once
•	Accessing plugins for pre-built design solutions
•	Understanding workflows for better project efficiency
•	How to use "subagents" to do two tasks at once
•	How to stop or rewind the AI when it makes a mistake
•	Setting up auto-save so you never lose work
•	Compiling your conversation history
•	Analyzing your progress through insights reports`,

  "Automated Faceless Shorts with AI": `Programme Introduction
Tired of spending hours recording and editing videos for YouTube? Overwhelmed by cameras, microphones, and editing software? This course removes all of that. You will learn how to create and publish highly engaging "faceless" short videos using entirely automated AI. You will build a system that makes videos for you, letting your channel grow while you sleep.
Programme Description
This course teaches you how to put your YouTube content creation on autopilot. You will learn, step-by-step, how to automatically generate video ideas, create visuals, produce the final video, and add a voiceover. It’s an incredibly valuable skill that saves you endless hours while rapidly building your online audience.
Projects You Will Build
•	Total Projects: 1
•	Project Type: Automated Social Media Factory
What You Build: You will build a Hands-Free YouTube Shorts Machine. You will connect a Google Sheet to AI scriptwriters, image generators, and voiceover tools to automatically create, edit, and upload a finished video directly to your YouTube channel.

What You Will Learn
•	How the fully automated faceless video workflow operates
•	Setting up Google Sheets to store and manage your video ideas
•	Generating high-quality images based on text prompts
•	Turning static images into engaging video clips
•	Adding professional AI voiceovers and audio tracks
•	Automatically uploading the final videos to YouTube
•	Creating email alerts for when a video is finished
•	Optimizing the whole system so it runs smoothly
•	Ways to scale up and produce even more videos
•	How to manage the costs of the AI tools you use`,

  "Claude Cowork Marketing": `Programme Introduction
Struggling to get customers because marketing feels too expensive and confusing? You don't need a huge budget or a massive team anymore. This course teaches you how to use AI to act as an elite marketing department. You will learn how to track trends, design materials, and beat your competitors—all by yourself.
Programme Description
This program breaks down the seven essential marketing skills you can entirely automate using AI. You will learn to configure systems that constantly watch your industry, gather intelligence on your rivals, and create high-converting promotional materials. It’s like hiring a full-time marketing agency for free.
Projects You Will Build
•	Total Projects: 2
•	Project Type: Marketing Intelligence Systems
•	What You Build:
1.	A Trend Intelligence Dashboard that automatically tracks industry news and competitor moves.
2.	A Notion Marketing Operating System that organizes your campaigns and uses AI to generate your promotional copy.
What You Will Learn
•	How to turn Claude into a world-class marketing director
•	The seven most important marketing skills for modern business
•	How to spy on industry trends without paying for expensive software
•	Monitoring your competitors automatically
•	Streamlining your promotional campaigns with automation
•	Building a "Mission Control" dashboard to see all your stats at once
•	Using AI to review contracts and partnerships safely
•	Designing professional marketing materials in seconds
•	Building a complete productivity system connecting Notion and your AI`,

  "From Zero to RAG Agent": `Programme Introduction
Curious about how companies build AIs that know all their private company secrets? Normal AI only knows what is public on the internet. This course teaches you how to safely feed your own private PDFs, manuals, and documents into an AI without writing any code. You will build an assistant that is an expert on your specific data.
Programme Description
This course introduces you to "RAG" (Retrieval-Augmented Generation) in a completely beginner-friendly, no-code way. You will learn how to take a stack of your own documents, load them into a secure database, and build a chat window where you can ask questions and get answers based only on your files.
Projects You Will Build
•	Total Projects: 1
•	Project Type: Private Document AI Bot
•	What You Build: You will build a Custom Knowledge Chatbot. You will set up a system that reads your private PDFs, stores them in a secure vector database, and provides a chat interface where you can ask questions and get exact answers from your documents.
What You Will Learn
•	What a "RAG Agent" actually is in plain English
•	The core concepts of Retrieval Augmented Generation
•	What a vector database is and why it's the secret to smart AI
•	Setting up a pipeline to securely feed your files to the AI
•	Chopping massive documents into small pieces the AI can read
•	How text is converted into numbers (embeddings)
•	Storing your data safely in the database
•	Building the actual AI agent that talks to your data
•	Creating a chat interface so you can ask it questions
•	Adding memory so the AI remembers the conversation history
•	Hooking the agent up to respond via chat window or email
•	Automating updates so the AI always has your newest files
•	Managing this entire complex system without writing code`,

  "Insane Youtube Automations": `Programme Introduction
Do you want to run a highly profitable YouTube channel without ever showing your face or editing a single clip? This course is the ultimate blueprint for automated video creation. You will learn how to connect powerful AI tools together to write, voice, and edit viral short videos completely automatically.
Programme Description
This course breaks down the exact technical pipeline to build a "YouTube Shorts" factory. You will learn how to take a simple one-sentence idea and have AI generate the script, the images, and the human-sounding voice. The system will then edit it all together perfectly. You get to be the director while the AI does the grueling production work.
Projects You Will Build
•	Total Projects: 1
•	Project Type: Cross-Platform Video Factory
•	What You Build: You will build a Complete Automated Video Pipeline. You will connect text AI, image generators, and audio tools to automatically write a script, generate a voiceover, compile images, edit the video, and format it for YouTube and TikTok.
What You Will Learn
•	The complete strategy behind successful YouTube Shorts automation
•	Commanding AI to write highly engaging, viral video scripts
•	Creating hyper-realistic voiceovers using audio AI
•	Generating stunning visual images that match your script perfectly
•	Automating the editing process to stitch it all into one video
•	Using these videos to sell products or grow your brand
•	How to re-format the videos so they also work on TikTok and Instagram
•	Setting up a system that starts making a video the moment you type an idea
•	Using OpenAI to generate endless creative angles
•	Uploading your massive video files to the cloud safely
•	Exporting a final, polished video ready to go viral`,

  "n8n Blogging Automation: Generate SEO Blogs in Minutes": `Programme Introduction
Do you want a blog that brings thousands of visitors to your website, but you hate writing? This course is your solution. You will learn how to build an automated machine that researches topics, finds keywords, and writes perfectly formatted articles that Google loves—all in a matter of minutes.
Programme Description
This course focuses on building a commercial-grade content factory using n8n. You will learn the strict rules of Search Engine Optimization (SEO) and how to program an AI to follow them perfectly. Not only will this save you time, but you can easily sell this automated blogging service to other businesses for recurring income.
Projects You Will Build
•	Total Projects: 1
•	Project Type: Commercial SEO Content Engine
•	What You Build: You will build a Fully Automated Blog Factory. You will create a workflow that takes a basic topic, researches SEO keywords, writes a multi-paragraph structured article, and automatically publishes it to a content management system.
What You Will Learn
•	Setting up n8n specifically for content creation
•	The golden rules of SEO and why they matter for traffic
•	How to command the AI to write on any topic, at any length
•	Interacting with the system to fine-tune your blog ideas
•	How the AI researches facts and outlines the article structure
•	Generating the perfect keywords to guarantee Google rankings
•	Ensuring the blog is formatted with proper headings and sections
•	Connecting the system to post directly to your website
•	How to package this exact system and sell it to clients
•	Tweaking the AI's tone for different industries (e.g., medical vs. tech)`,

  "n8n Tutorial Build ANYTHING with MCP Servers in n8n (Beginner to Pro)": `Programme Introduction
Do you want to build automations that pull data from the internet, but feel blocked by technical hurdles? This course unlocks the ultimate superpower in automation: MCP Servers. You will learn how to give your AI the ability to securely browse websites, scrape data, and connect deep into the web to build truly limitless tools.
Programme Description
This course takes you from a beginner to a pro at managing server connections inside n8n. You will learn how to set up web scrapers that ethically copy data from websites and feed it directly into your AI brains. It is a highly practical, hands-on course that gives you complete control over web data.
Projects You Will Build
•	Total Projects: 1
•	Project Type: Live Web Data Extractor
•	What You Build: You will build a Firecrawl-Powered Web Scraper. You will configure server connections inside n8n to safely pull real-time data from public websites and feed that data directly into an AI agent for processing.
What You Will Learn
•	What an MCP Server is in simple terms and why you need it
•	How to build an automated web scraper
•	Connecting your web scraper directly to a smart AI agent
•	The difference between "client side" and "server side" connections
•	Keeping your n8n workspace clean and organized
•	Ensuring you are using the correct version of n8n
•	Building workflows that rely on these deep server connections
•	Using "HTTP requests" to talk to any tool on the internet
•	The rules of ethical web scraping so you don't get blocked
•	Setting up the "Firecrawl" tool to pull data perfectly
•	Testing your connections to make sure the data flows safely
•	Building custom, powerful automation tools with total confidence`,

  "Never label gmail emails again": `Programme Introduction
Is your email inbox a chaotic mess of thousands of unread messages? Are you tired of dragging emails into folders? This course will rescue your inbox. You will learn how to train an AI to read your incoming emails, understand what they are about, and sort them into the perfect folders automatically.
Programme Description
This course teaches you how to build a smart email classification system. By connecting AI to your Gmail, you will create a digital assistant that instantly knows if an email is a work project, a personal note, a receipt, or spam. It will clean up your new emails and even organize years of old, messy emails in minutes.
Projects You Will Build
•	Total Projects: 1
•	Project Type: AI Email Organization Workflow
•	What You Build: You will build an Automated Gmail Sorter. You will set up an AI workflow that reads your incoming messages, figures out the context (work, spam, personal), applies the correct Gmail labels, and runs a cleanup routine on your historical emails.
What You Will Learn
•	How AI actually reads and understands the context of your emails
•	Setting up the automation to catch and sort brand-new emails
•	How to run a massive "batch process" to sort thousands of old emails
•	Filtering rules so the AI doesn't double-label things
•	Converting messy HTML emails into clean text for the AI to read
•	Having the AI create and apply Gmail tags for you
•	Using automation to completely remove the stress of an inbox
•	Testing the system safely so it doesn't delete important things
•	Optimizing the workflow so it doesn't crash when sorting 10,000 emails`,

  "Alternatives to N8N in 2026": `Programme Introduction
Are visual drag-and-drop workflow builders starting to feel clunky and slow? The future of automation is changing rapidly. This course introduces you to "GENTIC workflows"—a new method where you simply type what you want to happen in plain English, and the system builds the automation instantly without any messy visual boxes.
Programme Description
This course prepares you for the next generation of digital automation. You will move away from traditional platforms and learn how to use Claude Code and tools like Trigger.dev to build automations using just text. It is a faster, cleaner, and highly demanded skill that will put you years ahead of average automation builders.
Projects You Will Build
•	Total Projects: 1
•	Project Type: Serverless Text-Driven Automation
•	What You Build: You will build a GENTIC Automation Layer. Using Claude Code and a serverless environment, you will create a workflow triggered by simple text commands that executes tasks in the background without relying on visual drag-and-drop editors.
What You Will Learn
•	Why the tech industry is moving away from visual drag-and-drop builders
•	How to write automations using natural, plain English language
•	Using Claude Code to write the underlying logic for you
•	The massive speed advantages of GENTIC workflows
•	Identifying the best new tools in this modern automation landscape
•	Why businesses are paying top dollar for "Agent AI" workflows
•	The common mistakes people make when switching to this new style
•	How to monitor your automations to ensure they don't break
•	Troubleshooting code-based workflows easily
•	Hands-on experience building real automations without visual nodes`,

  "VIBE CODING FULL COURSE: Gemini 3.1 + Antigravity": `Programme Introduction
Are you wasting time trying to learn complex programming languages from scratch? Building an app can feel overwhelming and often leaves people stuck at the beginner level for months. This course introduces "Vibe Coding"—a revolutionary method where you use plain English to instruct Gemini 3.1 and Google Antigravity to build the software for you. Launch your ideas faster than ever before.
Programme Description
This course is a complete guide to building functioning web applications without having to manually type out complex syntax. You will learn the exact sequence of steps to configure your AI assistant, write crystal-clear plain English instructions, and let the AI generate the actual code. It is the perfect entry point for non-technical founders to build real digital products.
Projects You Will Build
•	Total Projects: 1
•	Project Type: Plain-Text Developed Web App
•	What You Build: You will build a Live, Database-Driven Web Application. Using only conversational English prompts (Vibe Coding), you will instruct Gemini to generate the layout, wire up a user login system, connect a database, and deploy the application live to the web.
What You Will Learn
•	How to properly set up the Gemini 3.1 AI coding environment
•	Using Google Antigravity to translate plain text into working software
•	The formula for writing the perfect "first prompt" to structure your app
•	Techniques to ensure the AI remembers your project rules and design choices
•	How to safely run tests and have the AI fix its own coding errors
•	Adding complex features like secure user logins and databases without coding
•	The exact steps to take your finished app and launch it live on the internet`,

  "Agentic Workflow for Businesses": `Programme Introduction
Are you spending too much time on repetitive business tasks? Managing emails, customer questions, and daily operations can leave you feeling stressed and overworked. This course teaches you how to build smart AI agents that handle these tasks for you. By the end, you will be able to run your daily operations on autopilot, giving you the freedom to focus on growing your business and taking control of your time.
Programme Description
This course is a step-by-step guide to creating automated AI workflows tailored specifically for business owners. You will learn how to set up AI agents that act like digital assistants, connecting them to the tools you already use every day. You will build systems that read data, make decisions, and complete tasks without your help, significantly reducing your daily workload.
Projects You Will Build
•	Total Projects: 1 (Multi-stage)
•	Project Type: Business Operations Automation
•	What You Build: You will build an Automated Customer Service & Data Agent. You will connect an AI to your business email and spreadsheet software to automatically read incoming customer questions, draft accurate replies, and log the interaction data into a tracker.
What You Will Learn
•	What an AI agent is and how it functions as a digital employee
•	How to identify which repetitive office tasks you should automate first
•	Step-by-step instructions on setting up your very first AI agent
•	Connecting your AI securely to your business email and calendar
•	Building a 24/7 workflow to answer common customer support questions
•	Using AI to automatically gather messy data and format it in spreadsheets
•	Safe testing methods to ensure your agents don't make mistakes
•	Managing a team of multiple AI agents so they hand off tasks smoothly
•	Tracking your workflows to measure exactly how many hours you are saving
•	Troubleshooting and fixing common app connection errors`,

};
const AGENTIC_SLUG_TO_KEY: Readonly<Record<string, string>> = {
  agentic_ai: "__module_pack__",
  "Build a Blog Writing Agent With N8N": "Build a Blog Writing Agent With N8N",
  agentic_ai_c01: "Build a Blog Writing Agent With N8N",
  agentic_ai_c02: "Build a WhatsApp Agent with n8n",
  agentic_ai_c03: "Build Apps With secret Claude Code Skill",
  agentic_ai_c04: "Claude Code + Consensus for INSANE $50k+ App Ideas",
  agentic_ai_c05: "Is Claude Code Better than n8n",
  agentic_ai_c06: "Claude Code Memory Change",
  agentic_ai_c07: "Claude Cowork Automations",
  agentic_ai_c08: "Scrap Any Website with N8N",
  agentic_ai_c09: "Set up Google Credentials in n8n",
  agentic_ai_c10: "Google Antigravity FULL COURSE 2 HOURS",
  agentic_ai_c11: "n8n Tutorial 37 Tips and Tricks (n8n Masterclass)",
  agentic_ai_c12: "CLAUDE CODE ADVANCED COURSE — 3 HOURS",
  agentic_ai_c13: "CLAUDE CODE FULL COURSE 4 HOURS — Build & Sell (2026)",
  agentic_ai_c14: "4 Claude Code Hacks To Make Any Website Look Pro",
  agentic_ai_c15: "12 Ways to Fix Context in Claude Code",
  agentic_ai_c16: "27 Claude Code TIPS",
  agentic_ai_c17: "Automated Faceless Shorts with AI",
  agentic_ai_c18: "Claude Cowork Marketing",
  agentic_ai_c19: "From Zero to RAG Agent",
  agentic_ai_c20: "Insane Youtube Automations",
  agentic_ai_c21: "n8n Blogging Automation: Generate SEO Blogs in Minutes",
  agentic_ai_c22: "n8n Tutorial Build ANYTHING with MCP Servers in n8n (Beginner to Pro)",
  agentic_ai_c23: "Never label gmail emails again",
  agentic_ai_c24: "Alternatives to N8N in 2026",
  agentic_ai_c25: "VIBE CODING FULL COURSE: Gemini 3.1 + Antigravity",
  agentic_ai_c26: "Agentic Workflow for Businesses",
};

export function agenticAiTeaser(description: string): string {
  return extractProgrammeIntroductionTeaser(description);
}

export function curatedAgenticAiDescription(
  slug: string | null | undefined,
  title: string | null | undefined,
): string | undefined {
  const slugKey = slug?.trim().toLowerCase();
  if (slugKey && AGENTIC_SLUG_TO_KEY[slugKey]) {
    return AGENTIC_AI_PROGRAM_DESCRIPTIONS[AGENTIC_SLUG_TO_KEY[slugKey]];
  }
  const titleKey = title?.trim();
  if (titleKey && AGENTIC_AI_PROGRAM_DESCRIPTIONS[titleKey]) {
    return AGENTIC_AI_PROGRAM_DESCRIPTIONS[titleKey];
  }
  return undefined;
}

export function curatedAgenticVaultPackDescription(pack: VaultPackKey): string | undefined {
  if (pack === "agentic_ai") return AGENTIC_VAULT_PACK_STRUCTURED_DESCRIPTION;
  return undefined;
}
