/**
 * Home “MOST VIEWED” marquee: @followthesyndicate clips ordered by approximate public view count (high → low).
 * Local posters live in `public/assets/most viewed/` (`01.png` … `10.png`), order-matched to TikTok URLs.
 */
export type TikTokMostViewedCard = {
  videoId: string;
  href: string;
  alt: string;
  /** Path under `public/`, e.g. `/assets/most viewed/01.png` */
  posterSrc: string;
  approxViewsLabel: string;
};

export const TIKTOK_MOST_VIEWED: TikTokMostViewedCard[] = [
  {
    videoId: "7511442833102998806",
    href: "https://www.tiktok.com/@followthesyndicate/video/7511442833102998806",
    alt: "It's not over until I win — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 2.5M views",
    posterSrc: "/assets/most viewed/01.png",
  },
  {
    videoId: "7512180280560602390",
    href: "https://www.tiktok.com/@followthesyndicate/video/7512180280560602390",
    alt: "Either you win or you lose — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 2.4M views",
    posterSrc: "/assets/most viewed/02.png",
  },
  {
    videoId: "7510422941474098454",
    href: "https://www.tiktok.com/@followthesyndicate/video/7510422941474098454",
    alt: "Only trust God and hard work — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 2.1M views",
    posterSrc: "/assets/most viewed/03.png",
  },
  {
    videoId: "7510313874315545879",
    href: "https://www.tiktok.com/@followthesyndicate/video/7510313874315545879",
    alt: "IF YOU RISK NOTHING YOU RISK EVERYTHING — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 1.9M views",
    posterSrc: "/assets/most viewed/04.png",
  },
  {
    videoId: "7512178101296794903",
    href: "https://www.tiktok.com/@followthesyndicate/video/7512178101296794903",
    alt: "Who will join me on this path to riches — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 1.9M views",
    posterSrc: "/assets/most viewed/05.png",
  },
  {
    videoId: "7511772258201799958",
    href: "https://www.tiktok.com/@followthesyndicate/video/7511772258201799958",
    alt: "Don't be afraid of making big moves — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 1.8M views",
    posterSrc: "/assets/most viewed/06.png",
  },
  {
    videoId: "7507706458369166594",
    href: "https://www.tiktok.com/@followthesyndicate/video/7507706458369166594",
    alt: "The greatest risk in life is not taking one — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 1.6M views",
    posterSrc: "/assets/most viewed/07.png",
  },
  {
    videoId: "7504654213645896982",
    href: "https://www.tiktok.com/@followthesyndicate/video/7504654213645896982",
    alt: "Plan for tomorrow but act now — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 1.5M views",
    posterSrc: "/assets/most viewed/08.png",
  },
  {
    videoId: "7490639131492551958",
    href: "https://www.tiktok.com/@followthesyndicate/video/7490639131492551958",
    alt: "Wealth is not just a luxury — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 1.3M views",
    posterSrc: "/assets/most viewed/09.png",
  },
  {
    videoId: "7490636467157388566",
    href: "https://www.tiktok.com/@followthesyndicate/video/7490636467157388566",
    alt: "Protect your dignity, write your own story — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 1.1M views",
    posterSrc: "/assets/most viewed/10.png",
  },
];
