/** Landscape thumbnail — aspect-ratio on this box gives Next/Image fill a real height. */
export const PROGRAM_CARD_LANDSCAPE_MEDIA =
  "program-playlist-card__media relative z-0 aspect-video w-full flex-none overflow-hidden bg-[#030508] max-xl:min-h-0 max-xl:rounded-none";
export const PROGRAM_CARD_LANDSCAPE_MEDIA_OVERLAY =
  "pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-black/15 via-transparent to-black/30";

/** Inner card frame between neon border and content. */
export const PROGRAM_CARD_FRAME =
  "program-playlist-card__frame relative m-[1px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.45rem] bg-[#04060d] ring-1 ring-black/70 max-lg:m-0 max-lg:rounded-[0.85rem]";

/** Inner column: flush thumbnail + padded info block below. */
export const PROGRAM_CARD_INNER_SHELL =
  "program-playlist-card__shell relative z-[3] flex h-full min-h-0 flex-1 flex-col gap-0";

/** Padding only on title/buttons — not on the thumbnail. */
export const PROGRAM_CARD_INFO_INSET =
  "program-playlist-card__info-wrap shrink-0 px-2 pb-2 pt-1.5 max-lg:px-1 max-lg:pb-1 max-lg:pt-0.5 sm:px-2.5 sm:pb-2.5 sm:pt-2 max-xl:px-1 max-xl:pb-1 max-xl:pt-0.5";

/** Text + action buttons panel below the thumbnail. */
export const PROGRAM_CARD_INFO_PANEL =
  "program-playlist-card__info flex min-h-0 flex-1 flex-col justify-end overflow-hidden";

/** Fixed slot heights so psychology + business model cards align in the library grid. */
export const PROGRAM_CARD_TITLE_SLOT =
  "program-playlist-card__title-slot line-clamp-2 min-h-[2.35rem] sm:min-h-[2.65rem]";

/** Neon stats band — room for +2pt labels; digits stay baseline-aligned. */
export const PROGRAM_CARD_STATS_SLOT =
  "program-playlist-card__stats-slot flex min-h-[90px] max-h-[90px] shrink-0 items-stretch sm:min-h-[94px] sm:max-h-[94px]";

/** Mobile + iPad (< xl) — match trading vault module card info block. */
export const PROGRAM_CARD_MOBILE_INFO_FACE =
  "max-xl:min-h-0 max-xl:justify-end max-xl:rounded-none max-xl:border-x-0 max-xl:border-t-0 max-xl:px-1 max-xl:py-1.5";

export const PROGRAM_CARD_MOBILE_TITLE_FACE =
  "max-xl:line-clamp-2 max-xl:text-[clamp(13px,3.4vw,18px)] max-xl:leading-snug";

export const PROGRAM_CARD_MOBILE_ACTIONS_FACE = "max-xl:mt-auto max-xl:gap-1.5";

export const PROGRAM_CARD_MOBILE_PRICE_BADGE_FACE =
  "max-xl:bottom-1 max-xl:left-1 max-xl:right-auto max-xl:top-auto";
