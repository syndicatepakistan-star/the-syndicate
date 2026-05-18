/**
 * Home “MOST INFORMATIVE” marquee: curated @followthesyndicate clips with local posters
 * (`/public/assets/most-informative/01.png` … `13.png`), order-matched to TikTok URLs.
 */
export type TikTokMostInformativeCard = {
  videoId: string;
  href: string;
  alt: string;
  /** Path under `public/`, e.g. `/assets/most-informative/01.png` */
  posterSrc: string;
};

export const TIKTOK_MOST_INFORMATIVE: TikTokMostInformativeCard[] = [
  {
    videoId: '7482097612296899873',
    href: 'https://www.tiktok.com/@followthesyndicate/video/7482097612296899873',
    alt: 'How long will you continue like this — THE SYNDICATE on TikTok',
    posterSrc: '/assets/most-informative/01.png',
  },
  {
    videoId: '7481728237614271777',
    href: 'https://www.tiktok.com/@followthesyndicate/video/7481728237614271777',
    alt: 'You are failing in life because you are not hungry enough — THE SYNDICATE on TikTok',
    posterSrc: '/assets/most-informative/02.png',
  },
  {
    videoId: '7489441529648499990',
    href: 'https://www.tiktok.com/@followthesyndicate/video/7489441529648499990',
    alt: 'The art of emotional detachment in high-stakes business — THE SYNDICATE on TikTok',
    posterSrc: '/assets/most-informative/03.png',
  },
  {
    videoId: '7489440632956587286',
    href: 'https://www.tiktok.com/@followthesyndicate/video/7489440632956587286',
    alt: 'Become a master at decision making — THE SYNDICATE on TikTok',
    posterSrc: '/assets/most-informative/04.png',
  },
  {
    videoId: '7489428695791209751',
    href: 'https://www.tiktok.com/@followthesyndicate/video/7489428695791209751',
    alt: 'Make money your slave — THE SYNDICATE on TikTok',
    posterSrc: '/assets/most-informative/05.png',
  },
  {
    videoId: '7481358452506365216',
    href: 'https://www.tiktok.com/@followthesyndicate/video/7481358452506365216',
    alt: 'No man should aim for less — THE SYNDICATE on TikTok',
    posterSrc: '/assets/most-informative/06.png',
  },
  {
    videoId: '7480601815197797654',
    href: 'https://www.tiktok.com/@followthesyndicate/video/7480601815197797654',
    alt: 'Life is a game: learn the rules so you can play to win — THE SYNDICATE on TikTok',
    posterSrc: '/assets/most-informative/07.png',
  },
  {
    videoId: '7470501751188229409',
    href: 'https://www.tiktok.com/@followthesyndicate/video/7470501751188229409',
    alt: 'Part 2 — madness and greatness — THE SYNDICATE on TikTok',
    posterSrc: '/assets/most-informative/08.png',
  },
  {
    videoId: '7470529674918104353',
    href: 'https://www.tiktok.com/@followthesyndicate/video/7470529674918104353',
    alt: 'Part 3 — start making tough choices — THE SYNDICATE on TikTok',
    posterSrc: '/assets/most-informative/09.png',
  },
  {
    videoId: '7470501278314007841',
    href: 'https://www.tiktok.com/@followthesyndicate/video/7470501278314007841',
    alt: 'Part 1 — madness and greatness — THE SYNDICATE on TikTok',
    posterSrc: '/assets/most-informative/10.png',
  },
  {
    videoId: '7503627799375252758',
    href: 'https://www.tiktok.com/@followthesyndicate/video/7503627799375252758',
    alt: 'Spend every day thinking how to become stronger — THE SYNDICATE on TikTok',
    posterSrc: '/assets/most-informative/11.png',
  },
  {
    videoId: '7493101040699460886',
    href: 'https://www.tiktok.com/@followthesyndicate/video/7493101040699460886',
    alt: 'Always pay yourself well — THE SYNDICATE on TikTok',
    posterSrc: '/assets/most-informative/12.png',
  },
  {
    videoId: '7490643341122555158',
    href: 'https://www.tiktok.com/@followthesyndicate/video/7490643341122555158',
    alt: 'After the hard work, reward yourself — THE SYNDICATE on TikTok',
    posterSrc: '/assets/most-informative/13.png',
  },
];
