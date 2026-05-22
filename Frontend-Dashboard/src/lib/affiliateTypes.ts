export type AffiliateStats = {
  affiliate_id: string;
  section?: string;
  click_count: number;
  lead_count: number;
  sale_count?: number;
  point_total?: number;
  earnings_total?: string;
  last_click_at: string | null;
  last_lead_at: string | null;
  last_sale_at?: string | null;
  lead_emails: string[];
  overall?: {
    click_count: number;
    lead_count: number;
    sale_count: number;
    conversion_rate: number;
    point_total: number;
    earnings_total: string;
    last_click_at: string | null;
    last_lead_at: string | null;
    last_sale_at: string | null;
    lead_emails: string[];
  };
  current_section?: {
    section: "complete" | "single" | "pawn" | "king" | "exclusive";
    affiliate_id: string;
    click_count: number;
    lead_count: number;
    sale_count: number;
    conversion_rate: number;
    earnings_total: string;
    last_click_at: string | null;
    last_lead_at: string | null;
    last_sale_at: string | null;
    lead_emails: string[];
  };
  by_section?: Record<
    "complete" | "single" | "pawn" | "king",
    {
      section: "complete" | "single" | "pawn" | "king" | "exclusive";
      affiliate_id: string;
      click_count: number;
      lead_count: number;
      sale_count: number;
      conversion_rate: number;
      earnings_total: string;
      last_click_at: string | null;
      last_lead_at: string | null;
      last_sale_at: string | null;
      lead_emails: string[];
    }
  >;
};

export type AffiliateVisitor = {
  visitor_id: string;
  clicked_at: string | null;
  lead_email: string | null;
  lead_at: string | null;
  /** Total affiliate commission from this visitor’s sale(s) (same as backend sum of SaleEvent.amount). */
  sale_amount?: string;
  subscription_name?: string | null;
  conversion_earning?: string;
};

export type AffiliateVisitorsResponse = {
  affiliate_id: string;
  visitors: AffiliateVisitor[];
};

export type FunnelStage = {
  stage: "Clicks" | "Leads" | "Conversions";
  value: number;
};

export type AffiliateFunnelResponse = {
  affiliate_id: string;
  stages: FunnelStage[];
};

export type ReferralLeadEvent = {
  /** Backend kind: "diagnosis" (quiz email) or "auth" (signup / login). */
  kind: "diagnosis" | "auth" | string;
  /** Display label shown on the affiliate dashboard, e.g. "Syn Diagnosis lead". */
  label: string;
  /** Email captured for THIS lead kind (quiz email vs signup email may differ). */
  email?: string | null;
  /** ISO timestamp of when this lead event was recorded. */
  at: string | null;
};

export type RecentReferralItem = {
  visitor_id: string;
  email?: string | null;
  /** `joined` = lead captured without purchase yet; `purchased` = sale recorded. */
  status: "joined" | "purchased";
  at: string | null;
  /** Backend: human-readable product / offer line from checkout attribution. */
  subscription_name?: string | null;
  /** Affiliate commission credited for this conversion (SaleEvent.amount). */
  conversion_earning?: string | null;
  purchased_program?: string | null;
  purchased_offer?: string | null;
  purchased_tier?: string | null;
  purchase_amount?: string | number | null;
  purchase_currency?: string | null;
  purchased_at?: string | null;
  /** Per-event labels (up to two: "Syn Diagnosis lead", "Sign up lead" / "Login lead"). */
  lead_events?: ReferralLeadEvent[];
  /** Number of distinct sale events recorded for this visitor (defaults to 1 when at least one sale exists). */
  sale_count?: number | null;
  /** Distinct subscription names this visitor purchased, ordered by first purchase. */
  subscription_names?: string[] | null;
};

export type RecentReferralsResponse = {
  affiliate_id: string;
  items: RecentReferralItem[];
};

/** One row from GET /track/withdrawal-statement — your submitted payout requests only. */
export type WithdrawalStatementItem = {
  id: number;
  requested_amount: string;
  earnings_snapshot: string;
  status: string;
  created_at: string;
  /** ISO timestamp when admin marked payout complete; null while pending. */
  transferred_at: string | null;
  account_name: string;
  affiliate_link_id: string;
};

export type WithdrawalStatementResponse = {
  affiliate_id: string;
  items: WithdrawalStatementItem[];
};

export type WithdrawalRequestPayload = {
  affiliate_id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  iban: string;
  phone_number: string;
  branch_name?: string;
  requested_amount: string;
};

export type WithdrawalRequestResponse = {
  success: boolean;
  withdrawal_request_id: number;
  status: string;
  requested_amount?: string;
  earnings_snapshot: string;
  created_at: string;
  /** Available balance after this withdrawal is reserved (gross minus all non-refunded withdrawals). */
  earnings_total?: string;
  /** Lifetime commission credited. */
  gross_earnings?: string;
  /** Sum of every non-refunded withdrawal request. */
  withdrawn_total?: string;
};

export type AuthLoginResponse = {
  success: boolean;
  token: string;
  user: {
    display_name: string;
    email?: string;
    referral_ids: {
      complete: string;
      single: string;
      pawn?: string;
      king?: string;
      exclusive?: string;
    };
  };
};

export type AuthOtpRequestResponse = {
  success: boolean;
  message: string;
  dev_otp?: string;
  debug_error?: string;
  delivery?: "console" | "smtp";
};
