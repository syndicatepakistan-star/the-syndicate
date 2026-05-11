"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getAffiliateFunnel,
  getAffiliateStats,
  getAffiliateVisitors,
  getRecentReferrals,
  requestAffiliateWithdrawal
} from "@/lib/affiliateApi";
import type { AffiliateStats, AffiliateVisitor, RecentReferralItem } from "@/lib/affiliateTypes";

type ToastTone = "good" | "warn" | "bad" | "info";

function formatWhen(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function formatAgo(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const diff = Date.now() - d.getTime();
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function formatEarnings(value: string | number | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "0.000";
  return num.toFixed(3);
}

type ReferralIds = {
  complete: string;
  single: string;
  pawn: string;
  king: string;
  exclusive?: string;
};

type AffiliatePortalProps = {
  displayName?: string;
  referralIds?: ReferralIds;
  onLogout?: () => void;
  /** When true, fits inside the main dashboard shell (sidebar layout) instead of a standalone full viewport page. */
  embedded?: boolean;
};

type WithdrawFormState = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  phoneNumber: string;
  branchName: string;
  amount: string;
};

export default function AffiliatePortal({ displayName, referralIds, onLogout, embedded = false }: AffiliatePortalProps) {
  const [affiliateId, setAffiliateId] = useState(() => referralIds?.complete?.trim() || "subhan-x91");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [visitors, setVisitors] = useState<AffiliateVisitor[]>([]);
  const [funnel, setFunnel] = useState<Array<{ stage: string; value: number }>>([]);
  const [funnelHover, setFunnelHover] = useState<{ stage: string; value: number } | null>(null);
  const funnelHoverLeaveTimer = useRef<number | null>(null);
  const [recentReferrals, setRecentReferrals] = useState<RecentReferralItem[]>([]);
  const [recentPage, setRecentPage] = useState(1);
  const [visitorsPage, setVisitorsPage] = useState(1);
  const [activeReferralLink, setActiveReferralLink] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawAttemptedSubmit, setWithdrawAttemptedSubmit] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<{ text: string; tone: "good" | "bad" | "info" } | null>(null);
  const [withdrawForm, setWithdrawForm] = useState<WithdrawFormState>({
    bankName: "",
    accountName: "",
    accountNumber: "",
    iban: "",
    phoneNumber: "",
    branchName: "",
    amount: "",
  });
  const RECENT_PAGE_SIZE = 4;
  const VISITORS_PAGE_SIZE = 6;

  const showFunnelValue = useCallback((row: { stage: string; value: number }) => {
    if (funnelHoverLeaveTimer.current) {
      window.clearTimeout(funnelHoverLeaveTimer.current);
      funnelHoverLeaveTimer.current = null;
    }
    setFunnelHover(row);
  }, []);

  const hideFunnelValue = useCallback(() => {
    if (funnelHoverLeaveTimer.current) {
      window.clearTimeout(funnelHoverLeaveTimer.current);
    }
    funnelHoverLeaveTimer.current = window.setTimeout(() => {
      setFunnelHover(null);
      funnelHoverLeaveTimer.current = null;
    }, 90);
  }, []);
  const overallStats = useMemo(() => {
    if (!stats) return null;
    return (
      stats.overall ?? {
        click_count: stats.click_count ?? 0,
        lead_count: stats.lead_count ?? 0,
        sale_count: stats.sale_count ?? 0,
        conversion_rate: stats.click_count
          ? Math.round(
              ((((stats.lead_count ?? 0) / stats.click_count) + ((stats.sale_count ?? 0) / stats.click_count)) / 2) * 100
            )
          : 0,
        earnings_total: stats.earnings_total ?? "0.00",
        last_click_at: stats.last_click_at ?? null,
        last_lead_at: stats.last_lead_at ?? null,
        last_sale_at: stats.last_sale_at ?? null,
        lead_emails: stats.lead_emails ?? [],
      }
    );
  }, [stats]);

  const conversionRate = useMemo(() => {
    if (!overallStats) return 0;
    return Math.min(100, Math.max(0, Math.round(overallStats.conversion_rate ?? 0)));
  }, [overallStats]);

  const dashboardSignal = useMemo(() => {
    const clicks = overallStats?.click_count ?? 0;
    const leads = overallStats?.lead_count ?? 0;
    const sales = overallStats?.sale_count ?? 0;
    const earnings = Number(overallStats?.earnings_total ?? "0") || 0;

    if (earnings >= 200) return { label: "High Momentum", tone: "good" as const };
    if (earnings > 0) return { label: "Revenue Live", tone: "good" as const };
    if (clicks > 0 && leads > 0 && sales === 0) return { label: "Effort Mode", tone: "warn" as const };
    return { label: "Cold Start", tone: "bad" as const };
  }, [overallStats]);
  const earningsValue = Number(overallStats?.earnings_total ?? "0") || 0;
  const earningsDisplay = formatEarnings(overallStats?.earnings_total ?? "0");
  const canRequestWithdraw = earningsValue >= 50;
  const withdrawAmountValue = Number(withdrawForm.amount || "0");
  const withdrawAmountValid = Number.isFinite(withdrawAmountValue) && withdrawAmountValue > 0 && withdrawAmountValue <= earningsValue;
  const withdrawFormValid = useMemo(() => {
    return (
      withdrawForm.bankName.trim().length > 0 &&
      withdrawForm.accountName.trim().length > 0 &&
      withdrawForm.accountNumber.trim().length > 0 &&
      withdrawForm.iban.trim().length > 0 &&
      withdrawForm.phoneNumber.trim().length > 0 &&
      withdrawForm.amount.trim().length > 0
    );
  }, [withdrawForm]);
  const canSubmitWithdraw = canRequestWithdraw && withdrawFormValid && withdrawAmountValid && !withdrawSubmitting;
  const showWithdrawValidation = withdrawAttemptedSubmit;
  const missingBankName = showWithdrawValidation && withdrawForm.bankName.trim().length === 0;
  const missingAccountName = showWithdrawValidation && withdrawForm.accountName.trim().length === 0;
  const missingAccountNumber = showWithdrawValidation && withdrawForm.accountNumber.trim().length === 0;
  const missingIban = showWithdrawValidation && withdrawForm.iban.trim().length === 0;
  const missingPhone = showWithdrawValidation && withdrawForm.phoneNumber.trim().length === 0;
  const missingAmount = showWithdrawValidation && withdrawForm.amount.trim().length === 0;
  const invalidAmount = showWithdrawValidation && withdrawForm.amount.trim().length > 0 && !withdrawAmountValid;
  const withdrawButtonErrorState = !canRequestWithdraw || (showWithdrawValidation && (!withdrawFormValid || !withdrawAmountValid));
  const earningsCardToneClass =
    earningsValue <= 0
      ? "border-violet-300/85 bg-[linear-gradient(180deg,rgba(193,120,255,0.14),rgba(0,0,0,0.3))] shadow-[0_0_0_1px_rgba(193,120,255,0.9),0_0_22px_rgba(193,120,255,0.86),0_0_56px_rgba(193,120,255,0.72),0_0_108px_rgba(193,120,255,0.56),inset_0_0_20px_rgba(193,120,255,0.27)]"
      : earningsValue < 100
        ? "border-amber-300/85 bg-[linear-gradient(180deg,rgba(255,198,64,0.16),rgba(0,0,0,0.3))] shadow-[0_0_0_1px_rgba(252,211,77,0.9),0_0_22px_rgba(252,211,77,0.86),0_0_56px_rgba(252,211,77,0.72),0_0_108px_rgba(252,211,77,0.56),inset_0_0_20px_rgba(252,211,77,0.27)]"
        : "border-cyan-300/85 bg-[linear-gradient(180deg,rgba(56,236,255,0.16),rgba(0,0,0,0.3))] shadow-[0_0_0_1px_rgba(56,236,255,0.9),0_0_22px_rgba(56,236,255,0.86),0_0_56px_rgba(56,236,255,0.72),0_0_108px_rgba(56,236,255,0.56),inset_0_0_20px_rgba(56,236,255,0.27)]";

  const [conversionRing, setConversionRing] = useState(0);
  useEffect(() => {
    const c = referralIds?.complete?.trim();
    if (c) setAffiliateId(c);
  }, [referralIds?.complete, referralIds?.single, referralIds?.pawn, referralIds?.king, referralIds?.exclusive]);

  useEffect(() => {
    // Keep the displayed conversion stable between polling refreshes.
    setConversionRing(conversionRate);
  }, [conversionRate]);

  useEffect(() => {
    return () => {
      if (funnelHoverLeaveTimer.current) {
        window.clearTimeout(funnelHoverLeaveTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!withdrawOpen) return;
    const handleEscapeClose = (event: KeyboardEvent) => {
      if (event.key === "Escape") setWithdrawOpen(false);
    };
    window.addEventListener("keydown", handleEscapeClose);
    return () => window.removeEventListener("keydown", handleEscapeClose);
  }, [withdrawOpen]);

  useEffect(() => {}, [displayName]);

  function showToast(_message: string, _tone: ToastTone = "info") {}

  useEffect(() => {
    if (!referralIds?.complete) return;
    const completeId = encodeURIComponent(referralIds.complete.trim());
    const origin = typeof window !== "undefined" ? window.location.origin.replace(/\/+$/, "") : "";
    setActiveReferralLink(`${origin}/affiliate/${completeId}`);
  }, [referralIds?.complete]);

  async function copyLink(link: string) {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(link);
      window.setTimeout(() => setCopiedLink(null), 900);
    } catch {
      setCopiedLink(null);
    }
  }

  async function shareLink(link: string) {
    if (!link) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Referral link", text: "Join via my referral link", url: link });
      } else {
        await copyLink(link);
      }
    } catch {}
  }

  function updateWithdrawField<K extends keyof WithdrawFormState>(key: K, value: WithdrawFormState[K]) {
    setWithdrawForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitWithdrawRequest() {
    setWithdrawAttemptedSubmit(true);
    if (!canSubmitWithdraw) {
      if (!canRequestWithdraw) {
        setWithdrawMessage({ text: "You are not eligible yet. Minimum earnings required: £50.000.", tone: "bad" });
      } else if (!withdrawFormValid) {
        setWithdrawMessage({ text: "Please fill all required fields before submitting.", tone: "bad" });
      } else if (!withdrawAmountValid) {
        setWithdrawMessage({ text: `Withdrawal amount must be greater than 0 and up to £${earningsDisplay}.`, tone: "bad" });
      }
      return;
    }
    setWithdrawSubmitting(true);
    try {
      await requestAffiliateWithdrawal({
        affiliate_id: affiliateId.trim(),
        bank_name: withdrawForm.bankName.trim(),
        account_name: withdrawForm.accountName.trim(),
        account_number: withdrawForm.accountNumber.trim(),
        iban: withdrawForm.iban.trim(),
        phone_number: withdrawForm.phoneNumber.trim(),
        branch_name: withdrawForm.branchName.trim(),
        requested_amount: withdrawAmountValue.toFixed(2),
      });
      setWithdrawMessage({ text: "Withdrawal request submitted successfully.", tone: "good" });
      setWithdrawOpen(false);
      setWithdrawAttemptedSubmit(false);
      setWithdrawForm({
        bankName: "",
        accountName: "",
        accountNumber: "",
        iban: "",
        phoneNumber: "",
        branchName: "",
        amount: "",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not submit withdrawal request.";
      setWithdrawMessage({ text: message, tone: "bad" });
    } finally {
      setWithdrawSubmitting(false);
    }
  }

  const refreshData = useCallback(async (silent = false) => {
    if (!affiliateId.trim()) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [statsResult, visitorsResult, funnelResult, recentResult] = await Promise.all([
        getAffiliateStats(affiliateId.trim()),
        getAffiliateVisitors(affiliateId.trim(), 25),
        getAffiliateFunnel(affiliateId.trim()),
        getRecentReferrals(affiliateId.trim(), 8),
      ]);
      setStats(statsResult);
      setVisitors(visitorsResult.visitors);
      setFunnel(funnelResult.stages);
      setRecentReferrals(recentResult.items);
      if (!silent) showToast("Data loaded.", "good");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not fetch affiliate data.";
      if (/affiliate_id not found/i.test(message)) {
        setError("This referral ID is not on this server (new database or stale login). Log in again to refresh.");
        if (!silent) showToast("Affiliate session out of date — logging out.", "warn");
        window.setTimeout(() => onLogout?.(), 400);
        return;
      }
      if (message.toLowerCase().includes("failed to fetch")) {
        setError(
          "Failed to fetch. Run the unified Django backend (same service as Syndicate API), set NEXT_PUBLIC_SYNDICATE_API_URL, and ensure CORS allows this origin if you use a LAN IP."
        );
        if (!silent) showToast("Could not load data from backend.", "bad");
      } else {
        setError(message);
        if (!silent) showToast(message, "bad");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [affiliateId, onLogout]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      // Poll for latest backend stats so UI stays live without page reload.
      void refreshData(true);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [refreshData]);

  function handleLogout() {
    showToast("Logging out...", "warn");
    window.setTimeout(() => onLogout?.(), 320);
  }

  const pagedRecentReferrals = useMemo(() => {
    const start = (recentPage - 1) * RECENT_PAGE_SIZE;
    return recentReferrals.slice(start, start + RECENT_PAGE_SIZE);
  }, [recentReferrals, recentPage]);

  const totalRecentPages = Math.max(1, Math.ceil(recentReferrals.length / RECENT_PAGE_SIZE));

  const pagedVisitors = useMemo(() => {
    const start = (visitorsPage - 1) * VISITORS_PAGE_SIZE;
    return visitors.slice(start, start + VISITORS_PAGE_SIZE);
  }, [visitors, visitorsPage]);

  const totalVisitorPages = Math.max(1, Math.ceil(visitors.length / VISITORS_PAGE_SIZE));

  useEffect(() => {
    setRecentPage((page) => Math.min(page, Math.max(1, Math.ceil(recentReferrals.length / RECENT_PAGE_SIZE))));
  }, [recentReferrals.length]);

  useEffect(() => {
    setVisitorsPage((page) => Math.min(page, Math.max(1, Math.ceil(visitors.length / VISITORS_PAGE_SIZE))));
  }, [visitors.length]);

  return (
    <div
      className={
        embedded
          ? "affiliate-portal-embed w-full bg-transparent p-0 font-sans text-white"
          : "min-h-screen w-full bg-[#090909] p-3 font-sans text-white md:p-5"
      }
    >
      <main
        className={
          embedded
            ? "cut-frame glass-dark mx-auto flex h-auto min-h-[min(58vh,560px)] max-h-[min(82vh,920px)] w-full max-w-none flex-col overflow-hidden border border-amber-300/70 bg-[radial-gradient(1200px_420px_at_0%_0%,rgba(252,211,77,0.10),rgba(0,0,0,0)_55%),radial-gradient(980px_420px_at_100%_0%,rgba(193,120,255,0.12),rgba(0,0,0,0)_58%),#060608] p-4 shadow-[0_0_0_1px_rgba(252,211,77,0.62),0_0_12px_rgba(252,211,77,0.2),0_0_28px_rgba(193,120,255,0.28),0_0_48px_rgba(56,236,255,0.16),0_0_72px_rgba(56,236,255,0.12)] sm:p-5"
            : "cut-frame glass-dark mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-[1800px] flex-col overflow-hidden border border-amber-300/70 bg-[radial-gradient(1200px_420px_at_0%_0%,rgba(252,211,77,0.10),rgba(0,0,0,0)_55%),radial-gradient(980px_420px_at_100%_0%,rgba(193,120,255,0.12),rgba(0,0,0,0)_58%),#060608] p-3 shadow-[0_0_0_1px_rgba(252,211,77,0.62),0_0_12px_rgba(252,211,77,0.2),0_0_28px_rgba(193,120,255,0.28),0_0_48px_rgba(56,236,255,0.16),0_0_72px_rgba(56,236,255,0.12)] sm:min-h-[calc(100dvh-2.5rem)] sm:p-5"
        }
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-black uppercase tracking-[0.08em] text-[#f8efc0] drop-shadow-[0_0_12px_rgba(252,211,77,0.55)] sm:text-3xl">Affiliate Dashboard</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-black uppercase tracking-[0.18em] drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] ${
                dashboardSignal.tone === "good" ? "badge-live" : dashboardSignal.tone === "warn" ? "badge-warn" : "badge-danger"
              }`}
            >
              <span
                className={`inline-flex h-2.5 w-2.5 animate-pulse rounded-full ${
                  dashboardSignal.tone === "good"
                    ? "bg-[#00ff7a] shadow-[0_0_10px_rgba(0,255,122,0.85)]"
                    : dashboardSignal.tone === "warn"
                      ? "bg-[#ffd74d] shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                      : "bg-[#ff3b3b] shadow-[0_0_10px_rgba(255,59,59,0.85)]"
                }`}
              />
              {dashboardSignal.label}
            </div>
            {onLogout ? (
              <button
                type="button"
                onClick={handleLogout}
                className="cut-frame-sm hud-hover-glow cursor-pointer border border-fuchsia-300/70 bg-[linear-gradient(180deg,rgba(232,121,249,0.22),rgba(46,8,64,0.42))] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-fuchsia-100 shadow-[0_0_0_1px_rgba(232,121,249,0.65),0_0_18px_rgba(232,121,249,0.35)]"
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto pr-1 pb-16 no-scrollbar">
          {error ? null : null}

          <div className="cut-frame-sm border border-amber-300/75 bg-black/70 p-3 sm:py-4 sm:pl-4 sm:pr-0 shadow-[0_0_0_1px_rgba(252,211,77,0.92),0_0_12px_rgba(252,211,77,0.22),0_0_24px_rgba(193,120,255,0.48),0_0_56px_rgba(56,236,255,0.24),inset_0_0_24px_rgba(252,211,77,0.22)]">
            <div className="mx-auto w-full max-w-[1720px] cut-frame-sm border border-cyan-300/70 bg-black/80 p-3 shadow-[0_0_0_1px_rgba(56,236,255,0.92),0_0_12px_rgba(56,236,255,0.24),0_0_26px_rgba(193,120,255,0.44),0_0_52px_rgba(56,236,255,0.22),inset_0_0_24px_rgba(56,236,255,0.2)]">
              <div className="flex flex-col items-center gap-3 md:flex-row md:items-end md:justify-center">
                <div className="w-full md:max-w-[700px]">
                  <div className="mb-1 h-[25px] text-sm sm:text-base font-black uppercase tracking-[0.16em] text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]">Referral Link</div>
                  <input
                    value={activeReferralLink}
                    placeholder="Generate a referral link"
                    readOnly
                    className={`cut-frame-sm focus-ring-gold w-full border px-4 py-3.5 text-sm sm:text-base font-semibold outline-none placeholder:text-white/35 ${
                      copiedLink && copiedLink === activeReferralLink
                        ? "border-cyan-200/90 bg-[linear-gradient(180deg,rgba(56,236,255,0.22),rgba(10,20,28,0.95))] text-cyan-50 shadow-[0_0_0_1px_rgba(130,245,255,0.9),0_0_26px_rgba(56,236,255,0.5),0_0_58px_rgba(56,236,255,0.3),0_0_110px_rgba(56,236,255,0.2)]"
                        : "border-[rgba(255,215,0,0.5)] bg-black/85 text-white/95 shadow-[0_0_0_1px_rgba(252,211,77,0.6),0_0_24px_rgba(252,211,77,0.3),0_0_54px_rgba(193,120,255,0.24)]"
                    }`}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 md:pb-[1px]">
                  <button
                    type="button"
                    onClick={() => void copyLink(activeReferralLink)}
                    disabled={!activeReferralLink}
                    className="cut-frame-sm hud-hover-glow cursor-pointer min-w-[96px] sm:min-w-[124px] border border-cyan-300/85 bg-[linear-gradient(180deg,rgba(56,236,255,0.24),rgba(0,24,34,0.5))] px-5 sm:px-7 py-2.5 sm:py-3 text-sm sm:text-base font-black uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_0_1px_rgba(56,236,255,0.76),0_0_26px_rgba(56,236,255,0.4),0_0_60px_rgba(56,236,255,0.26)] transition duration-300 hover:scale-[1.03] hover:border-cyan-200/95 hover:shadow-[0_0_0_1px_rgba(130,245,255,0.95),0_0_36px_rgba(56,236,255,0.54),0_0_74px_rgba(56,236,255,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copiedLink && copiedLink === activeReferralLink ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void shareLink(activeReferralLink)}
                    disabled={!activeReferralLink}
                    className="cut-frame-sm hud-hover-glow cursor-pointer min-w-[96px] sm:min-w-[124px] border border-violet-300/85 bg-[linear-gradient(180deg,rgba(193,120,255,0.24),rgba(25,6,38,0.5))] px-5 sm:px-7 py-2.5 sm:py-3 text-sm sm:text-base font-black uppercase tracking-[0.16em] text-violet-100 shadow-[0_0_0_1px_rgba(193,120,255,0.76),0_0_26px_rgba(193,120,255,0.4),0_0_60px_rgba(193,120,255,0.26)] transition duration-300 hover:scale-[1.03] hover:border-violet-200/95 hover:shadow-[0_0_0_1px_rgba(221,173,255,0.95),0_0_36px_rgba(193,120,255,0.54),0_0_74px_rgba(193,120,255,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawAttemptedSubmit(false);
                      setWithdrawMessage(null);
                      setWithdrawOpen(true);
                    }}
                    className="cut-frame-sm hud-hover-glow cursor-pointer min-w-[108px] sm:min-w-[138px] border border-amber-300/85 bg-[linear-gradient(180deg,rgba(255,198,64,0.26),rgba(38,22,0,0.58))] px-5 sm:px-7 py-2.5 sm:py-3 text-sm sm:text-base font-black uppercase tracking-[0.16em] text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.78),0_0_28px_rgba(252,211,77,0.42),0_0_62px_rgba(252,211,77,0.26)] transition duration-300 hover:scale-[1.03] hover:border-amber-200/95 hover:shadow-[0_0_0_1px_rgba(255,239,176,0.95),0_0_38px_rgba(252,211,77,0.54),0_0_74px_rgba(252,211,77,0.3)]"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 cut-frame-sm border border-violet-300/75 bg-black/45 py-4 pl-4 pr-0 shadow-[0_0_0_1px_rgba(193,120,255,0.9),0_0_22px_rgba(193,120,255,0.86),0_0_56px_rgba(193,120,255,0.72),0_0_108px_rgba(193,120,255,0.56),inset_0_0_20px_rgba(193,120,255,0.27)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-black uppercase tracking-[0.2em] text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Performance Snapshot</div>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
              {[
                { label: "Clicks", value: overallStats?.click_count ?? "-", tone: "border-orange-300/80 bg-[linear-gradient(180deg,rgba(255,146,43,0.2),rgba(0,0,0,0.32))] shadow-[0_0_0_1px_rgba(253,186,116,0.92),0_0_24px_rgba(251,146,60,0.86),0_0_58px_rgba(251,146,60,0.66),0_0_108px_rgba(251,146,60,0.48),inset_0_0_20px_rgba(253,186,116,0.3)]" },
                { label: "Leads", value: overallStats?.lead_count ?? "-", tone: "border-emerald-300/80 bg-[linear-gradient(180deg,rgba(34,197,94,0.18),rgba(0,0,0,0.32))] shadow-[0_0_0_1px_rgba(110,231,183,0.92),0_0_24px_rgba(16,185,129,0.82),0_0_58px_rgba(16,185,129,0.62),0_0_108px_rgba(16,185,129,0.46),inset_0_0_20px_rgba(110,231,183,0.28)]" },
                { label: "Sales", value: overallStats?.sale_count ?? 0, tone: "border-cyan-300/80 bg-[linear-gradient(180deg,rgba(34,211,238,0.2),rgba(0,0,0,0.32))] shadow-[0_0_0_1px_rgba(103,232,249,0.92),0_0_24px_rgba(6,182,212,0.86),0_0_58px_rgba(6,182,212,0.66),0_0_108px_rgba(6,182,212,0.48),inset_0_0_20px_rgba(103,232,249,0.3)]" },
                { label: "Rate", value: `${conversionRing}%`, tone: "border-yellow-300/80 bg-[linear-gradient(180deg,rgba(255,215,0,0.2),rgba(0,0,0,0.32))] shadow-[0_0_0_1px_rgba(254,240,138,0.92),0_0_24px_rgba(250,204,21,0.86),0_0_58px_rgba(250,204,21,0.66),0_0_108px_rgba(250,204,21,0.48),inset_0_0_20px_rgba(254,240,138,0.3)]" },
                { label: "Earnings", value: `£${earningsDisplay}`, tone: "border-pink-300/80 bg-[linear-gradient(180deg,rgba(244,114,182,0.2),rgba(0,0,0,0.32))] shadow-[0_0_0_1px_rgba(249,168,212,0.92),0_0_24px_rgba(236,72,153,0.84),0_0_58px_rgba(236,72,153,0.64),0_0_108px_rgba(236,72,153,0.46),inset_0_0_20px_rgba(249,168,212,0.3)]" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`cut-frame-sm border px-3 py-2 ${item.tone ?? "border-[rgba(255,215,0,0.28)] bg-black/35"}`}
                >
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-white/68 drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]">{item.label}</div>
                  <div className="mt-1 text-2xl font-black text-[#f8d778] drop-shadow-[0_0_12px_rgba(248,215,120,0.5)]">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-2 relative cut-frame-sm border border-cyan-300/65 bg-black/30 p-3 shadow-[0_0_0_1px_rgba(34,211,238,0.9),0_0_22px_rgba(34,211,238,0.86),0_0_56px_rgba(34,211,238,0.72),0_0_108px_rgba(34,211,238,0.56),inset_0_0_20px_rgba(34,211,238,0.27)]">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-white/70 drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]">Revenue Flow</div>
              </div>
              <div className="grid grid-cols-[74px_1fr] gap-x-2 gap-y-2">
                {(funnel.length
                  ? funnel
                  : [
                      { stage: "Clicks", value: 0 },
                      { stage: "Leads", value: 0 },
                      { stage: "Conversions", value: 0 },
                    ]).map((row) => {
                  const max = Math.max(...(funnel.map((s) => s.value) || [0]), 1);
                  const pct = Math.max(2, Math.round((row.value / max) * 100));
                  const stageTone =
                    row.stage.toLowerCase().includes("click")
                      ? "bg-[linear-gradient(90deg,rgba(56,236,255,0.95),rgba(121,214,255,0.86),rgba(193,120,255,0.78))] shadow-[0_0_18px_rgba(56,236,255,0.34)]"
                      : row.stage.toLowerCase().includes("lead")
                        ? "bg-[linear-gradient(90deg,rgba(193,120,255,0.92),rgba(232,121,249,0.86),rgba(255,198,64,0.74))] shadow-[0_0_18px_rgba(193,120,255,0.34)]"
                        : "bg-[linear-gradient(90deg,rgba(255,198,64,0.95),rgba(252,211,77,0.86),rgba(56,236,255,0.78))] shadow-[0_0_18px_rgba(252,211,77,0.34)]";
                  return (
                    <div key={row.stage} className="contents">
                      <div
                        className="pt-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/72"
                        onMouseEnter={() => showFunnelValue(row)}
                        onMouseLeave={hideFunnelValue}
                      >
                        {row.stage}
                      </div>
                      <div
                        className="relative overflow-visible pt-4"
                        onMouseEnter={() => showFunnelValue(row)}
                        onMouseLeave={hideFunnelValue}
                      >
                        <div className="h-7 rounded border border-amber-300/25 bg-[linear-gradient(180deg,rgba(0,0,0,0.62),rgba(8,8,12,0.82))]" />
                        <div
                          className={`absolute left-0 top-0 h-7 rounded transition-[width] duration-500 ${stageTone}`}
                          style={{ width: `${pct}%` }}
                          onMouseEnter={() => showFunnelValue(row)}
                          onMouseLeave={hideFunnelValue}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {funnelHover ? (
                <div className="pointer-events-none absolute left-1/2 top-[44%] z-20 grid h-[65px] w-[65px] -translate-x-1/2 -translate-y-1/2 place-items-center cut-frame-sm hamburger-attract border border-amber-300/90 bg-[#000000] shadow-[0_0_0_1px_rgba(252,211,77,0.85),0_0_14px_rgba(252,211,77,0.46),0_0_28px_rgba(193,120,255,0.32)] animate-pulse">
                  <span className="text-[24px] font-black leading-none text-[#f8efc0] drop-shadow-[0_0_10px_rgba(252,211,77,0.42)]">
                    {funnelHover.value.toLocaleString()}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-5 cut-frame-sm border-2 border-fuchsia-400/90 bg-[radial-gradient(900px_280px_at_10%_0%,rgba(232,121,249,0.22),transparent_55%),radial-gradient(800px_260px_at_90%_100%,rgba(56,236,255,0.14),transparent_50%),linear-gradient(180deg,rgba(8,4,14,0.92),rgba(0,0,0,0.88))] p-4 shadow-[0_0_0_1px_rgba(232,121,249,0.95),0_0_28px_rgba(232,121,249,0.65),0_0_64px_rgba(193,120,255,0.45),0_0_120px_rgba(56,236,255,0.22),inset_0_0_32px_rgba(232,121,249,0.12)] sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-2 border-b border-fuchsia-500/35 pb-3">
              <div className="font-heading text-base font-black uppercase tracking-[0.2em] text-fuchsia-100 drop-shadow-[0_0_12px_rgba(232,121,249,0.55)] sm:text-lg">Recent Referrals</div>
            </div>
            <div className="space-y-4 min-h-[400px]">
              {recentReferrals.length ? (
                pagedRecentReferrals.map((r, idx) => {
                  const purchaseProgram =
                    r.purchased_program ||
                    (r as RecentReferralItem & { program?: string | null; purchased_item?: string | null }).program ||
                    (r as RecentReferralItem & { program?: string | null; purchased_item?: string | null }).purchased_item ||
                    r.purchased_offer;
                  const purchaseTier = r.purchased_tier || (r as RecentReferralItem & { tier?: string | null }).tier || null;
                  const purchaseAmountRaw =
                    r.purchase_amount ??
                    (r as RecentReferralItem & { amount?: string | number | null }).amount ??
                    null;
                  const purchaseCurrency = r.purchase_currency || (r as RecentReferralItem & { currency?: string | null }).currency || "£";
                  const subscriptionLabel =
                    (r.subscription_name && r.subscription_name.trim()) ||
                    purchaseProgram ||
                    purchaseTier ||
                    null;
                  const earningStr = r.conversion_earning != null && String(r.conversion_earning).trim() !== "" ? String(r.conversion_earning).trim() : null;
                  const rowNeon = [
                    "border-cyan-300/85 shadow-[0_0_0_1px_rgba(56,236,255,0.75),0_0_22px_rgba(56,236,255,0.45),inset_0_0_24px_rgba(56,236,255,0.08)] bg-[linear-gradient(135deg,rgba(6,18,24,0.92),rgba(0,0,0,0.88))]",
                    "border-amber-300/85 shadow-[0_0_0_1px_rgba(252,211,77,0.75),0_0_22px_rgba(252,211,77,0.4),inset_0_0_24px_rgba(252,211,77,0.08)] bg-[linear-gradient(135deg,rgba(28,18,4,0.92),rgba(0,0,0,0.88))]",
                    "border-fuchsia-300/85 shadow-[0_0_0_1px_rgba(232,121,249,0.75),0_0_22px_rgba(232,121,249,0.42),inset_0_0_24px_rgba(232,121,249,0.08)] bg-[linear-gradient(135deg,rgba(24,6,32,0.92),rgba(0,0,0,0.88))]",
                    "border-emerald-300/85 shadow-[0_0_0_1px_rgba(110,231,183,0.75),0_0_22px_rgba(52,211,153,0.38),inset_0_0_24px_rgba(16,185,129,0.08)] bg-[linear-gradient(135deg,rgba(4,20,14,0.92),rgba(0,0,0,0.88))]",
                  ][idx % 4];
                  return (
                    <div
                    key={`${r.visitor_id}-${idx}`}
                    className={`cut-frame-sm flex min-h-[112px] flex-col gap-3 border-2 px-4 py-4 sm:flex-row sm:items-stretch sm:justify-between sm:gap-4 sm:px-5 sm:py-4 ${rowNeon}`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded border border-white/25 bg-black/50 text-lg font-black text-white/90">
                        {(recentPage - 1) * RECENT_PAGE_SIZE + idx + 1}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="truncate text-lg font-semibold text-white">{r.email || "No email captured yet"}</div>
                        <div className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-black uppercase tracking-[0.16em] ${
                          r.status === "purchased"
                            ? "border-emerald-300/75 bg-emerald-500/20 text-emerald-200 shadow-[0_0_14px_rgba(52,211,153,0.35)]"
                            : "border-sky-300/75 bg-sky-500/15 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.28)]"
                        }`}>
                          {r.status}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="rounded-md border border-violet-400/50 bg-violet-950/40 px-3 py-2 shadow-[0_0_16px_rgba(167,139,250,0.25)]">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200/90">Subscription</div>
                            <div className="mt-1 text-sm font-semibold leading-snug text-violet-50">{subscriptionLabel ?? "—"}</div>
                          </div>
                          <div className="rounded-md border border-amber-400/55 bg-amber-950/35 px-3 py-2 shadow-[0_0_16px_rgba(251,191,36,0.28)]">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/90">Your earning</div>
                            <div className="mt-1 text-base font-black text-amber-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.45)]">
                              {earningStr != null ? `£${formatEarnings(earningStr)}` : "—"}
                            </div>
                          </div>
                        </div>
                        {r.status === "purchased" ? (
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold sm:text-sm">
                            {purchaseTier ? (
                              <span className="rounded border border-fuchsia-300/70 bg-fuchsia-500/15 px-2 py-0.5 text-fuchsia-200">Tier: {purchaseTier}</span>
                            ) : null}
                            {purchaseAmountRaw !== undefined && purchaseAmountRaw !== null && String(purchaseAmountRaw).trim() !== "" ? (
                              <span className="rounded border border-yellow-300/70 bg-yellow-500/15 px-2 py-0.5 text-yellow-200">
                                Paid: {purchaseCurrency}
                                {String(purchaseAmountRaw)}
                              </span>
                            ) : null}
                            <span className="rounded border border-cyan-300/70 bg-cyan-500/15 px-2 py-0.5 text-cyan-200">
                              {formatAgo(r.purchased_at ?? r.at)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-between gap-2 border-t border-white/10 pt-3 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-white/50">Updated</div>
                      <div className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-100/90">{formatAgo(r.at)}</div>
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="text-lg text-white/65">No referral activity yet.</div>
              )}
            </div>
            {recentReferrals.length > RECENT_PAGE_SIZE ? (
              <div className="mt-5 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setRecentPage((p) => Math.max(1, p - 1))}
                  disabled={recentPage <= 1}
                  className="cut-frame-sm min-h-[48px] min-w-[128px] border border-fuchsia-300/90 bg-[linear-gradient(180deg,rgba(232,121,249,0.28),rgba(28,6,42,0.62))] px-6 py-2 text-base font-black uppercase tracking-[0.16em] text-fuchsia-100 shadow-[0_0_0_1px_rgba(232,121,249,0.9),0_0_24px_rgba(232,121,249,0.44),0_0_52px_rgba(232,121,249,0.24)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                <div className="min-w-[144px] text-center text-base font-black uppercase tracking-[0.16em] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]">
                  Page {recentPage} / {totalRecentPages}
                </div>
                <button
                  type="button"
                  onClick={() => setRecentPage((p) => Math.min(totalRecentPages, p + 1))}
                  disabled={recentPage >= totalRecentPages}
                  className="cut-frame-sm min-h-[48px] min-w-[128px] border border-cyan-300/90 bg-[linear-gradient(180deg,rgba(56,236,255,0.28),rgba(4,24,32,0.62))] px-6 py-2 text-base font-black uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_0_1px_rgba(56,236,255,0.9),0_0_24px_rgba(56,236,255,0.44),0_0_52px_rgba(56,236,255,0.24)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-5 cut-frame-sm border-2 border-amber-400/90 bg-[radial-gradient(880px_280px_at_100%_0%,rgba(252,211,77,0.2),transparent_52%),radial-gradient(760px_260px_at_0%_100%,rgba(56,236,255,0.12),transparent_48%),linear-gradient(180deg,rgba(18,12,4,0.92),rgba(0,0,0,0.88))] p-4 shadow-[0_0_0_1px_rgba(252,211,77,0.95),0_0_28px_rgba(252,211,77,0.55),0_0_72px_rgba(56,236,255,0.28),0_0_120px_rgba(193,120,255,0.18),inset_0_0_32px_rgba(252,211,77,0.1)] sm:p-6">
            <h3 className="font-heading border-b border-amber-500/35 pb-3 text-base font-black uppercase tracking-[0.2em] text-amber-100 drop-shadow-[0_0_12px_rgba(252,211,77,0.45)] sm:text-lg">Affiliate Visitors</h3>
            <div className="mt-4 min-h-[420px] max-w-[1800px] overflow-auto no-scrollbar">
              <table className="w-full min-w-[1100px] text-left text-base sm:text-lg">
                <thead className="text-xs uppercase tracking-[0.14em] sm:text-sm">
                  <tr className="border-b-2 border-amber-400/40 bg-black/50">
                    <th className="px-3 py-3.5 text-cyan-200 drop-shadow-[0_0_8px_rgba(56,236,255,0.45)]">Visitor</th>
                    <th className="px-3 py-3.5 text-sky-200 drop-shadow-[0_0_8px_rgba(125,211,252,0.4)]">Clicked At</th>
                    <th className="px-3 py-3.5 text-emerald-200 drop-shadow-[0_0_8px_rgba(110,231,183,0.4)]">Lead Email</th>
                    <th className="px-3 py-3.5 text-fuchsia-200 drop-shadow-[0_0_8px_rgba(232,121,249,0.4)]">Lead At</th>
                    <th className="px-3 py-3.5 text-violet-200 drop-shadow-[0_0_8px_rgba(196,181,253,0.45)]">Subscription</th>
                    <th className="px-3 py-3.5 text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.45)]">Your earning</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.length > 0 ? (
                    pagedVisitors.map((v, vIdx) => {
                      const sub = (v.subscription_name && v.subscription_name.trim()) || null;
                      const earnRaw = v.conversion_earning ?? v.sale_amount;
                      const earn =
                        earnRaw != null && String(earnRaw).trim() !== "" && Number(earnRaw) !== 0
                          ? `£${formatEarnings(String(earnRaw))}`
                          : "—";
                      const stripe = vIdx % 2 === 0 ? "bg-black/25" : "bg-cyan-950/15";
                      return (
                        <tr key={v.visitor_id} className={`border-b border-cyan-500/15 text-white/92 ${stripe}`}>
                          <td className="px-3 py-3.5 font-semibold text-cyan-100">{v.visitor_id}</td>
                          <td className="px-3 py-3.5 text-sky-100">{formatWhen(v.clicked_at)}</td>
                          <td className="px-3 py-3.5 text-emerald-100">{v.lead_email ?? "—"}</td>
                          <td className="px-3 py-3.5 text-fuchsia-100">{formatWhen(v.lead_at)}</td>
                          <td className="px-3 py-3.5 text-violet-100">{sub ?? "—"}</td>
                          <td className="px-3 py-3.5 font-black text-amber-100">{earn}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-lg text-white/50">
                        No visitor activity yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {visitors.length > VISITORS_PAGE_SIZE ? (
              <div className="mt-5 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setVisitorsPage((p) => Math.max(1, p - 1))}
                  disabled={visitorsPage <= 1}
                  className="cut-frame-sm min-h-[48px] min-w-[128px] border border-fuchsia-300/90 bg-[linear-gradient(180deg,rgba(232,121,249,0.28),rgba(28,6,42,0.62))] px-6 py-2 text-base font-black uppercase tracking-[0.16em] text-fuchsia-100 shadow-[0_0_0_1px_rgba(232,121,249,0.9),0_0_24px_rgba(232,121,249,0.44),0_0_52px_rgba(232,121,249,0.24)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                <div className="min-w-[144px] text-center text-base font-black uppercase tracking-[0.16em] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]">
                  Page {visitorsPage} / {totalVisitorPages}
                </div>
                <button
                  type="button"
                  onClick={() => setVisitorsPage((p) => Math.min(totalVisitorPages, p + 1))}
                  disabled={visitorsPage >= totalVisitorPages}
                  className="cut-frame-sm min-h-[48px] min-w-[128px] border border-cyan-300/90 bg-[linear-gradient(180deg,rgba(56,236,255,0.28),rgba(4,24,32,0.62))] px-6 py-2 text-base font-black uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_0_1px_rgba(56,236,255,0.9),0_0_24px_rgba(56,236,255,0.44),0_0_52px_rgba(56,236,255,0.24)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </main>
      {withdrawOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto overscroll-contain touch-pan-y bg-[rgba(2,4,10,0.82)] p-3 backdrop-blur-[3px] sm:items-center sm:p-4"
          onClick={() => setWithdrawOpen(false)}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setWithdrawOpen(false);
          }}
        >
          <div
            className="cut-frame relative my-3 max-h-[calc(100dvh-1.5rem)] w-full max-w-[840px] overflow-y-auto overscroll-contain touch-pan-y border-[3px] border-cyan-300/95 bg-[radial-gradient(120%_100%_at_0%_0%,rgba(56,236,255,0.16),transparent_56%),radial-gradient(120%_100%_at_100%_100%,rgba(193,120,255,0.15),transparent_58%),radial-gradient(90%_80%_at_50%_0%,rgba(255,198,64,0.1),transparent_62%),linear-gradient(180deg,rgba(1,6,10,0.98),rgba(3,3,6,0.98))] p-4 pb-5 shadow-[0_0_0_1px_rgba(56,236,255,0.95),0_0_24px_rgba(56,236,255,0.42),0_0_58px_rgba(193,120,255,0.32),0_0_90px_rgba(252,211,77,0.2)] sm:my-0 sm:max-h-[calc(100dvh-2rem)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setWithdrawOpen(false)}
              onTouchEnd={() => setWithdrawOpen(false)}
              onPointerDown={(event) => event.stopPropagation()}
              aria-label="Close withdrawal form"
              className="absolute right-3 top-3 z-10 min-h-[40px] min-w-[78px] cursor-pointer touch-manipulation border-2 border-fuchsia-300/85 bg-[linear-gradient(180deg,rgba(232,121,249,0.3),rgba(18,3,28,0.78))] px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-fuchsia-100 shadow-[0_0_0_1px_rgba(232,121,249,0.8),0_0_16px_rgba(232,121,249,0.3)] transition-transform duration-200 ease-out hover:scale-110 active:scale-95 sm:right-4 sm:top-4 sm:min-h-11 sm:min-w-0 sm:px-4 sm:py-2 sm:text-xs [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]"
            >
              Close
            </button>
            <h3 className="pr-16 text-lg font-black uppercase tracking-[0.1em] text-amber-100 drop-shadow-[0_0_12px_rgba(252,211,77,0.5)] sm:pr-20 sm:text-[1.9rem]">
              Enter Account Details To Witdraw
            </h3>
            <p className="mt-2 text-sm sm:text-base font-bold text-cyan-100">
              Minimum earnings required for withdrawal: <span className="text-amber-200">£50.000</span>
            </p>
            <p className={`mt-1 text-sm font-black uppercase tracking-[0.12em] ${canRequestWithdraw ? "text-emerald-300" : "text-rose-300"}`}>
              Current earnings: £{earningsDisplay} {canRequestWithdraw ? "Eligible" : "Not eligible yet"}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-black uppercase tracking-[0.12em] text-cyan-100">
                Bank Name
                <input value={withdrawForm.bankName} onChange={(e) => updateWithdrawField("bankName", e.target.value)} className={`cut-frame-sm border-[3px] px-4 py-3 text-base font-bold tracking-[0.03em] outline-none placeholder:text-yellow-100/30 ${missingBankName ? "border-rose-400/95 bg-[linear-gradient(180deg,rgba(52,8,8,0.92),rgba(0,0,0,0.94))] text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.9),0_0_22px_rgba(251,113,133,0.35)] focus:border-rose-300" : "border-yellow-300/90 bg-[linear-gradient(180deg,rgba(42,28,0,0.86),rgba(0,0,0,0.9))] text-yellow-100 shadow-[0_0_0_1px_rgba(253,224,71,0.9),0_0_22px_rgba(253,224,71,0.3)] focus:border-yellow-200"}`} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-black uppercase tracking-[0.12em] text-fuchsia-100">
                Account Name
                <input value={withdrawForm.accountName} onChange={(e) => updateWithdrawField("accountName", e.target.value)} className={`cut-frame-sm border-[3px] px-4 py-3 text-base font-bold tracking-[0.03em] outline-none placeholder:text-pink-100/30 ${missingAccountName ? "border-rose-400/95 bg-[linear-gradient(180deg,rgba(52,8,8,0.92),rgba(0,0,0,0.94))] text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.9),0_0_22px_rgba(251,113,133,0.35)] focus:border-rose-300" : "border-pink-300/90 bg-[linear-gradient(180deg,rgba(36,4,24,0.88),rgba(0,0,0,0.9))] text-pink-100 shadow-[0_0_0_1px_rgba(249,168,212,0.9),0_0_22px_rgba(249,168,212,0.3)] focus:border-pink-200"}`} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-black uppercase tracking-[0.12em] text-cyan-100">
                Account Number
                <input value={withdrawForm.accountNumber} onChange={(e) => updateWithdrawField("accountNumber", e.target.value)} className={`cut-frame-sm border-[3px] px-4 py-3 text-base font-bold tracking-[0.03em] outline-none placeholder:text-blue-100/30 ${missingAccountNumber ? "border-rose-400/95 bg-[linear-gradient(180deg,rgba(52,8,8,0.92),rgba(0,0,0,0.94))] text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.9),0_0_22px_rgba(251,113,133,0.35)] focus:border-rose-300" : "border-blue-300/90 bg-[linear-gradient(180deg,rgba(2,10,26,0.9),rgba(0,0,0,0.9))] text-blue-100 shadow-[0_0_0_1px_rgba(147,197,253,0.9),0_0_22px_rgba(96,165,250,0.3)] focus:border-blue-200"}`} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-black uppercase tracking-[0.12em] text-fuchsia-100">
                IBAN
                <input value={withdrawForm.iban} onChange={(e) => updateWithdrawField("iban", e.target.value)} className={`cut-frame-sm border-[3px] px-4 py-3 text-base font-bold tracking-[0.03em] outline-none placeholder:text-purple-100/30 ${missingIban ? "border-rose-400/95 bg-[linear-gradient(180deg,rgba(52,8,8,0.92),rgba(0,0,0,0.94))] text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.9),0_0_22px_rgba(251,113,133,0.35)] focus:border-rose-300" : "border-purple-300/90 bg-[linear-gradient(180deg,rgba(20,6,38,0.9),rgba(0,0,0,0.9))] text-purple-100 shadow-[0_0_0_1px_rgba(216,180,254,0.9),0_0_22px_rgba(192,132,252,0.3)] focus:border-purple-200"}`} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-black uppercase tracking-[0.12em] text-cyan-100">
                Phone Number
                <input value={withdrawForm.phoneNumber} onChange={(e) => updateWithdrawField("phoneNumber", e.target.value)} className={`cut-frame-sm border-[3px] px-4 py-3 text-base font-bold tracking-[0.03em] outline-none placeholder:text-emerald-100/30 ${missingPhone ? "border-rose-400/95 bg-[linear-gradient(180deg,rgba(52,8,8,0.92),rgba(0,0,0,0.94))] text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.9),0_0_22px_rgba(251,113,133,0.35)] focus:border-rose-300" : "border-emerald-300/90 bg-[linear-gradient(180deg,rgba(3,24,14,0.9),rgba(0,0,0,0.9))] text-emerald-100 shadow-[0_0_0_1px_rgba(110,231,183,0.9),0_0_22px_rgba(52,211,153,0.3)] focus:border-emerald-200"}`} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-black uppercase tracking-[0.12em] text-fuchsia-100">
                Branch Name (Optional)
                <input value={withdrawForm.branchName} onChange={(e) => updateWithdrawField("branchName", e.target.value)} className="cut-frame-sm border-[3px] border-orange-300/90 bg-[linear-gradient(180deg,rgba(10,10,12,0.95),rgba(0,0,0,0.95))] px-4 py-3 text-base font-bold tracking-[0.03em] text-orange-100 shadow-[0_0_0_1px_rgba(253,186,116,0.9),0_0_20px_rgba(251,146,60,0.28)] outline-none placeholder:text-orange-100/30 focus:border-orange-200" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-black uppercase tracking-[0.12em] text-cyan-100 sm:col-span-2">
                Enter Amount You Want To Withdraw
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={withdrawForm.amount}
                  onChange={(e) => updateWithdrawField("amount", e.target.value)}
                  placeholder={`Max £${earningsDisplay}`}
                  className={`cut-frame-sm border-[3px] px-4 py-3 text-base font-bold tracking-[0.03em] outline-none placeholder:text-lime-100/30 ${
                    missingAmount || invalidAmount
                      ? "border-rose-400/95 bg-[linear-gradient(180deg,rgba(52,8,8,0.92),rgba(0,0,0,0.94))] text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.9),0_0_20px_rgba(251,113,133,0.32)] focus:border-rose-300"
                      : "border-lime-300/90 bg-[linear-gradient(180deg,rgba(7,18,4,0.94),rgba(0,0,0,0.92))] text-lime-100 shadow-[0_0_0_1px_rgba(190,242,100,0.9),0_0_20px_rgba(132,204,22,0.3)] focus:border-lime-200"
                  }`}
                />
                <span className={`text-xs font-bold normal-case tracking-normal ${withdrawAmountValid || !withdrawForm.amount ? "text-lime-200/90" : "text-rose-300"}`}>
                  Enter up to your balance (max £{earningsDisplay}).
                </span>
              </label>
            </div>
            {withdrawMessage ? (
              <div
                className={`mt-4 cut-frame-sm border px-4 py-2 text-sm font-bold ${
                  withdrawMessage.tone === "good"
                    ? "border-emerald-300/70 bg-emerald-500/10 text-emerald-200"
                    : withdrawMessage.tone === "bad"
                      ? "border-rose-300/70 bg-rose-500/10 text-rose-200"
                      : "border-cyan-300/70 bg-cyan-500/10 text-cyan-200"
                }`}
              >
                {withdrawMessage.text}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-amber-100/95">
                Payout arrives within 1-2 weeks.
              </p>
              <button
                type="button"
                onClick={() => void submitWithdrawRequest()}
                disabled={!canSubmitWithdraw}
                className={`hud-hover-glow w-full cursor-pointer border-[3px] px-7 py-3.5 text-sm sm:min-w-[240px] sm:w-auto sm:text-base font-black uppercase tracking-[0.16em] [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)] disabled:cursor-not-allowed disabled:opacity-40 ${
                  withdrawButtonErrorState
                    ? "border-rose-300/95 bg-[linear-gradient(180deg,rgba(255,95,109,0.3),rgba(40,6,10,0.9))] text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.94),0_0_18px_rgba(251,113,133,0.4),0_0_42px_rgba(251,113,133,0.24)]"
                    : "border-amber-300/90 bg-[linear-gradient(180deg,rgba(255,198,64,0.32),rgba(24,16,2,0.86))] text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.92),0_0_18px_rgba(252,211,77,0.34),0_0_42px_rgba(252,211,77,0.22)]"
                }`}
              >
                {withdrawSubmitting ? "Submitting..." : "Submit Withdrawal"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


