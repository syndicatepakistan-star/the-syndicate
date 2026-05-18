"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ChevronLeft, Clock, MessageCircle, Send, ShieldAlert } from "lucide-react";
import {
  createSupportThread,
  fetchSupportThread,
  fetchSupportThreads,
  replySupportThread,
  type SupportPriority,
  type SupportThread
} from "@/lib/supportApi";
import { cn } from "@/components/dashboard/dashboardPrimitives";

const MIN_LEN = 12;

type PriorityTheme = {
  label: string;
  badge: string;
  accentBar: string;
  historyBorder: string;
  ticketGlow: string;
};

const PRIORITY_THEME: Record<SupportPriority, PriorityTheme> = {
  normal: {
    label: "Standard",
    badge:
      "border-sky-400/80 bg-gradient-to-r from-sky-500/25 to-cyan-600/15 text-sky-100 shadow-[0_0_14px_rgba(56,189,248,0.35)]",
    accentBar: "from-sky-400 via-cyan-400 to-sky-500",
    historyBorder: "group-hover:border-sky-400/50 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.15)]",
    ticketGlow: "shadow-[inset_0_0_60px_rgba(56,189,248,0.06)]"
  },
  elevated: {
    label: "High",
    badge:
      "border-amber-400/85 bg-gradient-to-r from-amber-500/28 to-orange-600/18 text-amber-50 shadow-[0_0_16px_rgba(251,191,36,0.4)]",
    accentBar: "from-amber-400 via-yellow-300 to-orange-400",
    historyBorder: "group-hover:border-amber-400/55 group-hover:shadow-[0_0_22px_rgba(251,191,36,0.2)]",
    ticketGlow: "shadow-[inset_0_0_60px_rgba(251,191,36,0.08)]"
  },
  critical: {
    label: "Urgent",
    badge:
      "border-rose-400/90 bg-gradient-to-r from-rose-500/30 to-fuchsia-600/20 text-rose-50 shadow-[0_0_18px_rgba(244,63,94,0.45)]",
    accentBar: "from-rose-500 via-fuchsia-400 to-rose-400",
    historyBorder: "group-hover:border-rose-400/55 group-hover:shadow-[0_0_24px_rgba(244,63,94,0.22)]",
    ticketGlow: "shadow-[inset_0_0_60px_rgba(244,63,94,0.09)]"
  }
};

function statusBadge(status: string): string {
  switch (status) {
    case "open":
      return "border-violet-400/60 bg-violet-500/15 text-violet-100 shadow-[0_0_10px_rgba(167,139,250,0.25)]";
    case "acknowledged":
      return "border-cyan-400/60 bg-cyan-500/15 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.25)]";
    case "in_progress":
      return "border-amber-400/70 bg-amber-500/18 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.3)]";
    case "resolved":
      return "border-emerald-400/65 bg-emerald-500/15 text-emerald-100 shadow-[0_0_10px_rgba(52,211,153,0.28)]";
    case "closed":
      return "border-slate-400/50 bg-slate-500/12 text-slate-300";
    default:
      return "border-white/25 bg-white/8 text-white/65";
  }
}

function statusLabel(s: string): string {
  return s.replace(/_/g, " ");
}

function userBubbleStyle(index: number): string {
  const variants = [
    "border-amber-400/55 bg-gradient-to-br from-amber-500/22 via-amber-950/30 to-orange-950/40 text-amber-50 shadow-[0_0_20px_rgba(251,191,36,0.12),inset_0_1px_0_rgba(255,215,0,0.15)]",
    "border-fuchsia-400/45 bg-gradient-to-br from-fuchsia-500/18 via-violet-950/35 to-black/50 text-fuchsia-50 shadow-[0_0_18px_rgba(232,121,249,0.1)]",
    "border-orange-400/50 bg-gradient-to-br from-orange-500/20 via-amber-950/30 to-black/45 text-orange-50 shadow-[0_0_16px_rgba(251,146,60,0.1)]"
  ];
  return variants[index % variants.length];
}

const STAFF_BUBBLE =
  "border-cyan-400/55 bg-gradient-to-br from-cyan-500/20 via-teal-950/40 to-emerald-950/30 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.18),inset_0_1px_0_rgba(103,232,249,0.12)]";

type PriorityBtn = {
  key: SupportPriority;
  label: string;
  sub: string;
  icon: LucideIcon;
  base: string;
  hover: string;
  ring: string;
  iconColor: string;
};

const PRIORITY_BUTTONS: PriorityBtn[] = [
  {
    key: "normal",
    label: "Standard",
    sub: "General questions & guidance",
    icon: MessageCircle,
    base: "border-sky-400/55 bg-gradient-to-br from-sky-500/25 via-cyan-950/50 to-slate-950/60 text-sky-100",
    hover: "hover:border-sky-300/95 hover:shadow-[0_0_32px_rgba(56,189,248,0.4)]",
    ring: "ring-sky-400/75",
    iconColor: "text-sky-300"
  },
  {
    key: "elevated",
    label: "Priority",
    sub: "Need help soon — faster response",
    icon: Clock,
    base: "border-amber-400/65 bg-gradient-to-br from-amber-500/28 via-amber-950/55 to-orange-950/50 text-amber-50",
    hover: "hover:border-amber-300/95 hover:shadow-[0_0_36px_rgba(251,191,36,0.45)]",
    ring: "ring-amber-400/85",
    iconColor: "text-amber-300"
  },
  {
    key: "critical",
    label: "Emergency",
    sub: "Account, billing, or safety — confirm required",
    icon: ShieldAlert,
    base: "border-rose-500/70 bg-gradient-to-br from-rose-600/28 via-fuchsia-950/55 to-rose-950/60 text-rose-50",
    hover: "hover:border-rose-400/95 hover:shadow-[0_0_40px_rgba(244,63,94,0.5)]",
    ring: "ring-rose-500/85",
    iconColor: "text-rose-300"
  }
];

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

type UrgentStep = "none" | "warn" | "confirm";

export function SupportSection() {
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<SupportThread | null>(null);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hoveredPriority, setHoveredPriority] = useState<SupportPriority | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<SupportPriority | null>(null);
  const [urgentStep, setUrgentStep] = useState<UrgentStep>("none");
  const [confirmText, setConfirmText] = useState("");

  const loadThreads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchSupportThreads();
      setThreads(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load support history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  const openThread = useCallback(async (id: string) => {
    setSelectedId(id);
    setError(null);
    setSuccess(null);
    try {
      const t = await fetchSupportThread(id);
      setActiveThread(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load conversation.");
    }
  }, []);

  const closeThread = () => {
    setSelectedId(null);
    setActiveThread(null);
    setReply("");
  };

  const submitNew = async (priority: SupportPriority, urgentConfirmed = false) => {
    const text = message.trim();
    if (text.length < MIN_LEN) {
      setError(`Please describe your issue (at least ${MIN_LEN} characters).`);
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await createSupportThread(text, priority, urgentConfirmed);
      setMessage("");
      setSelectedPriority(null);
      setUrgentStep("none");
      setConfirmText("");
      setSuccess("Request submitted. Our team has been notified by email.");
      await loadThreads();
      void openThread(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePriorityClick = (priority: SupportPriority) => {
    setSelectedPriority(priority);
    setError(null);
    if (priority === "critical") {
      setUrgentStep("warn");
      return;
    }
    setUrgentStep("none");
    void submitNew(priority);
  };

  const sendReply = async () => {
    if (!selectedId) return;
    const text = reply.trim();
    if (text.length < MIN_LEN) {
      setError(`Reply must be at least ${MIN_LEN} characters.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updated = await replySupportThread(selectedId, text);
      setActiveThread(updated);
      setReply("");
      setSuccess("Message sent.");
      await loadThreads();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send reply.");
    } finally {
      setSubmitting(false);
    }
  };

  const closed = activeThread?.status === "resolved" || activeThread?.status === "closed";
  const charCount = message.trim().length;
  const charOk = charCount >= MIN_LEN;
  const threadTheme = activeThread ? PRIORITY_THEME[activeThread.priority] : null;
  let userMsgIndex = 0;

  return (
    <motion.div
      className="min-h-0 min-w-0 w-full max-w-none flex-1 py-1 md:py-2"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section
        aria-label="Support and help"
        className="relative w-full min-w-0 flex-1 scroll-mt-2 overflow-hidden rounded-xl border border-[rgba(255,215,0,0.28)] bg-[#050508]/90 p-[var(--fluid-deck-p)] shadow-[0_0_0_1px_rgba(255,215,0,0.12),0_0_56px_rgba(255,165,0,0.1),0_0_80px_rgba(56,189,248,0.06)]"
      >
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-100"
          style={{
            background: `
              radial-gradient(900px 400px at 8% 0%, rgba(255,215,0,0.14), transparent 52%),
              radial-gradient(700px 320px at 92% 8%, rgba(56,189,248,0.1), transparent 48%),
              radial-gradient(500px 280px at 50% 100%, rgba(167,139,250,0.08), transparent 50%),
              radial-gradient(400px 200px at 80% 60%, rgba(244,63,94,0.05), transparent 45%)
            `
          }}
          aria-hidden
        />

        <div className="relative z-[1] flex min-h-[min(56vh,640px)] flex-col gap-5">
          <header className="relative">
            <div
              className="pointer-events-none absolute -left-1 top-0 h-full w-1 rounded-full bg-gradient-to-b from-amber-400 via-fuchsia-400 to-cyan-400 opacity-80"
              aria-hidden
            />
            <h2 className="bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text pl-3 text-lg font-black uppercase tracking-[0.18em] text-transparent md:text-xl">
              Operator Support
            </h2>
            <p className="mt-2 max-w-2xl pl-3 text-sm leading-relaxed text-white/65">
              Choose a priority level, describe your issue, and we will alert the team by email. Every conversation is
              saved in your history below.
            </p>
          </header>

          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="err"
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-md border border-rose-400/55 bg-gradient-to-r from-rose-500/15 to-fuchsia-500/10 px-4 py-3 text-sm text-rose-100"
              >
                {error}
              </motion.div>
            ) : null}
            {success ? (
              <motion.div
                key="ok"
                role="status"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-md border border-emerald-400/55 bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 px-4 py-3 text-sm text-emerald-100"
              >
                {success}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {selectedId && activeThread && threadTheme ? (
            <motion.div
              key="thread"
              className="flex min-h-0 flex-1 flex-col gap-4"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28 }}
            >
              <button
                type="button"
                onClick={closeThread}
                className="inline-flex w-fit items-center gap-2 bg-gradient-to-r from-cyan-200/90 to-amber-200/90 bg-clip-text text-xs font-bold uppercase tracking-[0.14em] text-transparent transition hover:from-cyan-100 hover:to-amber-100"
              >
                <ChevronLeft className="h-4 w-4 text-cyan-400/80" aria-hidden />
                <span className="text-cyan-200/90">Back to new request</span>
              </button>

              <motion.div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/40 p-3">
                <div
                  className={cn("absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r opacity-90", threadTheme.accentBar)}
                  aria-hidden
                />
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span
                    className={cn(
                      "rounded border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]",
                      threadTheme.badge
                    )}
                  >
                    {threadTheme.label}
                  </span>
                  <span
                    className={cn(
                      "rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]",
                      statusBadge(activeThread.status)
                    )}
                  >
                    {statusLabel(activeThread.status)}
                  </span>
                  <span className="font-mono text-[11px] text-violet-300/70">#{activeThread.id.slice(0, 8)}</span>
                </div>
              </motion.div>

              <div
                className={cn(
                  "relative flex max-h-[min(42vh,420px)] min-h-[200px] flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-white/12 bg-gradient-to-b from-black/55 via-[#0a0810]/80 to-black/60 p-4",
                  threadTheme.ticketGlow
                )}
              >
                <div
                  className="pointer-events-none absolute inset-0 rounded-lg opacity-40"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,215,0,0.04) 0%, transparent 40%, rgba(34,211,238,0.05) 70%, rgba(167,139,250,0.04) 100%)"
                  }}
                  aria-hidden
                />
                {(activeThread.messages ?? []).map((m, i) => {
                  const userIdx = m.is_staff ? -1 : userMsgIndex++;
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={cn(
                        "relative max-w-[92%] rounded-lg border px-3 py-2.5 text-sm leading-relaxed",
                        m.is_staff ? "ml-0 mr-auto " + STAFF_BUBBLE : "ml-auto " + userBubbleStyle(Math.max(0, userIdx))
                      )}
                    >
                      {!m.is_staff ? (
                        <div
                          className="pointer-events-none absolute -right-px top-2 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-amber-400 to-orange-500 opacity-70"
                          aria-hidden
                        />
                      ) : (
                        <div
                          className="pointer-events-none absolute -left-px top-2 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-cyan-400 to-emerald-400 opacity-80"
                          aria-hidden
                        />
                      )}
                      <div
                        className={cn(
                          "mb-1 text-[10px] font-bold uppercase tracking-[0.12em]",
                          m.is_staff ? "text-cyan-300/90" : "text-amber-300/85"
                        )}
                      >
                        {m.is_staff ? "Support team" : "You"} · {formatWhen(m.created_at)}
                      </div>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                    </motion.div>
                  );
                })}
              </div>

              {!closed ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Add a follow-up message…"
                    rows={3}
                    className="min-h-[80px] flex-1 resize-y rounded-md border border-violet-400/25 bg-black/60 px-3 py-2 text-sm text-white transition placeholder:text-white/35 focus:border-cyan-400/55 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  />
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void sendReply()}
                    className="support-send-btn cut-frame-sm relative z-30 inline-flex min-h-[44px] min-w-[108px] items-center justify-center gap-2 border-2 border-amber-200/95 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 px-5 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#0c0800] shadow-[0_0_28px_rgba(251,191,36,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] transition hover:from-amber-200 hover:via-amber-300 hover:to-amber-400 hover:text-black hover:shadow-[0_0_36px_rgba(251,191,36,0.55)] disabled:opacity-50 [&_svg]:text-[#0c0800]"
                  >
                    <Send className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="relative z-[1]">Send</span>
                  </button>
                </div>
              ) : (
                <p className="rounded-md border border-slate-500/30 bg-slate-500/10 px-3 py-2 text-sm text-slate-300">
                  This request is closed. Submit a new request if you need more help.
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div key="form" className="flex flex-col gap-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <label className="block">
                <span className="mb-2 block bg-gradient-to-r from-violet-200/80 to-cyan-200/80 bg-clip-text text-[11px] font-bold uppercase tracking-[0.16em] text-transparent">
                  What do you need help with?
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue, account problem, or question…"
                  rows={5}
                  className={cn(
                    "w-full resize-y rounded-md border bg-black/60 px-3 py-2 text-sm text-white transition placeholder:text-white/35 focus:outline-none focus:ring-2",
                    charOk
                      ? "border-emerald-400/45 focus:border-emerald-400/65 focus:ring-emerald-400/25"
                      : "border-violet-400/25 focus:border-amber-400/55 focus:ring-amber-400/20"
                  )}
                />
                <p
                  className={cn(
                    "mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]",
                    charOk ? "text-emerald-400/90" : "text-violet-300/50"
                  )}
                >
                  {charCount} / {MIN_LEN} min characters
                </p>
              </label>

              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">
                  Select priority &amp; submit
                </p>
                <motion.div className="grid gap-3 sm:grid-cols-3">
                  {PRIORITY_BUTTONS.map((btn) => {
                    const Icon = btn.icon;
                    const active =
                      selectedPriority === btn.key ||
                      hoveredPriority === btn.key ||
                      (btn.key === "critical" && urgentStep !== "none");
                    return (
                      <motion.button
                        key={btn.key}
                        type="button"
                        disabled={submitting}
                        onMouseEnter={() => setHoveredPriority(btn.key)}
                        onMouseLeave={() => setHoveredPriority(null)}
                        onClick={() => handlePriorityClick(btn.key)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "cut-frame-sm group relative flex min-h-[108px] flex-col items-start gap-2 border px-4 py-3 text-left transition-all duration-200 disabled:opacity-50",
                          btn.base,
                          btn.hover,
                          active && `ring-2 ${btn.ring}`
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                            btn.iconColor,
                            btn.key === "critical" && urgentStep === "none" && "animate-pulse"
                          )}
                          aria-hidden
                        />
                        <span className="text-xs font-black uppercase tracking-[0.14em]">{btn.label}</span>
                        <span className="text-[11px] leading-snug opacity-80">{btn.sub}</span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </div>

              <AnimatePresence>
                {urgentStep === "warn" ? (
                  <motion.div
                    key="warn"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-lg border border-rose-500/65 bg-gradient-to-br from-rose-950/70 via-fuchsia-950/40 to-black/55 p-4 shadow-[0_0_36px_rgba(244,63,94,0.25)]"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" aria-hidden />
                      <div>
                        <p className="text-sm font-bold text-rose-100">Emergency support only</p>
                        <p className="mt-1 text-sm text-rose-200/85">
                          Use for account lockouts, payment failures, or safety issues. Misuse may be rate-limited.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setUrgentStep("confirm");
                              setConfirmText("");
                            }}
                            className="cut-frame-sm border border-rose-400/85 bg-gradient-to-r from-rose-600/35 to-fuchsia-600/25 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-rose-50 transition hover:shadow-[0_0_24px_rgba(244,63,94,0.45)]"
                          >
                            I understand — continue
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUrgentStep("none");
                              setSelectedPriority(null);
                            }}
                            className="px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/50 transition hover:text-violet-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : null}

                {urgentStep === "confirm" ? (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-lg border border-fuchsia-500/70 bg-gradient-to-br from-rose-950/75 via-fuchsia-950/50 to-black/60 p-4 shadow-[0_0_44px_rgba(192,38,211,0.3)]"
                  >
                    <p className="text-sm text-rose-100">
                      Type <strong className="text-fuchsia-300">CONFIRM</strong> to submit as highest priority:
                    </p>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="mt-3 w-full max-w-xs rounded border border-fuchsia-400/55 bg-black/65 px-3 py-2 text-sm text-white uppercase transition focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/35"
                      autoComplete="off"
                    />
                    <motion.div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={submitting || confirmText.trim().toUpperCase() !== "CONFIRM"}
                        onClick={() => void submitNew("critical", true)}
                        className="cut-frame-sm border border-rose-400 bg-gradient-to-r from-rose-600/45 to-fuchsia-600/35 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-rose-50 transition hover:shadow-[0_0_28px_rgba(244,63,94,0.5)] disabled:opacity-40"
                      >
                        Submit emergency request
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUrgentStep("none");
                          setSelectedPriority(null);
                        }}
                        className="px-4 py-2 text-xs font-bold uppercase text-white/50 transition hover:text-violet-200"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="border-t border-white/10 pt-5">
                <h3 className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em]">
                  <MessageCircle className="h-4 w-4 text-cyan-400" aria-hidden />
                  <span className="bg-gradient-to-r from-cyan-200/90 to-amber-200/90 bg-clip-text text-transparent">
                    Your history
                  </span>
                </h3>
                {loading ? (
                  <div className="flex gap-2">
                    {["sky", "amber", "violet"].map((c, i) => (
                      <div
                        key={c}
                        className={cn(
                          "h-16 flex-1 animate-pulse rounded-lg border bg-white/5",
                          i === 0 && "border-sky-400/20",
                          i === 1 && "border-amber-400/20",
                          i === 2 && "border-violet-400/20"
                        )}
                      />
                    ))}
                  </div>
                ) : threads.length === 0 ? (
                  <p className="text-sm text-white/45">No requests yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {threads.map((t) => {
                      const theme = PRIORITY_THEME[t.priority];
                      return (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => void openThread(t.id)}
                            className={cn(
                              "group relative w-full overflow-hidden rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:bg-black/55",
                              theme.historyBorder
                            )}
                          >
                            <div
                              className={cn(
                                "absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b opacity-70 transition-opacity group-hover:opacity-100",
                                theme.accentBar
                              )}
                              aria-hidden
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2 pl-2">
                              <span
                                className={cn(
                                  "rounded border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]",
                                  theme.badge
                                )}
                              >
                                {theme.label}
                              </span>
                              <span className="text-[10px] uppercase tracking-[0.1em] text-violet-300/50 group-hover:text-violet-200/70">
                                {formatWhen(t.updated_at)}
                              </span>
                            </div>
                            <p className="mt-2 line-clamp-2 pl-2 text-sm text-white/75 group-hover:text-white/92">
                              {t.preview || "—"}
                            </p>
                            <p className="mt-1 pl-2">
                              <span
                                className={cn(
                                  "inline-block rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]",
                                  statusBadge(t.status)
                                )}
                              >
                                {statusLabel(t.status)}
                              </span>
                              <span className="ml-2 text-[10px] uppercase tracking-[0.1em] text-white/35">
                                · {t.message_count} message{t.message_count === 1 ? "" : "s"}
                              </span>
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
