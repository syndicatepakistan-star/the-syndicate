/**
 * Curated AI Content Automation vault pack + module copy — vault modals and program library.
 * Section headers: Programme Introduction, Programme Description, What You Will Learn.
 */
import type { VaultPackKey } from "@/components/programs/planOfferCatalog";
import { extractProgrammeIntroductionTeaser } from "@/lib/structuredDescription";

export const AI_CONTENT_VAULT_PACK_TITLE = "AI Content Automation";

export const AI_CONTENT_VAULT_PACK_STRUCTURED_DESCRIPTION = `Programme Introduction
Are you dreaming of starting a successful YouTube channel but feel overwhelmed by complicated video editing, writing scripts, or the thought of showing your face on camera? You are definitely not alone! This complete AI Content Automation pack is designed to help you break through the confusion and get started right away. We will guide you step-by-step to build profitable, "faceless" digital channels using simple, often free AI tools. By the end of this journey, you will know exactly how to create engaging videos that attract viewers, giving you the freedom to build an online presence and take control of your time.

Programme Description
This ultimate course bundle is your all-in-one guide to dominating YouTube and social media without ever stepping in front of a lens. You will learn how to launch and automate channels across a variety of proven niches—from cinematic 3D documentaries and finance videos to viral YouTube Shorts and even AI influencers. We will show you how to safely use smart tools like Google's NotebookLM and AI video generators to do the heavy lifting of research, scripting, and editing for you. This pack is incredibly valuable because it takes you from a total beginner to a confident creator, helping you avoid common mistakes (and banned YouTube policies!) while building an automated content system that works around the clock.


What You Will Learn
How to choose from 50 highly profitable faceless niches and easily identify which risky, policy-breaking niches to avoid
Step-by-step methods to set up, brand, and launch a professional YouTube channel from scratch, complete with AI-generated logos and banners
The secret "script bending" technique to write viral, high-retention video scripts that keep your audience hooked until the end
How to quickly generate hundreds of YouTube Shorts in just minutes using completely free AI tools
The exact blueprints to create stunning 3D documentaries, finance videos, geography shorts, and stickman animations without any complex software
How to use Google NotebookLM to analyze and learn from top creators' success formulas so you can generate original ideas without copying
Ways to generate lifelike AI voiceovers, eye-catching thumbnails, and dynamic motion graphics even if you have zero design skills
How to build, customize, and monetize your very own digital "AI Influencer" from the ground up
Strategies to optimize your video titles, tags, and descriptions for the YouTube search engine so you get more views
How to turn your content creation into a fully automated machine, allowing you to scale up, hire freelancers, and free up your schedule`;

export const AI_CONTENT_PROGRAM_DESCRIPTIONS: Readonly<Record<string, string>> = {
  __module_pack__: AI_CONTENT_VAULT_PACK_STRUCTURED_DESCRIPTION,

  "Beginners Guide to Faceless YouTube in 2026 (3 hours)": `Programme Introduction
Are you feeling stuck trying to create content for YouTube but don't want to show your face? Do you want to make money but don't know where to start? This course is designed for you. We will guide you through the world of faceless YouTube channels. By the end, you will understand how to create videos and potentially earn money, all while staying behind the scenes.

Programme Description
This course teaches you how to start a faceless YouTube channel. You'll learn the steps to find your niche, build a team, and create videos without being on camera. The skills you gain will allow you to manage your time better and possibly earn extra income. This course is worth your time if you want to explore a new way to create content and earn money online.


What You Will Learn
How to make money with faceless YouTube channels
Understand the business model of YouTube automation
Steps to choose a profitable niche for your channel
How to hire a team to help create videos
Tips for finding money-making video ideas
Importance of YouTube's partner program and how it pays for views
Strategies to research successful channels in your niche
The best tools and platforms for outsourcing video creation
How to manage your channel with minimal effort after setup
Common mistakes to avoid when starting your channel
Ways to use AI to enhance your video creation process
How to find and create content that resonates with viewers
Tips for evolving your channel to keep it profitable`,

  "New YouTube Policy ENDS These Faceless YouTube Channels": `Programme Introduction
You might be worried about your YouTube channel's future. Many channels seem to succeed for a while, only to fade away quickly. This course will help you understand the new YouTube policies and how to build a channel that lasts. By the end, you'll know how to choose the right niche and grow your channel for the long term.

Programme Description
This course is all about understanding the changes happening on YouTube and how to adapt. You will learn how to select profitable niches and create content that stands out. The skills you gain will help you build a channel that not only survives but thrives over time. It's an investment in your future as a content creator.


What You Will Learn
Why many YouTube channels fail after initial success
Four examples of channels that made money but have declined
Five long-term niche ideas with strong revenue potential
How to create a unique channel that stands out from the competition
The importance of building a barrier to entry in your niche
How to monetize your channel beyond ad revenue
The concept of "niche bending" and why it matters
Strategies to revive channels that are struggling
The stages of growth for YouTube channels and how to navigate them
Tips for creating high-quality content that attracts viewers
How to leverage trends and audience interests to grow your channel
The best practices for choosing a niche based on your interests and expertise
Ways to integrate affiliate marketing and info products into your strategy
How to scale your YouTube channel over time for greater income potential`,

  "Start YouTube Automation in 2026 (Step By Step) NO FACE": `Programme Introduction
Are you feeling lost when it comes to starting a YouTube channel? Do you want to build a successful channel without showing your face? This course will guide you step by step through the process of YouTube automation in 2026. You'll learn how to create content, pick profitable topics, and monetize your channel. After completing this course, you'll be ready to launch and grow your own faceless YouTube channel.

Programme Description
This course is all about mastering YouTube automation without needing to appear on camera. You will learn essential skills like finding the best niches, creating engaging content, and monetizing effectively. This course is worth your time because it takes a fresh approach to YouTube that many creators overlook. You'll gain insights that can lead to a successful and profitable channel.


What You Will Learn
The five secrets for successful YouTube automation in 2026
How to identify the best niches for your channel
New strategies for generating content easily
Ways to monetize your YouTube channel effectively
How to avoid common pitfalls with AI-generated content
The importance of session time and how to increase it
The value of creating a money video to boost income
How to structure your channel and content for growth
The best tools and systems for running multiple channels
Tips for outsourcing tasks to grow your channel faster`,

  "Build Faceless YouTube Channels Using Just ONE AI Tool (Genspark AI)": `Programme Introduction
Are you confused about how to start a YouTube channel without showing your face? It can be tricky, and you might feel stuck or overwhelmed. This course will guide you through the whole process using just one powerful AI tool, Genspark. By the end, you'll know how to create a faceless channel that attracts viewers and generates income.

Programme Description
This course is all about building faceless YouTube channels step by step. You'll learn how to choose a winning niche, create engaging video scripts, and design eye-catching thumbnails. The best part? You'll do it all using Genspark, an easy-to-use AI tool. This course is worth your time because it simplifies everything and gives you the skills to take control of your content creation.


What You Will Learn
Understand the concept of faceless YouTube channels and their popularity
Learn how to find a high-performing niche for your channel
Create unique channel names and descriptions
Design a professional logo that fits your brand
Develop viral video ideas based on current trends
Write high-retention video scripts that keep viewers engaged
Generate visuals and videos using AI tools
Create optimized video descriptions and tags for better reach
Design eye-catching thumbnails for your videos
Put together an infotainment presentation for your brand
Explore advanced features like custom agents and website creation with Genspark`,

  "Build a VIRAL AI Movie Channel Using Only AI Tools": `Programme Introduction
Are you tired of feeling stuck when it comes to making videos? Do you dream of creating short movies that get millions of views, but think it requires a big team and budget? This course is here to help you! You will learn how to create high-quality movies using advanced AI tools. After completing this course, you'll know how to set up your own successful AI movie channel and create engaging content that captivates viewers.

Programme Description
This course teaches you how to build a viral AI movie channel from scratch. You will learn to make captivating short films using AI tools that simplify the process. By the end of the course, you will have the skills to create your own movies, optimize them for success, and build your brand on YouTube. It's a valuable investment of your time if you want to take control of your creative journey and share your stories with the world.


What You Will Learn
How to identify trending movie ideas for your channel
The steps to create a unique YouTube channel name and description
How to design a branded logo for your channel
Tips for choosing a high-performing niche for your movies
How to write effective prompts for AI tools to create movies
The process of generating characters and scenes using AI
How to animate scenes and add audio to your movies
Techniques to customize and improve your movie scenes
The steps to upload your movie to YouTube for maximum visibility
How to create eye-catching thumbnails and optimize your video metadata`,

  "Create Viral High RPM Finance Videos Using AI (Full Blueprint)": `Programme Introduction
Are you struggling to create engaging finance videos that attract viewers? Maybe you feel stuck and don't know where to start. This course will guide you step by step. You'll learn how to use AI tools to create viral videos that earn money. By the end, you will have the skills to build your own finance channel and create videos that stand out.

Programme Description
This course teaches you how to create viral finance videos using simple techniques and AI tools. You will learn how to start your own channel, create engaging scripts, and make eye-catching visuals. This is worth your time because you will gain practical skills that can help you earn money and grow your online presence.


What You Will Learn
How to identify successful finance channels on YouTube
The importance of using AI to create videos
Steps to build your own finance channel
How to come up with catchy channel names and descriptions
Techniques for creating a strong video script
How to generate engaging voiceovers using AI
How to create visuals that match your script
Tips for finding the right background music
How to edit your video professionally
Techniques for optimizing your video for better reach
How to create an eye-catching thumbnail
Using tools to write an optimized video description and tags
The importance of publishing your video correctly
Strategies to maintain momentum and grow your channel`,

  "Make VIRAL 3D Animated Videos Using FREE AI Tools (FULL COURSE)": `Programme Introduction
Are you struggling to create engaging videos that get noticed? Do you feel overwhelmed by the complexity of video production? This course is here to help you. You'll learn how to create eye-catching 3D animated videos using free AI tools. By the end, you'll be able to produce videos that can go viral and attract a large audience.

Programme Description
This course teaches you how to create viral 3D animated videos from start to finish. You'll learn how to use free AI tools to simplify the video-making process. With easy-to-follow steps, you will gain the skills to produce high-quality animations without the need for expensive software or a big team. It's the perfect opportunity to take control of your creativity and make engaging videos that stand out.


What You Will Learn
How to identify trending niches for your videos
The secrets behind engaging storylines and polished animations
How to set up a YouTube channel with a strong brand
Generating unique channel names and descriptions using AI
Creating an eye-catching logo with free AI tools
Using SEO techniques to improve your channel's visibility
Writing high-performing scripts for animated stories
Creating professional voiceovers using text-to-speech tools
Generating high-quality images for your animations
Techniques to animate images for a cinematic feel
Editing your videos to ensure a smooth final product
Uploading videos to YouTube with optimized descriptions and tags
Exploring advanced AI tools to speed up the video creation process`,

  "Build a Viral AI Influencer (AI Instagram Models)": `Programme Introduction
Are you curious about how some influencers seem to come out of nowhere and gain thousands of followers? You might feel confused about how they do it. This course will show you how to create your own AI influencer, just like those popular ones. By the end, you'll know how to build a digital model that can attract followers and even make money online.

Programme Description
This course is all about creating a successful AI influencer. You will learn step-by-step how to build a unique online personality that looks real but is created using AI tools. You'll also discover how to create engaging content and turn your influencer into a money-making brand. This is a valuable skill set that can give you more control over your time and income.


What You Will Learn
Understand the rise of AI influencers and their impact on social media
Learn to create a fully customizable AI influencer model
Conduct niche research to find a trending topic to focus on
Create content that fits perfectly within your chosen niche
Discover how to monetize your AI influencer on a dedicated platform
Generate stunning images and videos featuring your model
Customize your model's appearance and personality using AI tools
Use prompts to create high-quality image and video content
Automate audience engagement through effective online strategies
Explore how to set up a subscription model for consistent income`,

  "Make a VIRAL AI Documentary Channel Using FREE Tools (FULL COURSE)": `Programme Introduction
Have you ever thought about starting a YouTube channel but felt lost or overwhelmed? Many people want to create documentaries but don't know how or think it costs too much. This course will show you how to easily create viral travel documentaries using free tools. By the end, you'll be able to launch your own channel and create videos that attract viewers.

Programme Description
This course teaches you how to make travel documentaries that can go viral on YouTube. You'll learn to use simple AI tools to create high-quality videos quickly and without spending money. This is a great opportunity to gain valuable skills and take control of your content creation journey.


What You Will Learn
Understand the rise of travel documentaries on YouTube
Discover successful channels and their growth stories
Learn how to set up a branded channel for your documentaries
Create compelling video scripts using AI tools
Generate engaging visuals for your documentaries with free software
Discover how to edit videos easily with user-friendly tools
Optimize your videos for YouTube to maximize visibility
Learn the steps to upload and promote your videos effectively
Create eye-catching thumbnails that attract clicks
Get free resources for music and stock footage to enhance your videos`,

  "Build a VIRAL Philosophy Channel Using FREE AI Tools (FULL COURSE)": `Programme Introduction
Are you confused about how to start a YouTube channel? Do you feel stuck, thinking it takes too much time and effort? This course will guide you step by step. You'll learn how to build a viral philosophy channel using free AI tools. After completing this course, you'll have the skills to create engaging videos and grow your audience.

Programme Description
This course teaches you how to create a successful philosophy channel on YouTube. You will learn to use free AI tools to plan, create, and optimize your videos. By the end, you'll have the skills to produce high-quality content and attract viewers. It's a valuable investment of your time that can lead to freedom in your creative journey.


What You Will Learn
Understand the success of popular philosophy channels on YouTube
Discover the basics of creating a branded YouTube channel
Use AI tools to generate engaging video ideas and scripts
Create visually appealing logos and thumbnails for your channel
Optimize your channel settings for better visibility
Learn the steps to produce high-quality videos with voiceovers
Edit your videos using free tools for a professional finish
Upload and publish your videos effectively on YouTube
Use SEO strategies to attract more viewers to your content`,

  "Use AI to Build a VIRAL Prehistoric Faceless Channel (Full Course)": `Programme Introduction
Are you confused about how to start a YouTube channel? Do you feel stuck or overwhelmed by the technical details? This course will help you create your own faceless YouTube channel, focusing on prehistoric life. You will learn to use AI tools that make the process easier. By the end, you will have the skills to make videos that could go viral and start earning money.

Programme Description
This course teaches you how to create a viral faceless YouTube channel about prehistoric life. You will learn to use AI tools for video creation, branding, and channel setup. The steps are easy to follow, even for beginners. By the end, you'll be able to make engaging videos without spending much money or time.


What You Will Learn
Discover new trends in YouTube niches
Understand why prehistoric content goes viral
Learn how to choose a niche with low competition
Create a branded YouTube channel using AI
Generate unique channel names and descriptions
Design a professional logo for your channel
Use SEO keywords to boost discoverability
Develop compelling video story ideas
Write detailed prompts for video creation
Create images and animations for your videos
Add sound effects to enhance your videos
Edit and publish videos on YouTube
Optimize your video titles, descriptions, and tags for better visibility`,

  "Clone a VIRAL 3D Documentary Channel Using AI (Full Course)": `Programme Introduction
Are you tired of feeling stuck and overwhelmed when trying to create YouTube videos? Do you want to grow a channel without spending a fortune on editors and equipment? This course is here to help you. You will learn how to use AI to create engaging 3D documentary videos easily. After completing this course, you'll be ready to launch your own successful channel and attract viewers.

Programme Description
This course teaches you how to create a viral 3D documentary channel using AI. You'll learn how to find the right niche, design your channel branding, and make videos that stand out. By the end of the course, you will have the skills to create high-quality content and grow your audience. It's a valuable investment of your time that can lead to freedom in your creative journey.


What You Will Learn
Why viral 3D documentary channels are popular right now
How to choose a niche that isn't overly competitive
Steps to create a branded channel that attracts viewers
How to avoid common mistakes when starting a new channel
Tips for optimizing your videos for search engines (SEO)
How to generate channel names and descriptions using AI
The process for designing a professional logo and banner
How to use AI tools for video creation and editing
Techniques for writing engaging scripts for your videos
How to create image and animation prompts for your videos
Tips for adding sound effects to enhance your videos
The steps to publish and promote your videos on YouTube
Strategies for building and maintaining a successful YouTube channel`,

  "Make VIRAL Geography Shorts Using Only AI (FULL GUIDE)": `Programme Introduction
Do you want to create viral videos but feel stuck or overwhelmed? Many people think making popular videos is too hard. This course will show you a simple way to create Geography Shorts using AI. You will learn step-by-step how to make engaging videos that can attract millions of views. After this course, you'll know how to start your own faceless channel and have the skills to make it grow.

Programme Description
This course teaches you how to create viral Geography Shorts using AI tools. You will learn how to generate scripts, create voiceovers, and design engaging visuals without needing special skills. By the end, you will have a clear process to make videos that can reach a large audience. It's worth your time if you want to take control of your creative journey and build a successful channel.


What You Will Learn
Why Geography Shorts are a great opportunity for new creators
How to find popular niches with low competition
Steps to create a script that attracts viewers
How to use AI tools like ChatGPT for script writing
Tips for generating engaging voiceovers with text-to-speech tools
How to create eye-catching map animations using Hera
Techniques for editing and refining your video in Capcut
Adding sound effects and background music to enhance your video
How to add captions to make your content more engaging
Final steps to export and publish your video on platforms like YouTube`,

  "Build a Viral Universe Documentary Channel Using Only AI (Step by Step!)": `Programme Introduction
Are you struggling to start your own YouTube channel? Maybe you feel overwhelmed by the thought of creating videos or think you need a lot of money and skills. This course is for you! We will guide you step by step in building your own successful documentary channel using AI tools. After this course, you'll be ready to create and upload videos that can go viral.

Programme Description
This course teaches you how to build a YouTube documentary channel using only AI. You'll learn how to create videos from start to finish without needing any prior experience. By the end, you will have the skills to set up your channel, create engaging videos, and even optimize them for success. It's a valuable opportunity to take control of your time and potentially earn money.


What You Will Learn
Discover a successful YouTube channel with over 1 million subscribers
Understand how this channel made $30,000 a month with just 47 videos
Learn to create a channel name and description using AI
Create a unique logo for your channel with AI tools
Use AI to generate video ideas and scripts
Find trending topics to attract viewers
Learn about SEO to optimize your videos for search engines
Create engaging voiceovers using AI technology
Source visual content that matches your video scripts
Edit your video to create a professional-looking final product
Add captions and background music to enhance your videos
Design eye-catching thumbnails for your videos
Use AI to generate SEO-optimized titles, descriptions, and tags
Publish your video and make it public on YouTube`,

  "ACTUALLY Go Viral": `Programme Introduction
Are you struggling to make your YouTube videos stand out? Do you feel lost when it comes to creating engaging content? This course will help you unlock the secrets of faceless YouTube channels that go viral. You will learn how to create compelling scripts and build a strategy to grow your channel. After this course, you'll feel confident in crafting videos that get noticed and shared.

Programme Description
This course teaches you how to create viral YouTube videos without showing your face. You will learn how to analyze successful channels and use proven methods to write scripts that engage viewers. By following the step-by-step process, you'll save time and gain the skills to grow your own channel. It's worth your time because you'll learn a system that has already worked for many others.


What You Will Learn
How to analyze 5,000 faceless YouTube videos for successful patterns
The importance of script structure and how to use it
How to create engaging hooks that grab viewers' attention
The art of storytelling to keep your audience engaged
Tips for designing eye-catching thumbnails and titles
A new method to speed up your analysis process using AI tools
How to write winning scripts by combining unique ideas and proven frameworks
Strategies for generating video ideas based on competitor analysis
Access to a database of over 50 ready-to-use script templates
Insights into building a successful faceless YouTube channel in 2026`,

  "50 Easy Faceless Niches": `Programme Introduction
Are you confused about what niche to choose for your faceless YouTube channel? Do you feel stuck and don't know where to start? This course will guide you through 50 easy faceless niches that can bring you success. After this course, you'll have a clear idea of which niches to explore and how to make money from them.

Programme Description
In this course, you'll learn about 50 faceless YouTube niches that are easy to start and can make you money. You'll discover what makes each niche special and how to succeed in it. This course is worth your time because it gives you clear, actionable ideas that can help you take control of your YouTube journey.


What You Will Learn
An overview of faceless YouTube channels and their benefits
The top 15 profitable niches for 2026
Detailed breakdowns of each niche, including challenges and strategies
How to analyze successful channels in these niches
Tips on using AI to create content
Ideas for unique video topics in various niches
How to avoid common mistakes when starting a faceless channel
Insights into audience engagement strategies
Ways to monetize your faceless YouTube content
Access to a list of 50 faceless niches and how to filter them
Steps to innovate and stand out in your chosen niche
How to build a consistent content creation process
Techniques for effective hiring and managing a content team
Tips for branding your faceless YouTube channel
Understanding market trends and when to pivot your niche
How to measure success and track your channel's growth`,

  "Create 1,000 YouTube Shorts Using FREE AI - Free Auto Shorts in Bulk": `Programme Introduction
Are you tired of spending hours creating YouTube videos? Do you want to make lots of short videos quickly and easily? This course will show you how to create 1,000 YouTube Shorts in just 13 minutes using free AI tools. After completing this course, you'll be able to automate your video creation process and have more time for other things.

Programme Description
This course is all about using free AI tools to create YouTube Shorts quickly and efficiently. You will learn how to generate hundreds of video ideas, scripts, and even voiceovers automatically. This method saves you time and effort, allowing you to focus on what truly matters: building your channel and connecting with your audience. It's a great way to take control of your content creation and grow your online presence.


What You Will Learn
How to use free AI tools to create 1,000 YouTube Shorts in under 20 minutes
The basics of video automation without the need for editing or scripting
How to find popular topics for your videos
Steps to generate unique scripts using AI
How to create voiceovers for your videos with AI technology
Tips for automating your entire video creation workflow
How to design a channel logo and banner using AI
The importance of SEO in making your videos discoverable
Strategies for staying consistent and growing your channel over time
How to monetize your videos successfully with this automation method`,

  "Crack The NEW Algorithm": `Programme Introduction
Are you struggling to make your YouTube channel take off? Maybe your videos aren't getting the views you hoped for. This course will guide you through the secrets of successful faceless channels. You'll learn specific rules that top creators use to thrive on YouTube. After completing this course, you'll be ready to create your own successful channel and reach your audience effectively.

Programme Description
This course teaches you how to build a successful faceless YouTube channel by studying what works. You will learn five key rules that can lead to success in the competitive world of YouTube. By the end, you'll have the skills to create engaging content, attract viewers, and make money from your channel. This is worth your time because it offers proven strategies that can save you from common pitfalls.


What You Will Learn
How to analyze successful faceless YouTube channels
The specific rules that help channels succeed
Why longer videos can outperform shorter ones
The concept of the "unfair advantage" in content creation
How to create your own niche instead of competing directly
The importance of pivoting based on audience feedback
Why speed in execution matters for success
How to effectively use AI tools to enhance your workflow
Strategies for researching topics faster and smarter
Tips for creating engaging scripts and outlines
The right way to use AI without losing your unique voice`,

  "These Faceless YouTube Niches Are Now BANNED": `Programme Introduction
Are you worried about starting a YouTube channel? Many people are confused about the rules and risk their channels getting banned. This course will help you understand what YouTube is looking for and what to avoid. After taking this course, you will know how to create safe and successful content that keeps your channel secure.

Programme Description
This course is all about helping you navigate YouTube's new rules. You'll learn which types of channels to avoid and how to create content that meets YouTube's standards. By the end, you'll have the skills to build a safe and profitable YouTube channel that stands the test of time. It's well worth your time if you want to succeed on this platform.


What You Will Learn
Why some YouTube channels are getting banned
How to avoid risky niches on YouTube
The impact of AI on YouTube content detection
What added value really means for your videos
How to create content that complies with YouTube's terms
The importance of real scripts and editing in your videos
Why using AI should enhance, not replace, your creativity
Tips for hiring editors and designers to improve your content
How to respond if your channel gets flagged or demonetized
The benefits of focusing on quality content over shortcuts`,

  "Write Faceless YouTube Scripts That Get 100s Of Millions Of Views": `Programme Introduction
Are you struggling to create YouTube videos that get views and make money? Do you feel stuck trying to write scripts that just don't work? This course will help you learn a new method called script bending. After completing the course, you will be able to create engaging videos that attract millions of views, even without showing your face!

Programme Description
This course teaches you how to write faceless YouTube scripts that can go viral. You will learn the unique script bending method that combines unique ideas with proven storytelling techniques. With this course, you'll save time and start creating videos that can reach a wider audience and generate income.


What You Will Learn
How to create faceless YouTube videos that attract millions of views
The concept of script bending and how it works
Proven storytelling frameworks that can enhance your videos
How to find unique ideas that stand out in your niche
The importance of using AI tools to automate your script writing process
A database of over 50 scripting templates to help you get started
How to analyze successful videos and use their structures for your content
Tips on how to inject current trends into your video ideas for more views
Techniques to streamline your video creation process for efficiency
How to set up AI agents that can find ideas and write scripts for you automatically`,

  "The Smart Way to Build a Faceless Finance Channel": `Programme Introduction
Are you struggling to get views on your finance videos? Do you feel stuck copying what others are doing? This course will show you a smarter way to create a faceless finance channel. You'll learn how to make engaging videos that stand out, even in a crowded market. By the end, you'll be able to build your own successful channel that attracts viewers and generates income.

Programme Description
This course teaches you how to create a faceless finance channel using a unique style. You will learn how to come up with video ideas, write scripts, and create visuals without showing your face. You will also discover tools that make the process easier and faster. This course is worth your time because it gives you a step-by-step guide to succeed in a popular niche without stress.


What You Will Learn
Why copying popular channels doesn't work
How to find your own niche while using a similar style
How to generate viral video ideas using AI tools
How to turn ideas into engaging scripts
How to create detailed visual prompts for your videos
How to generate AI voiceovers for your content
How to use all-in-one tools for creating videos
How to design your channel logo quickly
How to animate your images for a professional look
How to edit and organize your final video
How to add captions for a personal touch
How to export your finished video for sharing`,

  "New YouTube Shorts Niche That No One Is Doing Yet (And It's Exploding)": `Programme Introduction
Are you struggling to find a way to make money on YouTube? Do you feel lost when it comes to creating engaging videos? This course is here to help you discover a hidden niche that is gaining popularity fast. After completing this course, you will know how to create exciting YouTube Shorts that attract views and can even earn you money.

Programme Description
This course teaches you how to tap into a new and profitable niche for YouTube Shorts. You will learn how to create engaging video content step by step, from writing scripts to adding visuals and voiceovers. It's a great way to take control of your time and money while building valuable skills in video creation.


What You Will Learn
Discover a hidden, monetizable YouTube Shorts niche
See real examples of successful channels
Understand the potential earnings from Shorts
Learn how to generate viral video ideas and scripts
Use a single AI tool for all your video creation needs
Create engaging visuals and animations for your videos
Master voiceover techniques to enhance your content
Edit and finalize your videos for YouTube
Understand what makes videos go viral
Get tips on how to stay consistent with your content`,

  "Create Motion Graphics videos in MINUTES with AI": `Programme Introduction
Are you tired of struggling to make motion graphics? Many people find them hard to create or too expensive. This course will change that. You will learn how to make amazing motion graphics in just minutes using AI tools. By the end, you'll be able to create eye-catching videos that grab attention quickly.

Programme Description
This course is all about making motion graphics easy and fun. You will learn how to use AI tools to create professional-looking videos without spending hours on them. The skills you gain will help you stand out on social media and attract more viewers. It's a valuable use of your time if you want to enhance your video content quickly and effectively.


What You Will Learn
Why motion graphics are important for online success
The basics of creating motion graphics using AI in minutes
How to analyze successful motion graphics for inspiration
Different niches where motion graphics can be effective
Key elements of motion graphics: timing, simplicity, text, audio sync, and pacing
How to use various AI tools for image and video creation
Techniques for editing and upscaling your videos for better quality
Tips for adding sound effects and captions to enhance your videos
How to create engaging content that resonates with your audience
Best practices for branding your motion graphics effectively`,

  "Viral Faceless Stickman POV": `Programme Introduction
Are you feeling confused about how to start a YouTube channel? Do you want to create videos that grab attention but don't want to show your face? This course will guide you through the exciting world of faceless Stickman POV videos. You will learn easy steps to create videos that can go viral. After completing this course, you will know how to make engaging content, attract viewers, and even earn money from your channel.

Programme Description
This course teaches you how to create viral Stickman POV videos on YouTube without being on camera. You will learn how to come up with great video ideas, write scripts, and create animations. By the end, you will have the skills to produce your own videos that can attract lots of views. This is a fun and creative way to take control of your time and money while building a successful YouTube channel.


What You Will Learn
How to find popular video ideas in the Stickman POV niche
Techniques to write engaging video scripts
How to create simple animations that fit your content
Tips for using AI tools to generate ideas and visuals
Step-by-step guidance on editing your videos
How to add voiceovers using text-to-speech tools
Ways to enhance your videos with text and effects
Strategies to upload and promote your videos for maximum views
Insights into monetizing your YouTube channel and earning income`,

  "The Secret NotebookLM Workflow Every YouTuber Needs!": `Programme Introduction
Are you struggling to create YouTube videos one by one? It can be confusing and time-consuming. This course will help you learn how to make videos quickly and easily using a powerful AI tool. By the end, you will know how to set up your own automated video creation process. You'll have the skills to create engaging content without overwhelming yourself.

Programme Description
This course teaches you how to clone a successful YouTube channel and generate your own videos using a free tool called Google Notebook LM. You will learn to analyze what makes a channel successful and use that knowledge to create your own content efficiently. This is worth your time because it saves you effort and helps you start making money on YouTube faster.


What You Will Learn
How to stop making videos one by one and automate your process
How to clone a monetized YouTube channel
The basics of using Google Notebook LM for video creation
How to find and analyze successful YouTube channels
A step-by-step guide to collecting video links from other channels
How to set up the Grab It Chrome extension to save time
How to input video links into Notebook LM for analysis
How to get a breakdown of a channel's formula and audience
Tips for generating video ideas and names based on successful content
How to create a full YouTube script from your video ideas
How to turn your script into a complete video with visuals and voiceovers
How to optimize your video title, description, and thumbnail for views
Techniques for creating eye-catching thumbnails using Canva
How to build a smarter system for long-term success on YouTube`,

  "Create viral 3D documentary videos using ai(FERN 3D STYLE)": `Programme Introduction
Are you struggling to grow your YouTube channel? Maybe you feel lost in how to create videos that grab attention. This course is here to help you. You will learn how to make viral 3D documentaries using free AI tools. By the end, you'll have a clear plan to create engaging videos that attract viewers and boost your channel.

Programme Description
This course teaches you how to create exciting 3D documentaries that people want to watch. You will learn to find trending topics, write captivating scripts, and produce stunning visuals. It's a step-by-step guide that saves you time and helps you create professional-looking videos without spending a fortune.


What You Will Learn
How to find viral topics that people want to watch
The process to turn one idea into a 12-minute documentary in under 3 hours
Tips for writing a script that keeps viewers engaged
How to create 3D visuals using free AI tools
Editing secrets to make your videos more appealing
How to use sound effects and music to enhance your documentaries
The importance of consistency in growing your YouTube channel
Techniques for improving your video quality without expensive software`,

  "Make VIRAL Life Advice Videos Using Only FREE AI Tools": `Programme Introduction
Are you struggling to create engaging videos that get noticed? Do you want to share valuable life advice but don't know how? This course will show you how to make viral videos using only free AI tools. After taking this course, you will be able to create your own high-performing life advice videos without needing any prior experience or a big budget.

Programme Description
This course teaches you how to create viral life advice videos step by step. You will learn how to generate ideas, write scripts, and produce videos using free AI tools. By the end of the course, you will have the skills to create videos that grab attention and reach a wide audience. It's a great investment of your time if you want to share wisdom and grow your online presence.


What You Will Learn
Discover how a YouTube channel quickly gained 100,000 subscribers with just 7 videos
Explore how to structure videos for better performance
Understand the importance of a strong script for video success
Learn how to use ChatGPT to generate viral video ideas
Create engaging video scripts with ChatGPT's help
Generate voiceovers using free tools like 11 Labs
Make realistic character images using AI tools
Add talking animations to your character images
Create visuals that match your video script
Find free videos that fit your content
Edit your video using Cap Cut, a simple editing tool
Add smooth animations to your visuals for a professional look
Use captions to make your videos more accessible
Create eye-catching thumbnails for your videos
Optimize your video for YouTube's search engine
Publish your video and learn how to promote it effectively`,

  "Create Viral inspirational finance Videos with Free AI Tools": `Programme Introduction
Do you want to create engaging finance videos but feel overwhelmed? Maybe you think you need a big budget or a team to get started. This course is here to help you make high-quality finance videos using just free AI tools. By the end, you will know how to create and publish your own viral finance videos easily.

Programme Description
This course teaches you how to make impactful finance videos from scratch. You'll learn to use free AI tools to create animations, scripts, and voiceovers. This course is worth your time because it gives you a step-by-step process to build your own finance video brand without spending money.


What You Will Learn
How to create a workflow for daily finance videos
The importance of choosing a specific topic for your channel
How to create a character profile for your videos
Where to find successful video ideas in your niche
How to write a full video script using AI
How to create image prompts that match your script
How to generate visuals and animations for your videos
How to create a professional voiceover using AI
How to edit and assemble your video for publishing
Tips for optimizing your video for better engagement`,

  "Clone ANY YouTube Channel With AI (NotebookLM Hack)": `Programme Introduction
Are you wasting hours trying to find good YouTube video ideas and writing scripts from scratch? Growing a channel can feel impossible when you do not know what actually works. This course shows you a smart way to use free AI tools to study successful creators and build your own content system step by step. By the end, you will be able to use AI to make high-quality videos much faster.

Programme Description
This course is a complete guide to using Google's NotebookLM to analyze and learn from top YouTube channels. You will learn the exact steps to discover how successful videos are made so you can create your own original content without copying. It is worth your time because it helps you build valuable skills and automate your work, giving you the freedom to take control of your time and money.


What You Will Learn
How to use NotebookLM to study and understand any YouTube channel
How to pull out winning video scripts, hooks, and storytelling secrets
How to recreate top content the right way without copying anyone
How to get unlimited original video ideas from popular channels
How to set up an automated system for faceless YouTube channels
How to save hours of hard work on research and writing scripts`,
};

const AI_CONTENT_SLUG_TO_KEY: Readonly<Record<string, string>> = {
  ai_content_automation: "__module_pack__",
  ai_content_c01: "Beginners Guide to Faceless YouTube in 2026 (3 hours)",
  ai_content_c02: "New YouTube Policy ENDS These Faceless YouTube Channels",
  ai_content_c03: "Start YouTube Automation in 2026 (Step By Step) NO FACE",
  ai_content_c04: "Build Faceless YouTube Channels Using Just ONE AI Tool (Genspark AI)",
  ai_content_c05: "Build a VIRAL AI Movie Channel Using Only AI Tools",
  ai_content_c06: "Create Viral High RPM Finance Videos Using AI (Full Blueprint)",
  ai_content_c07: "Make VIRAL 3D Animated Videos Using FREE AI Tools (FULL COURSE)",
  ai_content_c08: "Build a Viral AI Influencer (AI Instagram Models)",
  ai_content_c09: "Make a VIRAL AI Documentary Channel Using FREE Tools (FULL COURSE)",
  ai_content_c10: "Build a VIRAL Philosophy Channel Using FREE AI Tools (FULL COURSE)",
  ai_content_c11: "Use AI to Build a VIRAL Prehistoric Faceless Channel (Full Course)",
  ai_content_c12: "Clone a VIRAL 3D Documentary Channel Using AI (Full Course)",
  ai_content_c13: "Make VIRAL Geography Shorts Using Only AI (FULL GUIDE)",
  ai_content_c14: "Build a Viral Universe Documentary Channel Using Only AI (Step by Step!)",
  ai_content_c15: "ACTUALLY Go Viral",
  ai_content_c16: "50 Easy Faceless Niches",
  ai_content_c17: "Create 1,000 YouTube Shorts Using FREE AI - Free Auto Shorts in Bulk",
  ai_content_c18: "Crack The NEW Algorithm",
  ai_content_c19: "These Faceless YouTube Niches Are Now BANNED",
  ai_content_c20: "Write Faceless YouTube Scripts That Get 100s Of Millions Of Views",
  ai_content_c21: "The Smart Way to Build a Faceless Finance Channel",
  ai_content_c22: "New YouTube Shorts Niche That No One Is Doing Yet (And It's Exploding)",
  ai_content_c23: "Create Motion Graphics videos in MINUTES with AI",
  ai_content_c24: "Viral Faceless Stickman POV",
  ai_content_c25: "The Secret NotebookLM Workflow Every YouTuber Needs!",
  ai_content_c26: "Create viral 3D documentary videos using ai(FERN 3D STYLE)",
  ai_content_c27: "Make VIRAL Life Advice Videos Using Only FREE AI Tools",
  ai_content_c28: "Create Viral inspirational finance Videos with Free AI Tools",
  ai_content_c29: "Clone ANY YouTube Channel With AI (NotebookLM Hack)",
};

export function aiContentTeaser(description: string): string {
  return extractProgrammeIntroductionTeaser(description);
}

export function curatedAiContentDescription(
  slug: string | null | undefined,
  title: string | null | undefined,
): string | undefined {
  const slugKey = slug?.trim().toLowerCase();
  if (slugKey && AI_CONTENT_SLUG_TO_KEY[slugKey]) {
    return AI_CONTENT_PROGRAM_DESCRIPTIONS[AI_CONTENT_SLUG_TO_KEY[slugKey]];
  }
  const titleKey = title?.trim();
  if (titleKey && AI_CONTENT_PROGRAM_DESCRIPTIONS[titleKey]) {
    return AI_CONTENT_PROGRAM_DESCRIPTIONS[titleKey];
  }
  return undefined;
}

export function curatedAiContentVaultPackDescription(pack: VaultPackKey): string | undefined {
  if (pack === "ai_content_automation") return AI_CONTENT_VAULT_PACK_STRUCTURED_DESCRIPTION;
  return undefined;
}
