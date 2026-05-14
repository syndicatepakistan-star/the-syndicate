/**
 * Home “MOST VIEWED” marquee: @followthesyndicate clips ordered by approximate public view count (high → low).
 * Poster URLs come from TikTok’s oEmbed `thumbnail_url` (signed CDN links). They expire after some time—
 * refresh by re-requesting oEmbed for each `videoId` if images stop loading.
 */
export type TikTokMostViewedCard = {
  videoId: string;
  href: string;
  alt: string;
  thumbnailUrl: string;
  approxViewsLabel: string;
};

export const TIKTOK_MOST_VIEWED: TikTokMostViewedCard[] = [
  {
    videoId: "7511442833102998806",
    href: "https://www.tiktok.com/@followthesyndicate/video/7511442833102998806",
    alt: "It's not over until I win — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 2.5M views",
    thumbnailUrl:
      "https://p19-common-sign.tiktokcdn.com/tos-no1a-p-0037-no/oAmAXFCyohFw2dieBjFEgEDACPAVS74QQnfckg~tplv-tiktokx-origin.image?dr=14575&x-expires=1778911200&x-signature=GcL3U29b3paRcWVrVS51z1Uttg4%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
  },
  {
    videoId: "7512180280560602390",
    href: "https://www.tiktok.com/@followthesyndicate/video/7512180280560602390",
    alt: "Either you win or you lose — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 2.4M views",
    thumbnailUrl:
      "https://p16-common-sign.tiktokcdn.com/tos-no1a-p-0037-no/oY6BrQGPgiiEEPCfLAQMdref8uNAMFIDEAIDUT~tplv-tiktokx-origin.image?dr=14575&x-expires=1778911200&x-signature=vzti0EwcWujgJWhzcflDuIF3xDg%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
  },
  {
    videoId: "7510422941474098454",
    href: "https://www.tiktok.com/@followthesyndicate/video/7510422941474098454",
    alt: "Only trust God and hard work — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 2.1M views",
    thumbnailUrl:
      "https://p16-common-sign.tiktokcdn.com/tos-no1a-p-0037-no/oMviaFAYBJi9Apg6CPlII4JTB6PJYqhZg0DZc~tplv-tiktokx-origin.image?dr=14575&x-expires=1778911200&x-signature=X%2BYQw8fPrnoHFDgQTbuNCRzO9dk%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
  },
  {
    videoId: "7480602932111576342",
    href: "https://www.tiktok.com/@followthesyndicate/video/7480602932111576342",
    alt: "Ruthlessly compete in the game of money and power — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 1.9M views",
    thumbnailUrl:
      "https://p16-common-sign.tiktokcdn.com/tos-no1a-p-0037-no/oM2F8CBdEdVknBk8xff1QIHInI2cSDGs0BEgAF~tplv-tiktokx-origin.image?dr=14575&x-expires=1778911200&x-signature=pJs1URx88SLUvYM0fsUBVSkNgxg%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
  },
  {
    videoId: "7512178101296794903",
    href: "https://www.tiktok.com/@followthesyndicate/video/7512178101296794903",
    alt: "Who will join me on this path to riches — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 1.9M views",
    thumbnailUrl:
      "https://p16-common-sign.tiktokcdn.com/tos-no1a-p-0037-no/oIAWLEeQIIvCIr0Qu0BeDLOgKGMWVTIVpM7eOA~tplv-tiktokx-origin.image?dr=14575&x-expires=1778911200&x-signature=7XvlEln1tz6oqX2m%2FCIj%2BYdpwuA%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
  },
  {
    videoId: "7511772258201799958",
    href: "https://www.tiktok.com/@followthesyndicate/video/7511772258201799958",
    alt: "Don't be afraid of making big moves — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 1.8M views",
    thumbnailUrl:
      "https://p16-common-sign.tiktokcdn.com/tos-no1a-p-0037-no/oU7evRkI6ZW3FgnQfGLgAWDGAAQixW9UelfJ6s~tplv-tiktokx-origin.image?dr=14575&x-expires=1778911200&x-signature=u7ftE%2FCVRwmXDfuwAJtTHo7r48k%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
  },
  {
    videoId: "7507706458369166594",
    href: "https://www.tiktok.com/@followthesyndicate/video/7507706458369166594",
    alt: "The greatest risk in life is not taking one — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 1.6M views",
    thumbnailUrl:
      "https://p19-common-sign.tiktokcdn.com/tos-no1a-p-4864-no/oE6fLFskE0jBTDkfIguFnbnTo6EwMoCkgBBwIi~tplv-tiktokx-origin.image?dr=14575&x-expires=1778911200&x-signature=IXJCFcqfZ5Istb4TnxWbz8AlzGg%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
  },
  {
    videoId: "7504654213645896982",
    href: "https://www.tiktok.com/@followthesyndicate/video/7504654213645896982",
    alt: "Plan for tomorrow but act now — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 1.5M views",
    thumbnailUrl:
      "https://p16-common-sign.tiktokcdn.com/tos-no1a-p-0037-no/oIsJQIaATDAox9v3LeFsLjQDhIsALDqSQIfeLE~tplv-tiktokx-origin.image?dr=14575&x-expires=1778911200&x-signature=1Vi5InunnEu6AB4Nqx%2FDbkCiwH8%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
  },
  {
    videoId: "7490639131492551958",
    href: "https://www.tiktok.com/@followthesyndicate/video/7490639131492551958",
    alt: "Wealth is not just a luxury — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 1.3M views",
    thumbnailUrl:
      "https://p16-common-sign.tiktokcdn.com/tos-no1a-p-0037-no/o47D0AaUBkA1DiInD9ifFCg0CGsAgDEpVAB6Ce~tplv-tiktokx-origin.image?dr=14575&x-expires=1778911200&x-signature=iIXfUS6lvUpHuqsX5LkMtXQB5C8%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
  },
  {
    videoId: "7490636467157388566",
    href: "https://www.tiktok.com/@followthesyndicate/video/7490636467157388566",
    alt: "Protect your dignity, write your own story — THE SYNDICATE on TikTok",
    approxViewsLabel: "about 1.1M views",
    thumbnailUrl:
      "https://p16-common-sign.tiktokcdn.com/tos-no1a-p-0037-no/oEkuex9VwEEjCFaFinggjrB9iXfAACaADIj0Aa~tplv-tiktokx-origin.image?dr=14575&x-expires=1778911200&x-signature=yUwylW23WUisHcFRUm9TgI0ZmUM%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=43f4a2f9&idc=my2",
  },
];
