/** Public static paths for elite plan cards (public /programs + dashboard programs). */
/** Use a new filename (e.g. money-mastery-v2.png) when replacing art — Next/Image disallows `?v=` on local assets. */
export const OFFER_PLAN_THUMB_MONEY_MASTERY =
  "/assets/programs/offers/money-mastery-v2.png";
export const OFFER_PLAN_THUMB_THE_KNIGHT = "/assets/theknight.png";
/** @deprecated Use OFFER_PLAN_THUMB_THE_KNIGHT */
export const OFFER_PLAN_THUMB_THE_KING = OFFER_PLAN_THUMB_THE_KNIGHT;

const OFFERS_BASE = "/assets/programs/offers";

export const OFFER_PLAN_THUMB_AGENTIC_AI = `${OFFERS_BASE}/${encodeURIComponent("Agentic Ai.jpeg")}`;
export const OFFER_PLAN_THUMB_AI_CONTENT_AUTOMATION = `${OFFERS_BASE}/${encodeURIComponent("Ai Content Automation.jpeg")}`;
