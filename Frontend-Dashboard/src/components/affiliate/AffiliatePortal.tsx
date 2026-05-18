"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getAffiliateFunnel,
  getAffiliateStats,
  getRecentReferrals,
  getWithdrawalStatement,
  requestAffiliateWithdrawal
} from "@/lib/affiliateApi";
import type { AffiliateStats, RecentReferralItem, ReferralLeadEvent, WithdrawalStatementItem } from "@/lib/affiliateTypes";

type ToastTone = "good" | "warn" | "bad" | "info";

/** Withdrawal rows that no longer reserve balance (excluded from statement total). */
const WITHDRAWAL_REFUNDED_STATUSES = new Set(["rejected", "cancelled", "denied", "refunded", "failed"]);

/** Which lead milestone the referral row detail panel is showing (Syn Diagnosis vs sign-up / checkout). */
type ReferralLeadTab = "diagnosis" | "auth";

function defaultReferralLeadTab(r: RecentReferralItem): ReferralLeadTab {
  const kinds = new Set((r.lead_events ?? []).map((e) => e.kind));
  const hasDiagnosis = kinds.has("diagnosis");
  const hasAuth = kinds.has("auth");
  if (hasAuth && r.status === "purchased") return "auth";
  if (hasDiagnosis) return "diagnosis";
  if (hasAuth) return "auth";
  return "diagnosis";
}

function leadTabForEvent(evt: ReferralLeadEvent): ReferralLeadTab {
  return evt.kind === "diagnosis" ? "diagnosis" : "auth";
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

/** Human-readable paid line: avoids `Paid: gbp333.00` when currency is ISO code. */
function formatPaidDisplay(currencyRaw: string | null | undefined, amountRaw: string | number | null | undefined): string | null {
  if (amountRaw === undefined || amountRaw === null) return null;
  const rawStr = String(amountRaw).trim();
  if (!rawStr) return null;
  const cur = (currencyRaw ?? "$").trim().toLowerCase();
  const symbol =
    cur === "usd" || cur === "$"
      ? "$"
      : cur === "gbp" || cur === "£" || cur === "pound" || cur === "pounds"
        ? "£"
        : cur === "eur" || cur === "€"
          ? "€"
          : cur.length <= 4 && /^[a-z]{3}$/i.test(cur)
            ? `${cur.toUpperCase()} `
            : `${cur} `;
  const num = Number(rawStr.replace(/[^0-9.]/g, ""));
  if (Number.isFinite(num)) return `Paid: ${symbol}${num.toFixed(2)}`;
  return `Paid: ${symbol}${rawStr}`;
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
  const [funnel, setFunnel] = useState<Array<{ stage: string; value: number }>>([]);
  const [funnelHover, setFunnelHover] = useState<{ stage: string; value: number } | null>(null);
  const funnelHoverLeaveTimer = useRef<number | null>(null);
  const [recentReferrals, setRecentReferrals] = useState<RecentReferralItem[]>([]);
  const [withdrawalStatementItems, setWithdrawalStatementItems] = useState<WithdrawalStatementItem[]>([]);
  /** Per visitor_id: which lead chip is driving the left detail column (Syn Diagnosis vs sign-up / subscription). */
  const [referralLeadTabByVisitor, setReferralLeadTabByVisitor] = useState<Record<string, ReferralLeadTab>>({});
  const [recentPage, setRecentPage] = useState(1);
  /** Referrals list: sort by activity time (purchased_at ?? at). */
  const [referralsTimeSort, setReferralsTimeSort] = useState<"asc" | "desc">("desc");
  /** Tiebreaker / secondary: commission (conversion_earning). */
  const [referralsPriceSort, setReferralsPriceSort] = useState<"asc" | "desc">("asc");
  const [activeReferralLink, setActiveReferralLink] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  /** Payout-withdrawal statement panel: hidden until user opens via SYN control (like conversion formula reveal). */
  const [payoutStatementOpen, setPayoutStatementOpen] = useState(false);
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
  /** Confirmation overlay shown immediately after a withdrawal is submitted. */
  const [withdrawConfirmation, setWithdrawConfirmation] = useState<null | {
    amount: string;
    payoutByLabel: string;
    payoutByISO: string;
    requestId: number | null;
  }>(null);
  const [withdrawNotifyArmed, setWithdrawNotifyArmed] = useState<boolean>(false);
  /** Bumps whenever withdrawal reminders in localStorage change so we re-arm `setTimeout` timers. */
  const [withdrawReminderEpoch, setWithdrawReminderEpoch] = useState(0);
  const withdrawalTimerIdsRef = useRef<number[]>([]);
  const REFERRALS_PAGE_SIZE = 5;
  const WITHDRAWAL_REMINDERS_KEY = "affiliate_withdrawal_reminders_v1";

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

  const conversionFormula = useMemo(() => {
    const clicks = overallStats?.click_count ?? 0;
    const leads = overallStats?.lead_count ?? 0;
    const sales = overallStats?.sale_count ?? 0;
    const hasClicks = clicks > 0;
    const raw = hasClicks ? ((leads / clicks + sales / clicks) / 2) * 100 : 0;
    return {
      summary: hasClicks
        ? "Average of lead rate and sale rate per click."
        : "No clicks yet — conversion stays at 0%.",
      formula: "( Leads ÷ Clicks + Sales ÷ Clicks ) ÷ 2 × 100",
      clicks,
      leads,
      sales,
      rawPercent: raw,
      finalPercent: conversionRate,
      hasClicks,
    };
  }, [overallStats, conversionRate]);

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
  const [conversionFormulaOpen, setConversionFormulaOpen] = useState(false);
  const [conversionPortalMounted, setConversionPortalMounted] = useState(false);
  const conversionCardRef = useRef<HTMLDivElement | null>(null);
  const conversionOverlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setConversionPortalMounted(true);
  }, []);

  const handleConversionCardLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && conversionOverlayRef.current?.contains(next)) return;
    setConversionFormulaOpen(false);
  }, []);

  const handleConversionOverlayLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && conversionCardRef.current?.contains(next)) return;
    setConversionFormulaOpen(false);
  }, []);

  useEffect(() => {
    if (!conversionFormulaOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setConversionFormulaOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [conversionFormulaOpen]);

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

  useEffect(() => {
    if (!payoutStatementOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPayoutStatementOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [payoutStatementOpen]);

  useEffect(() => {
    if (!withdrawConfirmation) return;
    const handleEscapeClose = (event: KeyboardEvent) => {
      if (event.key === "Escape") setWithdrawConfirmation(null);
    };
    window.addEventListener("keydown", handleEscapeClose);
    return () => window.removeEventListener("keydown", handleEscapeClose);
  }, [withdrawConfirmation]);

  /**
   * Pending payout notifications survive page reloads via `localStorage`.
   * The list contains future-dated entries; on every mount we re-arm `setTimeout` for
   * any reminder whose `notifyAt` is still in the future, and immediately fire any that
   * are already due (then drop them).
   */
  type WithdrawalReminder = {
    requestId: number | string;
    amount: string;
    affiliateId: string;
    notifyAt: number;
  };

  const loadWithdrawalReminders = useCallback((): WithdrawalReminder[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(WITHDRAWAL_REMINDERS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (entry): entry is WithdrawalReminder =>
          entry &&
          typeof entry === "object" &&
          (typeof entry.requestId === "number" || typeof entry.requestId === "string") &&
          typeof entry.amount === "string" &&
          typeof entry.affiliateId === "string" &&
          typeof entry.notifyAt === "number"
      );
    } catch {
      return [];
    }
  }, []);

  const persistWithdrawalReminders = useCallback((reminders: WithdrawalReminder[]) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(WITHDRAWAL_REMINDERS_KEY, JSON.stringify(reminders));
    } catch {
      // Storage quota / private mode: silently ignore.
    }
  }, []);

  const fireWithdrawalNotification = useCallback((reminder: WithdrawalReminder, options?: { immediate?: boolean }) => {
    if (typeof window === "undefined") return;
    const title = options?.immediate
      ? "Withdrawal request received"
      : "Your withdrawal payout window";
    const body = options?.immediate
      ? `We received your $${reminder.amount} request. Expect payout within 1-2 weeks.`
      : `Reminder: your $${reminder.amount} payout should land in your account around now.`;
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(title, { body, tag: `withdrawal-${reminder.requestId}` });
      }
    } catch {
      // Browser blocked / unsupported — non-fatal.
    }
  }, []);

  const scheduleWithdrawalReminder = useCallback(
    (input: {
      requestId: number | string;
      amount: string;
      affiliateId: string;
      notifyAtISO: string;
      immediate?: boolean;
    }) => {
      const notifyAt = new Date(input.notifyAtISO).getTime();
      const reminder: WithdrawalReminder = {
        requestId: input.requestId,
        amount: input.amount,
        affiliateId: input.affiliateId,
        notifyAt: Number.isFinite(notifyAt) ? notifyAt : Date.now() + 14 * 24 * 60 * 60 * 1000,
      };
      // Ask for permission once (no-op if previously decided).
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "default") {
          void Notification.requestPermission().then((perm) => {
            if (perm === "granted" && input.immediate) {
              fireWithdrawalNotification(reminder, { immediate: true });
            }
          });
        } else if (input.immediate) {
          fireWithdrawalNotification(reminder, { immediate: true });
        }
      } catch {
        // Notification API unavailable.
      }
      const existing = loadWithdrawalReminders();
      const next = [...existing.filter((r) => r.requestId !== reminder.requestId), reminder];
      persistWithdrawalReminders(next);
      setWithdrawNotifyArmed(true);
      // Re-run the timer effect so future-dated reminders get a `setTimeout` (not only on full page reload).
      setWithdrawReminderEpoch((e) => e + 1);
    },
    [fireWithdrawalNotification, loadWithdrawalReminders, persistWithdrawalReminders]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    withdrawalTimerIdsRef.current.forEach((id) => window.clearTimeout(id));
    withdrawalTimerIdsRef.current = [];

    const reminders = loadWithdrawalReminders();
    if (!reminders.length) {
      setWithdrawNotifyArmed(false);
      return;
    }

    const now = Date.now();
    const dueNow = reminders.filter((r) => r.notifyAt <= now);
    let future = reminders.filter((r) => r.notifyAt > now);
    dueNow.forEach((r) => fireWithdrawalNotification(r));
    if (dueNow.length) {
      persistWithdrawalReminders(future);
    }

    future = loadWithdrawalReminders().filter((r) => r.notifyAt > now);
    future.forEach((r) => {
      const delay = Math.max(0, r.notifyAt - Date.now());
      const id = window.setTimeout(() => {
        fireWithdrawalNotification(r);
        const remaining = loadWithdrawalReminders().filter((entry) => entry.requestId !== r.requestId);
        persistWithdrawalReminders(remaining);
        setWithdrawReminderEpoch((e) => e + 1);
      }, delay);
      withdrawalTimerIdsRef.current.push(id);
    });
    setWithdrawNotifyArmed(future.length > 0);

    return () => {
      withdrawalTimerIdsRef.current.forEach((tid) => window.clearTimeout(tid));
      withdrawalTimerIdsRef.current = [];
    };
  }, [withdrawReminderEpoch, fireWithdrawalNotification, loadWithdrawalReminders, persistWithdrawalReminders]);

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
        setWithdrawMessage({ text: "You are not eligible yet. Minimum earnings required: $50.000.", tone: "bad" });
      } else if (!withdrawFormValid) {
        setWithdrawMessage({ text: "Please fill all required fields before submitting.", tone: "bad" });
      } else if (!withdrawAmountValid) {
        setWithdrawMessage({ text: `Withdrawal amount must be greater than 0 and up to $${earningsDisplay}.`, tone: "bad" });
      }
      return;
    }
    setWithdrawSubmitting(true);
    try {
      const response = await requestAffiliateWithdrawal({
        affiliate_id: affiliateId.trim(),
        bank_name: withdrawForm.bankName.trim(),
        account_name: withdrawForm.accountName.trim(),
        account_number: withdrawForm.accountNumber.trim(),
        iban: withdrawForm.iban.trim(),
        phone_number: withdrawForm.phoneNumber.trim(),
        branch_name: withdrawForm.branchName.trim(),
        requested_amount: withdrawAmountValue.toFixed(2),
      });
      const submittedAmount = (response.requested_amount ?? withdrawAmountValue.toFixed(2)).toString();
      // Schedule the user-facing payout window: 14 days from now.
      const payoutByDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const payoutByLabel = payoutByDate.toLocaleDateString(undefined, {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      // Reset the form, close the bank-details modal, then open the confirmation overlay.
      setWithdrawMessage(null);
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
      setWithdrawConfirmation({
        amount: submittedAmount,
        payoutByLabel,
        payoutByISO: payoutByDate.toISOString(),
        requestId: typeof response.withdrawal_request_id === "number" ? response.withdrawal_request_id : null,
      });
      // Persist a reminder so we can re-fire a notification on the next page load if
      // the user closes this tab before the payout date.
      scheduleWithdrawalReminder({
        requestId: typeof response.withdrawal_request_id === "number" ? response.withdrawal_request_id : Date.now(),
        amount: submittedAmount,
        affiliateId: affiliateId.trim(),
        notifyAtISO: payoutByDate.toISOString(),
        // Fire the in-app confirmation notification right away too.
        immediate: true,
      });
      // Immediately refresh stats so the available earnings reflect the reservation.
      void refreshData(true);
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
      const [statsResult, funnelResult, recentResult, withdrawalResult] = await Promise.all([
        getAffiliateStats(affiliateId.trim()),
        getAffiliateFunnel(affiliateId.trim()),
        getRecentReferrals(affiliateId.trim(), 150),
        getWithdrawalStatement(affiliateId.trim(), 100).catch(() => ({
          affiliate_id: affiliateId.trim(),
          items: [] as WithdrawalStatementItem[],
        })),
      ]);
      setStats(statsResult);
      setFunnel(funnelResult.stages);
      setRecentReferrals(recentResult.items);
      setWithdrawalStatementItems(withdrawalResult.items);
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

  const referralsSorted = useMemo(() => {
    const arr = [...recentReferrals];
    const activityMs = (r: RecentReferralItem) => {
      const iso = r.purchased_at ?? r.at;
      if (!iso) return 0;
      const t = new Date(iso).getTime();
      return Number.isFinite(t) ? t : 0;
    };
    arr.sort((a, b) => {
      const ta = activityMs(a);
      const tb = activityMs(b);
      const timeCmp = referralsTimeSort === "desc" ? tb - ta : ta - tb;
      if (timeCmp !== 0) return timeCmp;
      const ea = Number(a.conversion_earning ?? 0) || 0;
      const eb = Number(b.conversion_earning ?? 0) || 0;
      return referralsPriceSort === "desc" ? eb - ea : ea - eb;
    });
    return arr;
  }, [recentReferrals, referralsTimeSort, referralsPriceSort]);

  const totalRecentPages = Math.max(1, Math.ceil(referralsSorted.length / REFERRALS_PAGE_SIZE));
  const safeRecentPage = Math.min(recentPage, totalRecentPages);

  const pagedRecentReferrals = useMemo(() => {
    const start = (safeRecentPage - 1) * REFERRALS_PAGE_SIZE;
    return referralsSorted.slice(start, start + REFERRALS_PAGE_SIZE);
  }, [referralsSorted, safeRecentPage]);

  useEffect(() => {
    if (recentPage !== safeRecentPage) setRecentPage(safeRecentPage);
  }, [recentPage, safeRecentPage]);

  useEffect(() => {
    setRecentPage(1);
  }, [referralsTimeSort, referralsPriceSort]);

  const pendingWithdrawalReminders = useMemo(
    () => loadWithdrawalReminders(),
    [loadWithdrawalReminders, withdrawReminderEpoch]
  );

  const syndicateStatementRows = useMemo(() => {
    return withdrawalStatementItems.map((w) => {
      const st = (w.status || "").toLowerCase();
      const link = (w.affiliate_link_id || "").trim();
      const linkDisp = link.length > 40 ? `${link.slice(0, 22)}…` : link;
      const product = linkDisp
        ? `Withdrawal · ${(w.status || "pending").toUpperCase()} — ${linkDisp}`
        : `Withdrawal · ${(w.status || "pending").toUpperCase()}`;
      return {
        key: String(w.id),
        email: (w.account_name && w.account_name.trim()) || "—",
        product,
        paid: `Balance @ request: $${formatEarnings(w.earnings_snapshot)}`,
        yourCut: `$${formatEarnings(w.requested_amount)}`,
        when: formatAgo(w.created_at),
        muted: WITHDRAWAL_REFUNDED_STATUSES.has(st),
      };
    });
  }, [withdrawalStatementItems]);

  const syndicateStatementTotal = useMemo(() => {
    let t = 0;
    for (const w of withdrawalStatementItems) {
      if (WITHDRAWAL_REFUNDED_STATUSES.has((w.status || "").toLowerCase())) continue;
      const n = Number(w.requested_amount);
      if (Number.isFinite(n)) t += n;
    }
    return t;
  }, [withdrawalStatementItems]);

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
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
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
                    <button
                      type="button"
                      aria-pressed={payoutStatementOpen}
                      aria-controls="affiliate-payout-statement-panel"
                      id="affiliate-syn-payout-statement-toggle"
                      onClick={() => setPayoutStatementOpen((o) => !o)}
                      className={`cut-frame-sm hud-hover-glow cursor-pointer border-2 px-3 py-2.5 text-[10px] font-black uppercase leading-tight tracking-[0.12em] shadow-[0_0_0_1px_rgba(34,211,238,0.45),0_0_14px_rgba(232,121,249,0.35),0_0_22px_rgba(250,204,21,0.22)] transition duration-300 sm:px-5 sm:py-3 sm:text-xs sm:tracking-[0.14em] ${
                        payoutStatementOpen
                          ? "border-fuchsia-300/90 bg-[linear-gradient(165deg,rgba(56,236,255,0.22),rgba(88,28,120,0.45),rgba(250,204,21,0.12))] ring-2 ring-cyan-300/50"
                          : "border-cyan-400/55 bg-[linear-gradient(165deg,rgba(56,236,255,0.14),rgba(24,8,40,0.5),rgba(250,204,21,0.08))]"
                      } hover:scale-[1.03] hover:border-fuchsia-200/80`}
                    >
                      <span className="text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.55)]">SYN</span>{" "}
                      <span className="text-fuchsia-200 drop-shadow-[0_0_8px_rgba(232,121,249,0.45)]">Payout</span>{" "}
                      <span className="text-amber-200 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]">Statement</span>
                    </button>
                  </div>
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
              ].map((item) => (
                <div
                  key={item.label}
                  className={`cut-frame-sm border px-3 py-2 ${item.tone ?? "border-[rgba(255,215,0,0.28)] bg-black/35"}`}
                >
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-white/68 drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]">{item.label}</div>
                  <div className="mt-1 text-2xl font-black text-[#f8d778] drop-shadow-[0_0_12px_rgba(248,215,120,0.5)]">{item.value}</div>
                </div>
              ))}
              <div
                ref={conversionCardRef}
                role="button"
                tabIndex={0}
                aria-expanded={conversionFormulaOpen}
                aria-haspopup="dialog"
                aria-controls="affiliate-conversion-formula"
                onMouseEnter={() => setConversionFormulaOpen(true)}
                onMouseLeave={handleConversionCardLeave}
                onFocus={() => setConversionFormulaOpen(true)}
                onBlur={(e) => {
                  const next = e.relatedTarget as Node | null;
                  if (next && conversionOverlayRef.current?.contains(next)) return;
                  setConversionFormulaOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setConversionFormulaOpen((o) => !o);
                  }
                  if (e.key === "Escape") setConversionFormulaOpen(false);
                }}
                className="cut-frame-sm cursor-help border border-yellow-300/80 bg-[linear-gradient(180deg,rgba(255,215,0,0.2),rgba(0,0,0,0.32))] px-3 py-2 shadow-[0_0_0_1px_rgba(254,240,138,0.92),0_0_24px_rgba(250,204,21,0.86),0_0_58px_rgba(250,204,21,0.66),0_0_108px_rgba(250,204,21,0.48),inset_0_0_20px_rgba(254,240,138,0.3)] outline-none focus-visible:ring-2 focus-visible:ring-yellow-200/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <div className="text-xs font-black uppercase tracking-[0.14em] text-white/68 drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]">Conversion</div>
                <div className="mt-1 text-2xl font-black text-[#f8d778] drop-shadow-[0_0_12px_rgba(248,215,120,0.5)]">{conversionRing}%</div>
              </div>
              <div
                className="cut-frame-sm border border-pink-300/80 bg-[linear-gradient(180deg,rgba(244,114,182,0.2),rgba(0,0,0,0.32))] px-3 py-2 shadow-[0_0_0_1px_rgba(249,168,212,0.92),0_0_24px_rgba(236,72,153,0.84),0_0_58px_rgba(236,72,153,0.64),0_0_108px_rgba(236,72,153,0.46),inset_0_0_20px_rgba(249,168,212,0.3)]"
              >
                <div className="text-xs font-black uppercase tracking-[0.14em] text-white/68 drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]">Earnings</div>
                <div className="mt-1 text-2xl font-black text-[#f8d778] drop-shadow-[0_0_12px_rgba(248,215,120,0.5)]">${earningsDisplay}</div>
              </div>
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

          {pendingWithdrawalReminders.length > 0 ? (
            <div className="mt-5 cut-frame-sm border-2 border-amber-400/90 bg-[linear-gradient(165deg,rgba(28,18,4,0.94),rgba(8,6,14,0.96))] p-4 shadow-[0_0_0_1px_rgba(251,191,36,0.85),0_0_28px_rgba(251,191,36,0.45),inset_0_0_24px_rgba(251,191,36,0.12)] sm:p-6">
              <div className="mb-3 flex flex-col gap-2 border-b border-amber-500/35 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-heading text-base font-black uppercase tracking-[0.18em] text-amber-100 drop-shadow-[0_0_10px_rgba(251,191,36,0.45)] sm:text-lg">
                  Applied for withdrawal
                </h3>
                <p className="max-w-xl font-mono text-[11px] font-bold uppercase leading-relaxed tracking-[0.1em] text-amber-200/85 sm:text-xs">
                  Payout window armed in this browser — enable notifications so we can ping you when the wire should hit.
                </p>
              </div>
              <ul className="space-y-3">
                {pendingWithdrawalReminders.map((row) => (
                  <li
                    key={`${row.requestId}-${row.notifyAt}`}
                    className="flex flex-col gap-3 rounded-lg border border-amber-300/50 bg-black/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/80">Reserved payout</div>
                      <div className="mt-1 text-lg font-black text-amber-50">${row.amount}</div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/60">
                        Target check-in: {new Date(row.notifyAt).toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        let perm: NotificationPermission =
                          typeof Notification !== "undefined" ? Notification.permission : "denied";
                        if (typeof Notification !== "undefined" && perm === "default") {
                          try {
                            perm = await Notification.requestPermission();
                          } catch {
                            perm = "denied";
                          }
                        }
                        scheduleWithdrawalReminder({
                          requestId: row.requestId,
                          amount: row.amount,
                          affiliateId: row.affiliateId,
                          notifyAtISO: new Date(row.notifyAt).toISOString(),
                          immediate: perm === "granted",
                        });
                      }}
                      className="cut-frame-sm shrink-0 cursor-pointer border border-violet-300/85 bg-[linear-gradient(180deg,rgba(193,120,255,0.22),rgba(20,6,38,0.65))] px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-violet-100 shadow-[0_0_0_1px_rgba(193,120,255,0.7),0_0_16px_rgba(193,120,255,0.35)] transition hover:scale-[1.02]"
                    >
                      Enable reminder
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {payoutStatementOpen ? (
          <div
            id="affiliate-payout-statement-panel"
            role="region"
            aria-labelledby="affiliate-syn-payout-statement-toggle"
            className="relative mt-5 motion-safe:animate-[affiliatePayoutPanelIn_0.38s_ease-out_both]"
          >
            <div
              className="relative overflow-hidden p-[2px] sm:p-[3px]"
              style={{
                background: "linear-gradient(125deg, #22d3ee, #c084fc, #f472b6, #facc15, #34d399, #22d3ee)",
                backgroundSize: "220% 220%",
                boxShadow:
                  "0 0 0 1px rgba(34,211,238,0.55), 0 0 18px rgba(232,121,249,0.42), 0 0 32px rgba(250,204,21,0.22), 0 0 48px rgba(52,211,153,0.18)",
                clipPath:
                  "polygon(14px 0,calc(100% - 14px) 0,100% 14px,100% calc(100% - 14px),calc(100% - 14px) 100%,14px 100%,0 calc(100% - 14px),0 14px)",
              }}
            >
              <div
                className="bg-[#020308] p-4 sm:p-6"
                style={{
                  clipPath:
                    "polygon(12px 0,calc(100% - 12px) 0,100% 12px,100% calc(100% - 12px),calc(100% - 12px) 100%,12px 100%,0 calc(100% - 12px),0 12px)",
                  boxShadow:
                    "inset 0 0 0 1px rgba(34,211,238,0.12), inset 0 0 0 1px rgba(232,121,249,0.08), inset 0 0 56px rgba(0,0,0,0.55)",
                }}
              >
                <div className="mb-3 flex flex-col gap-2 border-b border-cyan-500/35 pb-3 sm:flex-row sm:items-end sm:justify-between">
                  <h3 className="font-heading text-base font-black uppercase tracking-[0.14em] sm:text-lg sm:tracking-[0.18em]">
                    <span className="text-cyan-100 [text-shadow:0_0_12px_rgba(34,211,238,0.5)]">Syndicate</span>{" "}
                    <span className="text-fuchsia-200 [text-shadow:0_0_12px_rgba(232,121,249,0.45)]">payout</span>{" "}
                    <span className="text-amber-200 [text-shadow:0_0_12px_rgba(250,204,21,0.4)]">statement</span>
                    <span className="block pt-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/90 sm:inline sm:pt-0 sm:before:content-['·'] sm:before:px-2 sm:before:text-cyan-400/60">
                      withdrawals you applied for
                    </span>
                  </h3>
                  <div className="text-right font-mono text-[10px] font-black uppercase leading-snug tracking-[0.14em] text-cyan-200/90 sm:text-xs">
                    <span className="block sm:inline">Total requested (active withdrawals below): </span>
                    <span className="text-base text-yellow-200 [text-shadow:0_0_12px_rgba(250,250,100,0.55),0_0_28px_rgba(250,204,21,0.35)] sm:text-lg">
                      ${formatEarnings(syndicateStatementTotal)}
                    </span>
                  </div>
                </div>

                <div className="mb-4 overflow-hidden rounded-md border border-fuchsia-500/40 bg-[linear-gradient(105deg,rgba(6,40,42,0.92),rgba(40,8,48,0.88),rgba(60,20,8,0.88),rgba(8,36,24,0.9))] px-3 py-2.5 shadow-[inset_0_0_24px_rgba(0,0,0,0.45),0_0_18px_rgba(232,121,249,0.15)] sm:px-4">
                  <p className="text-center font-mono text-[10px] font-black uppercase leading-relaxed tracking-[0.1em] text-white/80 sm:text-[11px] sm:tracking-[0.12em]">
                    <span className="text-yellow-200 [text-shadow:0_0_8px_rgba(253,224,71,0.45)]">Payout</span>
                    <span className="text-fuchsia-200/90"> = </span>
                    <span className="text-cyan-200">min(requested $</span>
                    <span className="text-white/55">, </span>
                    <span className="text-emerald-200/95">balance @ submit</span>
                    <span className="text-cyan-200">)</span>
                    <span className="text-white/45"> · </span>
                    <span className="text-amber-200/95">Snapshot</span>
                    <span className="text-white/55"> freezes gross available the moment you hit send; </span>
                    <span className="text-violet-200/95">status</span>
                    <span className="text-white/55"> tracks ops → wire.</span>
                  </p>
                </div>

                {syndicateStatementRows.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-cyan-500/45 font-mono text-[10px] font-black uppercase tracking-[0.16em] [text-shadow:0_0_8px_rgba(34,211,238,0.35)]">
                          <th className="py-2 pr-3 text-cyan-200/95">User</th>
                          <th className="py-2 pr-3 text-fuchsia-200/90">Request</th>
                          <th className="py-2 pr-3 text-emerald-200/90">Balance snapshot</th>
                          <th className="py-2 pr-3 text-yellow-200/95">Your payout</th>
                          <th className="py-2 text-violet-200/90">Recorded</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syndicateStatementRows.map((row) => (
                          <tr
                            key={row.key}
                            className={`border-b border-white/10 font-mono text-xs uppercase tracking-[0.08em] text-white/88 sm:text-sm ${row.muted ? "opacity-45" : ""}`}
                          >
                            <td className="max-w-[180px] truncate py-2 pr-3 text-cyan-100/95 [text-shadow:0_0_6px_rgba(34,211,238,0.25)]">
                              {row.email}
                            </td>
                            <td className="max-w-[240px] truncate py-2 pr-3 text-fuchsia-100/90 [text-shadow:0_0_6px_rgba(232,121,249,0.22)]">
                              {row.product}
                            </td>
                            <td className="py-2 pr-3 text-emerald-100/90 [text-shadow:0_0_6px_rgba(52,211,153,0.2)]">{row.paid}</td>
                            <td className="py-2 pr-3 font-black text-yellow-200 [text-shadow:0_0_10px_rgba(250,204,21,0.65),0_0_22px_rgba(253,224,71,0.28)]">
                              {row.yourCut}
                            </td>
                            <td className="py-2 text-violet-200/80 [text-shadow:0_0_6px_rgba(167,139,250,0.2)]">{row.when}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="font-mono text-sm font-semibold uppercase tracking-[0.1em] text-cyan-200/55">
                    No withdrawal applications yet — when you submit a payout request, each line appears here with your reserved amount and the balance snapshot from that moment.
                  </p>
                )}
              </div>
            </div>
          </div>
          ) : null}

          <div className="mt-5 cut-frame-sm border-2 border-fuchsia-400/90 bg-[radial-gradient(900px_280px_at_10%_0%,rgba(232,121,249,0.22),transparent_55%),radial-gradient(800px_260px_at_90%_100%,rgba(56,236,255,0.14),transparent_50%),linear-gradient(180deg,rgba(8,4,14,0.92),rgba(0,0,0,0.88))] p-4 shadow-[0_0_0_1px_rgba(232,121,249,0.95),0_0_28px_rgba(232,121,249,0.65),0_0_64px_rgba(193,120,255,0.45),0_0_120px_rgba(56,236,255,0.22),inset_0_0_32px_rgba(232,121,249,0.12)] sm:p-6">
            <div className="mb-4 flex flex-col gap-3 border-b border-fuchsia-500/35 pb-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="font-heading text-base font-black uppercase tracking-[0.2em] text-fuchsia-100 drop-shadow-[0_0_12px_rgba(232,121,249,0.55)] sm:text-lg">Referrals</div>
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <label className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-violet-200/90 sm:text-sm">Time</span>
                  <select
                    value={referralsTimeSort}
                    onChange={(e) => setReferralsTimeSort(e.target.value as "asc" | "desc")}
                    className="cut-frame-sm min-h-[40px] cursor-pointer border border-violet-300/80 bg-[linear-gradient(180deg,rgba(193,120,255,0.2),rgba(20,6,38,0.72))] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-violet-100 shadow-[0_0_0_1px_rgba(193,120,255,0.65),0_0_14px_rgba(193,120,255,0.25)] sm:min-w-[220px] sm:text-sm [&>option]:bg-[#0a0a12] [&>option]:text-violet-100"
                    aria-label="Sort referrals by activity time"
                  >
                    <option value="asc">Ascending (oldest first)</option>
                    <option value="desc">Descending (newest first)</option>
                  </select>
                </label>
                <label className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-amber-200/90 sm:text-sm">Price</span>
                  <select
                    value={referralsPriceSort}
                    onChange={(e) => setReferralsPriceSort(e.target.value as "asc" | "desc")}
                    className="cut-frame-sm min-h-[40px] cursor-pointer border border-amber-300/80 bg-[linear-gradient(180deg,rgba(252,211,77,0.18),rgba(28,18,4,0.72))] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.65),0_0_14px_rgba(252,211,77,0.25)] sm:min-w-[220px] sm:text-sm [&>option]:bg-[#0a0a12] [&>option]:text-amber-100"
                    aria-label="Sort referrals by commission when activity time matches"
                  >
                    <option value="asc">Ascending (low → high)</option>
                    <option value="desc">Descending (high → low)</option>
                  </select>
                </label>
              </div>
              </div>
            </div>
            <div className="space-y-4 min-h-[400px]">
              {referralsSorted.length ? (
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
                  const purchaseCurrency = r.purchase_currency || (r as RecentReferralItem & { currency?: string | null }).currency || "usd";
                  const paidLine = formatPaidDisplay(purchaseCurrency, purchaseAmountRaw);
                  const subscriptionLabel =
                    (r.subscription_name && r.subscription_name.trim()) ||
                    purchaseProgram ||
                    purchaseTier ||
                    null;
                  const earningStr = r.conversion_earning != null && String(r.conversion_earning).trim() !== "" ? String(r.conversion_earning).trim() : null;
                  const diagnosisEv = r.lead_events?.find((e) => e.kind === "diagnosis");
                  const authEv = r.lead_events?.find((e) => e.kind === "auth");
                  let activeLeadTab: ReferralLeadTab = referralLeadTabByVisitor[r.visitor_id] ?? defaultReferralLeadTab(r);
                  if (activeLeadTab === "diagnosis" && !diagnosisEv) activeLeadTab = authEv ? "auth" : "diagnosis";
                  if (activeLeadTab === "auth" && !authEv) activeLeadTab = diagnosisEv ? "diagnosis" : "auth";
                  const hasLeadTabs = Boolean(r.lead_events && r.lead_events.length > 0);
                  const updatedAtForTab =
                    hasLeadTabs && activeLeadTab === "diagnosis" && diagnosisEv?.at
                      ? diagnosisEv.at
                      : hasLeadTabs && activeLeadTab === "auth" && authEv?.at
                        ? authEv.at
                        : r.at;
                  // Show the per-kind email that matches the active chip so the quiz
                  // email and signup email never overwrite each other in the header.
                  const headerEmail =
                    hasLeadTabs && activeLeadTab === "diagnosis" && diagnosisEv?.email
                      ? diagnosisEv.email
                      : hasLeadTabs && activeLeadTab === "auth" && authEv?.email
                        ? authEv.email
                        : r.email || diagnosisEv?.email || authEv?.email || null;
                  const headerEmailKindLabel =
                    hasLeadTabs && activeLeadTab === "diagnosis" && diagnosisEv?.email
                      ? "Quiz email"
                      : hasLeadTabs && activeLeadTab === "auth" && authEv?.email
                        ? "Signup email"
                        : null;
                  const otherTabEmail =
                    hasLeadTabs && activeLeadTab === "diagnosis"
                      ? authEv?.email ?? null
                      : hasLeadTabs && activeLeadTab === "auth"
                        ? diagnosisEv?.email ?? null
                        : null;
                  const showOtherTabHint = Boolean(otherTabEmail && otherTabEmail !== headerEmail);
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
                        {(safeRecentPage - 1) * REFERRALS_PAGE_SIZE + idx + 1}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="truncate text-lg font-semibold text-white">
                            {headerEmail || "No email captured yet"}
                          </span>
                          {headerEmailKindLabel ? (
                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                              · {headerEmailKindLabel}
                            </span>
                          ) : null}
                        </div>
                        {showOtherTabHint && otherTabEmail ? (
                          <div className="truncate text-xs font-semibold text-white/55">
                            {activeLeadTab === "diagnosis" ? "Signup email" : "Quiz email"}:{" "}
                            <span className="text-white/75">{otherTabEmail}</span>
                          </div>
                        ) : null}
                        <div className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-black uppercase tracking-[0.16em] ${
                          r.status === "purchased"
                            ? "border-emerald-300/75 bg-emerald-500/20 text-emerald-200 shadow-[0_0_14px_rgba(52,211,153,0.35)]"
                            : "border-sky-300/75 bg-sky-500/15 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.28)]"
                        }`}>
                          {r.status}
                        </div>
                        {r.lead_events && r.lead_events.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Lead milestones for this visitor">
                            {r.lead_events.map((evt, evtIdx) => {
                              const isDiagnosis = evt.kind === "diagnosis";
                              const isLogin = !isDiagnosis && /login/i.test(evt.label);
                              const chipTone = isDiagnosis
                                ? "border-fuchsia-300/80 bg-fuchsia-500/15 text-fuchsia-100 shadow-[0_0_12px_rgba(232,121,249,0.35)]"
                                : isLogin
                                  ? "border-cyan-300/80 bg-cyan-500/15 text-cyan-100 shadow-[0_0_12px_rgba(56,236,255,0.35)]"
                                  : "border-emerald-300/80 bg-emerald-500/15 text-emerald-100 shadow-[0_0_12px_rgba(52,211,153,0.35)]";
                              const dotTone = isDiagnosis
                                ? "bg-fuchsia-300 shadow-[0_0_8px_rgba(232,121,249,0.85)]"
                                : isLogin
                                  ? "bg-cyan-300 shadow-[0_0_8px_rgba(56,236,255,0.85)]"
                                  : "bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.85)]";
                              const tabForEvt = leadTabForEvent(evt);
                              const isActive = tabForEvt === activeLeadTab;
                              return (
                                <button
                                  key={`${evt.kind}-${evtIdx}`}
                                  type="button"
                                  role="tab"
                                  aria-selected={isActive}
                                  onClick={() =>
                                    setReferralLeadTabByVisitor((prev) => ({
                                      ...prev,
                                      [r.visitor_id]: tabForEvt,
                                    }))
                                  }
                                  className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-left text-[10px] font-black uppercase tracking-[0.14em] outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-white/50 sm:text-xs ${chipTone} ${
                                    isActive ? "ring-2 ring-white/55 ring-offset-2 ring-offset-black/50" : ""
                                  }`}
                                  title={evt.at ? `Show this lead · recorded ${formatAgo(evt.at)}` : `Show ${evt.label}`}
                                >
                                  <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dotTone}`} />
                                  {evt.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="rounded-md border border-violet-400/50 bg-violet-950/40 px-3 py-2 shadow-[0_0_16px_rgba(167,139,250,0.25)]">
                            {!hasLeadTabs ? (
                              <>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200/90">Subscription</div>
                                <div className="mt-1 text-sm font-semibold leading-snug text-violet-50">{subscriptionLabel ?? "—"}</div>
                              </>
                            ) : activeLeadTab === "diagnosis" && diagnosisEv ? (
                              <>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200/90">Syn Diagnosis</div>
                                <div className="mt-1 text-sm font-semibold leading-snug text-violet-50">Quiz email capture</div>
                                <div className="mt-1 text-xs font-semibold text-violet-200/90">Recorded {formatAgo(diagnosisEv.at)}</div>
                                {r.status === "purchased" && subscriptionLabel ? (
                                  <div className="mt-2 border-t border-violet-400/35 pt-2 text-xs font-semibold leading-snug text-violet-100/95">
                                    Checkout · {subscriptionLabel}
                                  </div>
                                ) : null}
                              </>
                            ) : activeLeadTab === "auth" && authEv ? (
                              <>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200/90">
                                  {r.status === "purchased" ? "Subscription" : "Sign up"}
                                </div>
                                <div className="mt-1 text-sm font-semibold leading-snug text-violet-50">
                                  {r.status === "purchased" ? subscriptionLabel ?? "—" : authEv.label}
                                </div>
                                <div className="mt-1 text-xs font-semibold text-violet-200/90">
                                  {formatAgo(authEv.at)}
                                  {r.status === "purchased" ? <span className="text-violet-300/85"> · {authEv.label}</span> : null}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200/90">Subscription</div>
                                <div className="mt-1 text-sm font-semibold leading-snug text-violet-50">{subscriptionLabel ?? "—"}</div>
                              </>
                            )}
                          </div>
                          <div className="rounded-md border border-amber-400/55 bg-amber-950/35 px-3 py-2 shadow-[0_0_16px_rgba(251,191,36,0.28)]">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/90">Your earning</div>
                            <div className="mt-1 text-base font-black text-amber-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.45)]">
                              {earningStr != null ? `$${formatEarnings(earningStr)}` : "—"}
                            </div>
                            {typeof r.sale_count === "number" && r.sale_count > 1 ? (
                              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/80">
                                Total from {r.sale_count} purchases
                              </div>
                            ) : null}
                          </div>
                        </div>
                        {r.status === "purchased" ? (
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold sm:text-sm">
                            {purchaseTier ? (
                              <span className="rounded border border-fuchsia-300/70 bg-fuchsia-500/15 px-2 py-0.5 text-fuchsia-200">Tier: {purchaseTier}</span>
                            ) : null}
                            {paidLine ? (
                              <span className="rounded border border-yellow-300/70 bg-yellow-500/15 px-2 py-0.5 text-yellow-200">{paidLine}</span>
                            ) : null}
                            {typeof r.sale_count === "number" && r.sale_count > 1 ? (
                              <span className="rounded border border-emerald-300/70 bg-emerald-500/15 px-2 py-0.5 text-emerald-200 shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                                × {r.sale_count} purchases
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
                      <div className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-100/90">{formatAgo(updatedAtForTab)}</div>
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="text-lg text-white/65">No leads or sales yet. New visitors still add to Clicks until they sign up or purchase.</div>
              )}
            </div>
            {referralsSorted.length > REFERRALS_PAGE_SIZE ? (
              <div className="mt-5 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setRecentPage((p) => Math.max(1, Math.min(p, totalRecentPages) - 1))}
                  disabled={safeRecentPage <= 1}
                  className="cut-frame-sm min-h-[48px] min-w-[128px] border border-fuchsia-300/90 bg-[linear-gradient(180deg,rgba(232,121,249,0.28),rgba(28,6,42,0.62))] px-6 py-2 text-base font-black uppercase tracking-[0.16em] text-fuchsia-100 shadow-[0_0_0_1px_rgba(232,121,249,0.9),0_0_24px_rgba(232,121,249,0.44),0_0_52px_rgba(232,121,249,0.24)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                <div className="min-w-[144px] text-center text-base font-black uppercase tracking-[0.16em] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]">
                  Page {safeRecentPage} / {totalRecentPages}
                </div>
                <button
                  type="button"
                  onClick={() => setRecentPage((p) => Math.min(totalRecentPages, Math.min(p, totalRecentPages) + 1))}
                  disabled={safeRecentPage >= totalRecentPages}
                  className="cut-frame-sm min-h-[48px] min-w-[128px] border border-cyan-300/90 bg-[linear-gradient(180deg,rgba(56,236,255,0.28),rgba(4,24,32,0.62))] px-6 py-2 text-base font-black uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_0_1px_rgba(56,236,255,0.9),0_0_24px_rgba(56,236,255,0.44),0_0_52px_rgba(56,236,255,0.24)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
            <p className="mt-5 border-t border-fuchsia-500/30 pt-4 text-center text-xs font-semibold leading-relaxed text-fuchsia-200/85 sm:text-sm">
              Referred purchase commission: <span className="text-amber-300">15%</span> when their spend is under{" "}
              <span className="font-black text-amber-200">$333</span>; <span className="text-green-300">30%</span> when spend is{" "}
              <span className="font-black text-green-200">$333 or more</span>
            </p>
          </div>
        </div>
      </main>
      {conversionPortalMounted && conversionFormulaOpen
        ? createPortal(
            <div
              ref={conversionOverlayRef}
              id="affiliate-conversion-formula"
              role="dialog"
              aria-modal="false"
              aria-labelledby="affiliate-conversion-formula-title"
              className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[3px]"
              onMouseEnter={() => setConversionFormulaOpen(true)}
              onMouseLeave={handleConversionOverlayLeave}
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setConversionFormulaOpen(false);
                }
              }}
            >
              <div className="relative w-full max-w-4xl drop-shadow-[0_0_28px_rgba(250,204,21,0.55)] [filter:drop-shadow(0_0_18px_rgba(232,121,249,0.45))_drop-shadow(0_0_28px_rgba(56,236,255,0.35))]">
                <div
                  className="relative max-h-[min(92dvh,820px)] overflow-y-auto overscroll-contain bg-[linear-gradient(160deg,rgba(20,14,2,0.98)_0%,rgba(8,6,18,0.98)_55%,rgba(2,8,18,0.98)_100%)] px-10 pt-16 pb-8 shadow-[inset_0_0_0_2px_rgba(254,240,138,0.95),inset_0_0_0_4px_rgba(0,0,0,0.85),inset_0_0_42px_rgba(252,211,77,0.18)] sm:px-14 sm:pt-20 sm:pb-10 [clip-path:polygon(0%_50%,28px_0%,calc(100%-28px)_0%,100%_50%,calc(100%-28px)_100%,28px_100%)]"
                >
                  <button
                    type="button"
                    onClick={() => setConversionFormulaOpen(false)}
                    aria-label="Close conversion formula"
                    className="absolute right-8 top-5 z-10 grid h-10 w-10 cursor-pointer place-items-center border-2 border-fuchsia-300/90 bg-[linear-gradient(180deg,rgba(232,121,249,0.32),rgba(28,6,42,0.85))] text-fuchsia-50 shadow-[0_0_0_1px_rgba(232,121,249,0.9),0_0_18px_rgba(232,121,249,0.55),inset_0_0_14px_rgba(232,121,249,0.25)] transition duration-200 hover:scale-110 hover:border-fuchsia-200 hover:text-white hover:shadow-[0_0_0_1px_rgba(249,168,212,0.95),0_0_24px_rgba(232,121,249,0.75)] active:scale-95 sm:right-10 sm:top-6 [clip-path:polygon(20%_0,80%_0,100%_50%,80%_100%,20%_100%,0_50%)]"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="6" y1="6" x2="18" y2="18" />
                      <line x1="18" y1="6" x2="6" y2="18" />
                    </svg>
                  </button>

                  <h3
                    id="affiliate-conversion-formula-title"
                    className="pr-12 text-2xl font-black uppercase tracking-[0.16em] text-yellow-100 drop-shadow-[0_0_14px_rgba(252,211,77,0.55)] sm:text-3xl"
                  >
                    Conversion Formula
                  </h3>

                  <p className="mt-3 text-base font-semibold leading-relaxed text-cyan-100/95 sm:text-lg">
                    {conversionFormula.summary}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="border-2 border-cyan-300/85 bg-[linear-gradient(180deg,rgba(34,211,238,0.18),rgba(0,12,20,0.88))] px-3 py-2.5 text-center shadow-[0_0_0_1px_rgba(103,232,249,0.85),0_0_18px_rgba(56,236,255,0.45),inset_0_0_16px_rgba(56,236,255,0.18)] [clip-path:polygon(0%_50%,12px_0,calc(100%-12px)_0,100%_50%,calc(100%-12px)_100%,12px_100%)]">
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200/95 sm:text-xs">Clicks</div>
                      <div className="mt-1 text-2xl font-black text-cyan-100 drop-shadow-[0_0_10px_rgba(56,236,255,0.55)] sm:text-3xl">{conversionFormula.clicks}</div>
                    </div>
                    <div className="border-2 border-emerald-300/85 bg-[linear-gradient(180deg,rgba(16,185,129,0.18),rgba(0,18,12,0.88))] px-3 py-2.5 text-center shadow-[0_0_0_1px_rgba(110,231,183,0.85),0_0_18px_rgba(16,185,129,0.45),inset_0_0_16px_rgba(16,185,129,0.18)] [clip-path:polygon(0%_50%,12px_0,calc(100%-12px)_0,100%_50%,calc(100%-12px)_100%,12px_100%)]">
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200/95 sm:text-xs">Leads</div>
                      <div className="mt-1 text-2xl font-black text-emerald-100 drop-shadow-[0_0_10px_rgba(52,211,153,0.55)] sm:text-3xl">{conversionFormula.leads}</div>
                    </div>
                    <div className="border-2 border-fuchsia-300/85 bg-[linear-gradient(180deg,rgba(232,121,249,0.2),rgba(20,6,28,0.88))] px-3 py-2.5 text-center shadow-[0_0_0_1px_rgba(249,168,212,0.85),0_0_18px_rgba(232,121,249,0.45),inset_0_0_16px_rgba(232,121,249,0.18)] [clip-path:polygon(0%_50%,12px_0,calc(100%-12px)_0,100%_50%,calc(100%-12px)_100%,12px_100%)]">
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-200/95 sm:text-xs">Sales</div>
                      <div className="mt-1 text-2xl font-black text-fuchsia-100 drop-shadow-[0_0_10px_rgba(232,121,249,0.55)] sm:text-3xl">{conversionFormula.sales}</div>
                    </div>
                  </div>

                  <div className="mt-5 border-2 border-amber-300/85 bg-[linear-gradient(180deg,rgba(252,211,77,0.14),rgba(8,6,2,0.94))] px-4 py-4 shadow-[0_0_0_1px_rgba(254,240,138,0.85),0_0_22px_rgba(252,211,77,0.4),inset_0_0_18px_rgba(252,211,77,0.16)] [clip-path:polygon(0%_50%,16px_0,calc(100%-16px)_0,100%_50%,calc(100%-16px)_100%,16px_100%)]">
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-200/95 sm:text-sm">Formula</div>
                    <pre className="mt-2 whitespace-pre-wrap break-words text-center font-mono text-base font-black leading-relaxed text-amber-100 drop-shadow-[0_0_10px_rgba(252,211,77,0.5)] sm:text-lg">
{conversionFormula.formula}
                    </pre>
                  </div>

                  {conversionFormula.hasClicks ? (
                    <div className="mt-5 flex flex-col items-center gap-2 border-2 border-violet-300/80 bg-[linear-gradient(180deg,rgba(193,120,255,0.18),rgba(10,4,20,0.92))] px-4 py-4 text-center shadow-[0_0_0_1px_rgba(216,180,254,0.85),0_0_20px_rgba(193,120,255,0.4),inset_0_0_18px_rgba(193,120,255,0.18)] [clip-path:polygon(0%_50%,16px_0,calc(100%-16px)_0,100%_50%,calc(100%-16px)_100%,16px_100%)]">
                      <div className="text-xs font-black uppercase tracking-[0.22em] text-violet-200/95 sm:text-sm">Your Result</div>
                      <div className="text-sm font-bold text-violet-100 sm:text-base">
                        ({conversionFormula.leads} ÷ {conversionFormula.clicks}) + ({conversionFormula.sales} ÷ {conversionFormula.clicks}) ÷ 2 × 100 ≈ {conversionFormula.rawPercent.toFixed(1)}%
                      </div>
                      <div className="text-4xl font-black text-amber-100 drop-shadow-[0_0_14px_rgba(252,211,77,0.6)] sm:text-5xl">
                        {conversionFormula.finalPercent}%
                      </div>
                    </div>
                  ) : null}

                  <p className="mt-5 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/45 sm:text-[11px]">
                    Press Esc · Tap outside · or the cross to close
                  </p>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
      {withdrawConfirmation ? (
        <div
          className="fixed inset-0 z-[600] flex items-center justify-center overflow-y-auto overscroll-contain bg-[rgba(2,4,10,0.86)] p-3 backdrop-blur-[4px] sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setWithdrawConfirmation(null);
          }}
        >
          <div
            className="relative w-full max-w-[640px] drop-shadow-[0_0_28px_rgba(252,211,77,0.55)] [filter:drop-shadow(0_0_18px_rgba(56,236,255,0.4))_drop-shadow(0_0_22px_rgba(232,121,249,0.32))]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative overflow-hidden bg-[linear-gradient(160deg,rgba(20,14,2,0.98)_0%,rgba(6,8,18,0.98)_55%,rgba(2,12,18,0.98)_100%)] px-8 py-7 shadow-[inset_0_0_0_2px_rgba(254,240,138,0.95),inset_0_0_0_4px_rgba(0,0,0,0.85),inset_0_0_44px_rgba(252,211,77,0.18)] sm:px-10 sm:py-8 [clip-path:polygon(0%_50%,28px_0%,calc(100%-28px)_0%,100%_50%,calc(100%-28px)_100%,28px_100%)]">
              <button
                type="button"
                onClick={() => setWithdrawConfirmation(null)}
                aria-label="Close confirmation"
                className="absolute right-8 top-2 z-10 grid h-10 w-10 cursor-pointer place-items-center border-2 border-fuchsia-300/90 bg-[linear-gradient(180deg,rgba(232,121,249,0.32),rgba(28,6,42,0.85))] text-fuchsia-50 shadow-[0_0_0_1px_rgba(232,121,249,0.9),0_0_18px_rgba(232,121,249,0.55),inset_0_0_14px_rgba(232,121,249,0.25)] transition duration-200 hover:scale-110 hover:border-fuchsia-200 hover:text-white active:scale-95 sm:right-10 [clip-path:polygon(20%_0,80%_0,100%_50%,80%_100%,20%_100%,0_50%)]"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>

              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center border-2 border-emerald-300/90 bg-[linear-gradient(180deg,rgba(52,211,153,0.28),rgba(4,18,12,0.85))] text-emerald-50 shadow-[0_0_0_1px_rgba(110,231,183,0.9),0_0_22px_rgba(52,211,153,0.55),inset_0_0_18px_rgba(52,211,153,0.25)] [clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h3 className="pr-12 text-center text-2xl font-black uppercase tracking-[0.16em] text-amber-100 drop-shadow-[0_0_14px_rgba(252,211,77,0.55)] sm:pr-14 sm:text-3xl">
                Applied for Withdrawal
              </h3>
              <p className="mt-3 text-center text-base font-semibold leading-relaxed text-cyan-100/95 sm:text-lg">
                You will get paid within{" "}
                <span className="font-black text-amber-200">1-2 weeks</span>.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="border-2 border-amber-300/85 bg-[linear-gradient(180deg,rgba(252,211,77,0.14),rgba(8,6,2,0.94))] px-4 py-3 text-center shadow-[0_0_0_1px_rgba(254,240,138,0.85),0_0_18px_rgba(252,211,77,0.32),inset_0_0_14px_rgba(252,211,77,0.16)] [clip-path:polygon(0%_50%,14px_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,14px_100%)]">
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200/90 sm:text-xs">Amount Requested</div>
                  <div className="mt-1 text-2xl font-black text-amber-100 drop-shadow-[0_0_10px_rgba(252,211,77,0.5)] sm:text-3xl">${withdrawConfirmation.amount}</div>
                </div>
                <div className="border-2 border-cyan-300/85 bg-[linear-gradient(180deg,rgba(56,236,255,0.16),rgba(0,12,20,0.92))] px-4 py-3 text-center shadow-[0_0_0_1px_rgba(103,232,249,0.85),0_0_18px_rgba(56,236,255,0.4),inset_0_0_14px_rgba(56,236,255,0.18)] [clip-path:polygon(0%_50%,14px_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,14px_100%)]">
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200/95 sm:text-xs">Expected By</div>
                  <div className="mt-1 text-lg font-black text-cyan-100 drop-shadow-[0_0_10px_rgba(56,236,255,0.5)] sm:text-xl">{withdrawConfirmation.payoutByLabel}</div>
                </div>
              </div>

              <div className="mt-4 border-2 border-violet-300/80 bg-[linear-gradient(180deg,rgba(193,120,255,0.16),rgba(10,4,20,0.92))] px-4 py-3 text-center shadow-[0_0_0_1px_rgba(216,180,254,0.85),0_0_18px_rgba(193,120,255,0.35),inset_0_0_14px_rgba(193,120,255,0.16)] [clip-path:polygon(0%_50%,14px_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,14px_100%)]">
                <p className="text-xs font-semibold leading-relaxed text-violet-100/95 sm:text-sm">
                  We&apos;ve reserved this amount from your available earnings.{" "}
                  {typeof Notification !== "undefined" && Notification.permission === "granted" && withdrawNotifyArmed
                    ? "We&apos;ll send a browser notification around the payout date."
                    : withdrawNotifyArmed
                      ? "A payout reminder is saved in this browser for the expected window."
                      : "Tap below to save a reminder or allow browser notifications."}
                </p>
              </div>

              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                {withdrawConfirmation &&
                typeof Notification !== "undefined" &&
                Notification.permission !== "granted" ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!withdrawConfirmation) return;
                      let perm: NotificationPermission = typeof Notification !== "undefined" ? Notification.permission : "denied";
                      if (typeof Notification !== "undefined" && perm === "default") {
                        try {
                          perm = await Notification.requestPermission();
                        } catch {
                          perm = "denied";
                        }
                      }
                      if (perm === "granted") {
                        setWithdrawNotifyArmed(true);
                      }
                      scheduleWithdrawalReminder({
                        requestId:
                          withdrawConfirmation.requestId ??
                          `wr-${affiliateId.trim()}-${withdrawConfirmation.payoutByISO}`,
                        amount: withdrawConfirmation.amount,
                        affiliateId: affiliateId.trim(),
                        notifyAtISO: withdrawConfirmation.payoutByISO,
                        immediate: perm === "granted",
                      });
                    }}
                    className="cut-frame-sm cursor-pointer border-2 border-violet-300/90 bg-[linear-gradient(180deg,rgba(193,120,255,0.28),rgba(20,6,38,0.6))] px-5 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-violet-100 shadow-[0_0_0_1px_rgba(193,120,255,0.85),0_0_18px_rgba(193,120,255,0.42),0_0_44px_rgba(193,120,255,0.22)] transition-transform hover:scale-[1.03] hover:border-violet-200 sm:text-sm"
                  >
                    {typeof Notification !== "undefined" && Notification.permission === "denied"
                      ? "Save payout reminder"
                      : "Enable Reminder"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setWithdrawConfirmation(null)}
                  className="cut-frame-sm cursor-pointer border-2 border-amber-300/90 bg-[linear-gradient(180deg,rgba(252,211,77,0.3),rgba(24,16,2,0.78))] px-7 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.9),0_0_20px_rgba(252,211,77,0.45),0_0_48px_rgba(252,211,77,0.24)] transition-transform hover:scale-[1.03] hover:border-amber-200 sm:text-sm"
                >
                  Got it
                </button>
              </div>
              <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/45 sm:text-[11px]">
                Press Esc · Tap outside · or the close icon to dismiss
              </p>
            </div>
          </div>
        </div>
      ) : null}
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
              Enter Account Details To Withdraw
            </h3>
            <p className="mt-2 text-sm sm:text-base font-bold text-cyan-100">
              Minimum earnings required for withdrawal: <span className="text-amber-200">$50.000</span>
            </p>
            <p className={`mt-1 text-sm font-black uppercase tracking-[0.12em] ${canRequestWithdraw ? "text-emerald-300" : "text-rose-300"}`}>
              Current earnings: ${earningsDisplay} {canRequestWithdraw ? "Eligible" : "Not eligible yet"}
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
                  placeholder={`Max $${earningsDisplay}`}
                  className={`cut-frame-sm border-[3px] px-4 py-3 text-base font-bold tracking-[0.03em] outline-none placeholder:text-lime-100/30 ${
                    missingAmount || invalidAmount
                      ? "border-rose-400/95 bg-[linear-gradient(180deg,rgba(52,8,8,0.92),rgba(0,0,0,0.94))] text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.9),0_0_20px_rgba(251,113,133,0.32)] focus:border-rose-300"
                      : "border-lime-300/90 bg-[linear-gradient(180deg,rgba(7,18,4,0.94),rgba(0,0,0,0.92))] text-lime-100 shadow-[0_0_0_1px_rgba(190,242,100,0.9),0_0_20px_rgba(132,204,22,0.3)] focus:border-lime-200"
                  }`}
                />
                <span className={`text-xs font-bold normal-case tracking-normal ${withdrawAmountValid || !withdrawForm.amount ? "text-lime-200/90" : "text-rose-300"}`}>
                  Enter up to your balance (max ${earningsDisplay}).
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


