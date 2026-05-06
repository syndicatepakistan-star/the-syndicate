"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getAffiliateFunnel,
  getAffiliateStats,
  getAffiliateVisitors,
  getRecentReferrals,
  requestAffiliateWithdrawal
} from "@/lib/affiliateApi";
import type { AffiliateStats, AffiliateVisitor } from "@/lib/affiliateTypes";

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
  const [recentReferrals, setRecentReferrals] = useState<Array<{ visitor_id: string; email?: string | null; status: "joined" | "purchased"; at: string | null }>>([]);
  const [recentPage, setRecentPage] = useState(1);
  const [visitorsPage, setVisitorsPage] = useState(1);
  const [activeReferralLink, setActiveReferralLink] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<{ text: string; tone: "good" | "bad" | "info" } | null>(null);
  const [withdrawForm, setWithdrawForm] = useState<WithdrawFormState>({
    bankName: "",
    accountName: "",
    accountNumber: "",
    iban: "",
    phoneNumber: "",
    branchName: "",
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
  const withdrawFormValid = useMemo(() => {
    return (
      withdrawForm.bankName.trim().length > 0 &&
      withdrawForm.accountName.trim().length > 0 &&
      withdrawForm.accountNumber.trim().length > 0 &&
      withdrawForm.iban.trim().length > 0 &&
      withdrawForm.phoneNumber.trim().length > 0
    );
  }, [withdrawForm]);
  const canSubmitWithdraw = canRequestWithdraw && withdrawFormValid && !withdrawSubmitting;
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
    if (!canSubmitWithdraw) return;
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
      });
      setWithdrawMessage({ text: "Withdrawal request submitted successfully.", tone: "good" });
      setWithdrawOpen(false);
      setWithdrawForm({
        bankName: "",
        accountName: "",
        accountNumber: "",
        iban: "",
        phoneNumber: "",
        branchName: "",
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
      setRecentPage(1);
      setVisitorsPage(1);
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

  return (
    <div
      className={
        embedded
          ? "affiliate-portal-embed w-full bg-transparent p-0 text-white"
          : "font-thryon min-h-screen w-full bg-[#090909] p-3 text-white md:p-5"
      }
    >
      <main
        className={
          embedded
            ? "cut-frame glass-dark mx-auto flex h-auto min-h-[min(58vh,560px)] max-h-[min(82vh,920px)] w-full max-w-none flex-col overflow-hidden border border-amber-300/70 bg-[radial-gradient(1200px_420px_at_0%_0%,rgba(252,211,77,0.10),rgba(0,0,0,0)_55%),radial-gradient(980px_420px_at_100%_0%,rgba(193,120,255,0.12),rgba(0,0,0,0)_58%),#060608] p-4 shadow-[0_0_0_1px_rgba(252,211,77,0.62),0_0_12px_rgba(252,211,77,0.2),0_0_28px_rgba(193,120,255,0.28),0_0_48px_rgba(56,236,255,0.16),0_0_72px_rgba(56,236,255,0.12)] sm:p-5"
            : "cut-frame glass-dark mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-[1800px] flex-col overflow-hidden border border-amber-300/70 bg-[radial-gradient(1200px_420px_at_0%_0%,rgba(252,211,77,0.10),rgba(0,0,0,0)_55%),radial-gradient(980px_420px_at_100%_0%,rgba(193,120,255,0.12),rgba(0,0,0,0)_58%),#060608] p-4 shadow-[0_0_0_1px_rgba(252,211,77,0.62),0_0_12px_rgba(252,211,77,0.2),0_0_28px_rgba(193,120,255,0.28),0_0_48px_rgba(56,236,255,0.16),0_0_72px_rgba(56,236,255,0.12)] sm:h-[calc(100vh-2.5rem)] sm:p-5"
        }
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-[#f8efc0] drop-shadow-[0_0_12px_rgba(252,211,77,0.55)] sm:text-3xl">Affiliate Dashboard</h2>
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
                className="cut-frame-sm hud-hover-glow border border-fuchsia-300/70 bg-[linear-gradient(180deg,rgba(232,121,249,0.22),rgba(46,8,64,0.42))] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-fuchsia-100 shadow-[0_0_0_1px_rgba(232,121,249,0.65),0_0_18px_rgba(232,121,249,0.35)]"
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto pr-1 pb-16 no-scrollbar">
          {error ? null : null}

          <div className="cut-frame-sm border border-amber-300/75 bg-black/70 py-4 pl-4 pr-0 shadow-[0_0_0_1px_rgba(252,211,77,0.92),0_0_12px_rgba(252,211,77,0.22),0_0_24px_rgba(193,120,255,0.48),0_0_56px_rgba(56,236,255,0.24),inset_0_0_24px_rgba(252,211,77,0.22)]">
            <div className="mx-auto w-full max-w-[1720px] cut-frame-sm border border-cyan-300/70 bg-black/80 p-3 shadow-[0_0_0_1px_rgba(56,236,255,0.92),0_0_12px_rgba(56,236,255,0.24),0_0_26px_rgba(193,120,255,0.44),0_0_52px_rgba(56,236,255,0.22),inset_0_0_24px_rgba(56,236,255,0.2)]">
              <div className="flex flex-col items-center gap-3 md:flex-row md:items-end md:justify-center">
                <div className="w-full md:max-w-[700px]">
                  <div className="mb-1 h-[25px] text-base font-black uppercase tracking-[0.16em] text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]">Referral Link</div>
                  <input
                    value={activeReferralLink}
                    placeholder="Generate a referral link"
                    readOnly
                    className={`cut-frame-sm focus-ring-gold w-full border px-4 py-3.5 text-xl font-semibold outline-none placeholder:text-white/35 ${
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
                    className="cut-frame-sm hud-hover-glow min-w-[124px] border border-cyan-300/85 bg-[linear-gradient(180deg,rgba(56,236,255,0.24),rgba(0,24,34,0.5))] px-7 py-3 text-base font-black uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_0_1px_rgba(56,236,255,0.76),0_0_26px_rgba(56,236,255,0.4),0_0_60px_rgba(56,236,255,0.26)] transition duration-300 hover:scale-[1.03] hover:border-cyan-200/95 hover:shadow-[0_0_0_1px_rgba(130,245,255,0.95),0_0_36px_rgba(56,236,255,0.54),0_0_74px_rgba(56,236,255,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copiedLink && copiedLink === activeReferralLink ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void shareLink(activeReferralLink)}
                    disabled={!activeReferralLink}
                    className="cut-frame-sm hud-hover-glow min-w-[124px] border border-violet-300/85 bg-[linear-gradient(180deg,rgba(193,120,255,0.24),rgba(25,6,38,0.5))] px-7 py-3 text-base font-black uppercase tracking-[0.16em] text-violet-100 shadow-[0_0_0_1px_rgba(193,120,255,0.76),0_0_26px_rgba(193,120,255,0.4),0_0_60px_rgba(193,120,255,0.26)] transition duration-300 hover:scale-[1.03] hover:border-violet-200/95 hover:shadow-[0_0_0_1px_rgba(221,173,255,0.95),0_0_36px_rgba(193,120,255,0.54),0_0_74px_rgba(193,120,255,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawMessage(null);
                      setWithdrawOpen(true);
                    }}
                    className="cut-frame-sm hud-hover-glow min-w-[138px] border border-amber-300/85 bg-[linear-gradient(180deg,rgba(255,198,64,0.26),rgba(38,22,0,0.58))] px-7 py-3 text-base font-black uppercase tracking-[0.16em] text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.78),0_0_28px_rgba(252,211,77,0.42),0_0_62px_rgba(252,211,77,0.26)] transition duration-300 hover:scale-[1.03] hover:border-amber-200/95 hover:shadow-[0_0_0_1px_rgba(255,239,176,0.95),0_0_38px_rgba(252,211,77,0.54),0_0_74px_rgba(252,211,77,0.3)]"
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
                { label: "Clicks", value: overallStats?.click_count ?? "-", tone: "border-cyan-300/75 bg-[linear-gradient(180deg,rgba(56,236,255,0.12),rgba(0,0,0,0.3))] shadow-[0_0_0_1px_rgba(34,211,238,0.9),0_0_22px_rgba(34,211,238,0.86),0_0_56px_rgba(34,211,238,0.72),0_0_108px_rgba(34,211,238,0.56),inset_0_0_20px_rgba(34,211,238,0.27)]" },
                { label: "Leads", value: overallStats?.lead_count ?? "-", tone: "border-violet-300/75 bg-[linear-gradient(180deg,rgba(193,120,255,0.12),rgba(0,0,0,0.3))] shadow-[0_0_0_1px_rgba(193,120,255,0.9),0_0_22px_rgba(193,120,255,0.86),0_0_56px_rgba(193,120,255,0.72),0_0_108px_rgba(193,120,255,0.56),inset_0_0_20px_rgba(193,120,255,0.27)]" },
                { label: "Sales", value: overallStats?.sale_count ?? 0, tone: "border-cyan-300/75 bg-[linear-gradient(180deg,rgba(56,236,255,0.12),rgba(0,0,0,0.3))] shadow-[0_0_0_1px_rgba(56,236,255,0.9),0_0_22px_rgba(56,236,255,0.86),0_0_56px_rgba(56,236,255,0.72),0_0_108px_rgba(56,236,255,0.56),inset_0_0_20px_rgba(56,236,255,0.27)]" },
                { label: "Rate", value: `${conversionRing}%`, tone: "border-amber-300/75 bg-[linear-gradient(180deg,rgba(255,198,64,0.14),rgba(0,0,0,0.3))] shadow-[0_0_0_1px_rgba(252,211,77,0.9),0_0_22px_rgba(252,211,77,0.86),0_0_56px_rgba(252,211,77,0.72),0_0_108px_rgba(252,211,77,0.56),inset_0_0_20px_rgba(252,211,77,0.27)]" },
                { label: "Earnings", value: `£${earningsDisplay}`, tone: earningsCardToneClass },
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

          <div className="mt-5 cut-frame-sm border border-fuchsia-300/75 bg-black/45 py-4 pl-4 pr-4 shadow-[0_0_0_1px_rgba(232,121,249,0.88),0_0_22px_rgba(232,121,249,0.72),0_0_56px_rgba(232,121,249,0.5),0_0_108px_rgba(193,120,255,0.34),inset_0_0_20px_rgba(232,121,249,0.22)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-black uppercase tracking-[0.2em] text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Recent Referrals</div>
            </div>
            <div className="space-y-3">
              {recentReferrals.length ? (
                pagedRecentReferrals.map((r, idx) => (
                  <div
                    key={`${r.visitor_id}-${idx}`}
                    className="cut-frame-sm hud-hover-glow flex items-center justify-between gap-3 border border-cyan-300/28 bg-black/40 px-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded border border-[rgba(0,191,255,0.35)] bg-black/55 text-base font-black text-[#bfefff]">
                        {(recentPage - 1) * RECENT_PAGE_SIZE + idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-base font-bold text-white/90">{r.email || "No email captured yet"}</div>
                        <div className={`text-[11px] font-black uppercase tracking-[0.16em] ${r.status === "purchased" ? "text-[#86ffbf]" : "text-white/55"}`}>
                          {r.status}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-white/65">{formatAgo(r.at)}</div>
                  </div>
                ))
              ) : (
                <div className="text-base text-white/65">No referral activity yet.</div>
              )}
            </div>
            {recentReferrals.length > RECENT_PAGE_SIZE ? (
              <div className="mt-5 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setRecentPage((p) => Math.max(1, p - 1))}
                  disabled={recentPage <= 1}
                  className="cut-frame-sm min-h-[44px] min-w-[112px] border border-fuchsia-300/90 bg-[linear-gradient(180deg,rgba(232,121,249,0.28),rgba(28,6,42,0.62))] px-6 py-2 text-sm font-black uppercase tracking-[0.16em] text-fuchsia-100 shadow-[0_0_0_1px_rgba(232,121,249,0.9),0_0_24px_rgba(232,121,249,0.44),0_0_52px_rgba(232,121,249,0.24)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                <div className="min-w-[122px] text-center text-sm font-black uppercase tracking-[0.16em] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]">
                  Page {recentPage} / {totalRecentPages}
                </div>
                <button
                  type="button"
                  onClick={() => setRecentPage((p) => Math.min(totalRecentPages, p + 1))}
                  disabled={recentPage >= totalRecentPages}
                  className="cut-frame-sm min-h-[44px] min-w-[112px] border border-cyan-300/90 bg-[linear-gradient(180deg,rgba(56,236,255,0.28),rgba(4,24,32,0.62))] px-6 py-2 text-sm font-black uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_0_1px_rgba(56,236,255,0.9),0_0_24px_rgba(56,236,255,0.44),0_0_52px_rgba(56,236,255,0.24)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-5 cut-frame-sm border border-amber-300/75 bg-black/45 py-4 pl-4 pr-4 shadow-[0_0_0_1px_rgba(252,211,77,0.86),0_0_22px_rgba(252,211,77,0.72),0_0_56px_rgba(56,236,255,0.32),0_0_108px_rgba(193,120,255,0.22),inset_0_0_20px_rgba(252,211,77,0.2)]">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Affiliate Visitors</h3>
            <div className="mt-3 max-w-[1400px] overflow-auto no-scrollbar">
              <table className="w-full min-w-[700px] text-left text-base">
                <thead className="text-xs uppercase tracking-[0.14em] text-white/70">
                  <tr className="border-b border-[rgba(255,215,0,0.2)]">
                    <th className="px-2 py-2">Visitor</th>
                    <th className="px-2 py-2">Clicked At</th>
                    <th className="px-2 py-2">Lead Email</th>
                    <th className="px-2 py-2">Lead At</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.length > 0 ? (
                    pagedVisitors.map((v) => (
                      <tr key={v.visitor_id} className="border-b border-white/10 text-white/85">
                        <td className="px-2 py-2 font-semibold">{v.visitor_id}</td>
                        <td className="px-2 py-2">{formatWhen(v.clicked_at)}</td>
                        <td className="px-2 py-2">{v.lead_email ?? "-"}</td>
                        <td className="px-2 py-2">{formatWhen(v.lead_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-2 py-5 text-center text-white/45">
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
                  className="cut-frame-sm min-h-[44px] min-w-[112px] border border-fuchsia-300/90 bg-[linear-gradient(180deg,rgba(232,121,249,0.28),rgba(28,6,42,0.62))] px-6 py-2 text-sm font-black uppercase tracking-[0.16em] text-fuchsia-100 shadow-[0_0_0_1px_rgba(232,121,249,0.9),0_0_24px_rgba(232,121,249,0.44),0_0_52px_rgba(232,121,249,0.24)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                <div className="min-w-[122px] text-center text-sm font-black uppercase tracking-[0.16em] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]">
                  Page {visitorsPage} / {totalVisitorPages}
                </div>
                <button
                  type="button"
                  onClick={() => setVisitorsPage((p) => Math.min(totalVisitorPages, p + 1))}
                  disabled={visitorsPage >= totalVisitorPages}
                  className="cut-frame-sm min-h-[44px] min-w-[112px] border border-cyan-300/90 bg-[linear-gradient(180deg,rgba(56,236,255,0.28),rgba(4,24,32,0.62))] px-6 py-2 text-sm font-black uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_0_1px_rgba(56,236,255,0.9),0_0_24px_rgba(56,236,255,0.44),0_0_52px_rgba(56,236,255,0.24)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </main>
      {withdrawOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(2,4,10,0.82)] p-4 backdrop-blur-[3px]">
          <div className="cut-frame relative w-full max-w-[840px] border-[3px] border-cyan-300/95 bg-[radial-gradient(120%_100%_at_0%_0%,rgba(56,236,255,0.16),transparent_56%),radial-gradient(120%_100%_at_100%_100%,rgba(193,120,255,0.15),transparent_58%),radial-gradient(90%_80%_at_50%_0%,rgba(255,198,64,0.1),transparent_62%),linear-gradient(180deg,rgba(1,6,10,0.98),rgba(3,3,6,0.98))] p-7 shadow-[0_0_0_1px_rgba(56,236,255,0.95),0_0_24px_rgba(56,236,255,0.42),0_0_58px_rgba(193,120,255,0.32),0_0_90px_rgba(252,211,77,0.2)] sm:p-8">
            <button
              type="button"
              onClick={() => setWithdrawOpen(false)}
              className="absolute right-4 top-4 border-2 border-fuchsia-300/85 bg-[linear-gradient(180deg,rgba(232,121,249,0.3),rgba(18,3,28,0.78))] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-fuchsia-100 shadow-[0_0_0_1px_rgba(232,121,249,0.8),0_0_16px_rgba(232,121,249,0.3)] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]"
            >
              Close
            </button>
            <h3 className="pr-20 text-[1.55rem] font-black uppercase tracking-[0.1em] text-amber-100 drop-shadow-[0_0_12px_rgba(252,211,77,0.5)] sm:text-[1.9rem]">
              Enter Account Details To Witdraw
            </h3>
            <p className="mt-2 text-base font-bold text-cyan-100">
              Minimum earnings required for withdrawal: <span className="text-amber-200">£50.000</span>
            </p>
            <p className={`mt-1 text-sm font-black uppercase tracking-[0.12em] ${canRequestWithdraw ? "text-emerald-300" : "text-rose-300"}`}>
              Current earnings: £{earningsDisplay} {canRequestWithdraw ? "Eligible" : "Not eligible yet"}
            </p>
            <p className="mt-1 text-sm font-semibold text-amber-100/95">
              You will get your withdraw amount within 1-2 weeks.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-black uppercase tracking-[0.12em] text-cyan-100">
                Bank Name
                <input value={withdrawForm.bankName} onChange={(e) => updateWithdrawField("bankName", e.target.value)} className="cut-frame-sm border-[3px] border-yellow-300/90 bg-[linear-gradient(180deg,rgba(42,28,0,0.86),rgba(0,0,0,0.9))] px-4 py-3 text-base font-bold tracking-[0.03em] text-yellow-100 shadow-[0_0_0_1px_rgba(253,224,71,0.9),0_0_22px_rgba(253,224,71,0.3)] outline-none placeholder:text-yellow-100/30 focus:border-yellow-200" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-black uppercase tracking-[0.12em] text-fuchsia-100">
                Account Name
                <input value={withdrawForm.accountName} onChange={(e) => updateWithdrawField("accountName", e.target.value)} className="cut-frame-sm border-[3px] border-pink-300/90 bg-[linear-gradient(180deg,rgba(36,4,24,0.88),rgba(0,0,0,0.9))] px-4 py-3 text-base font-bold tracking-[0.03em] text-pink-100 shadow-[0_0_0_1px_rgba(249,168,212,0.9),0_0_22px_rgba(249,168,212,0.3)] outline-none placeholder:text-pink-100/30 focus:border-pink-200" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-black uppercase tracking-[0.12em] text-cyan-100">
                Account Number
                <input value={withdrawForm.accountNumber} onChange={(e) => updateWithdrawField("accountNumber", e.target.value)} className="cut-frame-sm border-[3px] border-blue-300/90 bg-[linear-gradient(180deg,rgba(2,10,26,0.9),rgba(0,0,0,0.9))] px-4 py-3 text-base font-bold tracking-[0.03em] text-blue-100 shadow-[0_0_0_1px_rgba(147,197,253,0.9),0_0_22px_rgba(96,165,250,0.3)] outline-none placeholder:text-blue-100/30 focus:border-blue-200" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-black uppercase tracking-[0.12em] text-fuchsia-100">
                IBAN
                <input value={withdrawForm.iban} onChange={(e) => updateWithdrawField("iban", e.target.value)} className="cut-frame-sm border-[3px] border-purple-300/90 bg-[linear-gradient(180deg,rgba(20,6,38,0.9),rgba(0,0,0,0.9))] px-4 py-3 text-base font-bold tracking-[0.03em] text-purple-100 shadow-[0_0_0_1px_rgba(216,180,254,0.9),0_0_22px_rgba(192,132,252,0.3)] outline-none placeholder:text-purple-100/30 focus:border-purple-200" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-black uppercase tracking-[0.12em] text-cyan-100">
                Phone Number
                <input value={withdrawForm.phoneNumber} onChange={(e) => updateWithdrawField("phoneNumber", e.target.value)} className="cut-frame-sm border-[3px] border-emerald-300/90 bg-[linear-gradient(180deg,rgba(3,24,14,0.9),rgba(0,0,0,0.9))] px-4 py-3 text-base font-bold tracking-[0.03em] text-emerald-100 shadow-[0_0_0_1px_rgba(110,231,183,0.9),0_0_22px_rgba(52,211,153,0.3)] outline-none placeholder:text-emerald-100/30 focus:border-emerald-200" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-black uppercase tracking-[0.12em] text-fuchsia-100">
                Branch Name (Optional)
                <input value={withdrawForm.branchName} onChange={(e) => updateWithdrawField("branchName", e.target.value)} className="cut-frame-sm border-[3px] border-orange-300/90 bg-[linear-gradient(180deg,rgba(10,10,12,0.95),rgba(0,0,0,0.95))] px-4 py-3 text-base font-bold tracking-[0.03em] text-orange-100 shadow-[0_0_0_1px_rgba(253,186,116,0.9),0_0_20px_rgba(251,146,60,0.28)] outline-none placeholder:text-orange-100/30 focus:border-orange-200" />
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

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => void submitWithdrawRequest()}
                disabled={!canSubmitWithdraw}
                className="hud-hover-glow min-w-[240px] border-[3px] border-amber-300/90 bg-[linear-gradient(180deg,rgba(255,198,64,0.32),rgba(24,16,2,0.86))] px-7 py-3.5 text-base font-black uppercase tracking-[0.16em] text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.92),0_0_18px_rgba(252,211,77,0.34),0_0_42px_rgba(252,211,77,0.22)] [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)] disabled:cursor-not-allowed disabled:opacity-40"
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


