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
  "program-playlist-card__info flex min-h-0 flex-1 flex-col overflow-hidden max-xl:min-h-0 max-xl:justify-end";

/** Mobile + iPad (< xl) — match trading vault module card info block. */
export const PROGRAM_CARD_MOBILE_INFO_FACE =
  "max-xl:min-h-0 max-xl:justify-end max-xl:rounded-none max-xl:border-x-0 max-xl:border-t-0 max-xl:px-1 max-xl:py-1.5";

export const PROGRAM_CARD_MOBILE_TITLE_FACE =
  "max-xl:line-clamp-2 max-xl:min-h-0 max-xl:text-[clamp(10px,2.4vw,17px)]";

export const PROGRAM_CARD_MOBILE_ACTIONS_FACE = "max-xl:mt-auto max-xl:gap-1.5";

export const PROGRAM_CARD_MOBILE_PRICE_BADGE_FACE =
  "max-xl:right-1.5 max-xl:top-1.5 max-xl:[&_span]:px-1.5 max-xl:[&_span]:py-0.5 max-xl:[&_span]:text-[10px] max-xl:[&_span_span]:text-[8px]";
