import type { PlanOfferDef } from "@/components/programs/planOfferCatalog";

/** Card title lines (uppercase). Multi-line packs stack like AI Content Automation. */
export function planOfferCardTitleLines(offer: Pick<PlanOfferDef, "plan" | "title">): string[] {
  if (offer.plan === "ai_content_automation") {
    return ["AI CONTENT", "AUTOMATION"];
  }
  if (offer.plan === "trading_technical_analysis") {
    return ["TRADING ADVANCED", "TECHNICAL ANALYSIS"];
  }
  return [offer.title];
}
