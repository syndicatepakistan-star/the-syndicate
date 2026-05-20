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

const METHODS_NOTCH_CLIP =
  "[clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]";

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
  border: string;
  glow: string;
  bg: string;
  stepBorder: string;
  titleText: string;
  hover: string;
  ring: string;
  iconColor: string;
  submitBtn: string;
};

const PRIORITY_BUTTONS: PriorityBtn[] = [
  {
    key: "normal",
    label: "Standard",
    sub: "General questions & guidance",
    icon: MessageCircle,
    border: "border-cyan-400/75",
    glow: "shadow-[0_0_0_1px_rgba(34,211,238,0.95),0_0_20px_rgba(34,211,238,0.65),0_0_44px_rgba(6,182,212,0.45),0_0_72px_rgba(14,116,144,0.28)]",
    bg: "bg-[linear-gradient(145deg,rgba(34,211,238,0.14),rgba(8,145,178,0.08),rgba(0,0,0,0.55))]",
    stepBorder: "border-cyan-500/70",
    titleText: "text-cyan-200",
    hover:
      "hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(34,211,238,1),0_0_28px_rgba(34,211,238,0.75),0_0_56px_rgba(6,182,212,0.5),0_0_88px_rgba(14,116,144,0.35)]",
    ring: "ring-cyan-400/70",
    iconColor: "text-cyan-100",
    submitBtn:
      "border-cyan-400/80 bg-black/75 text-cyan-100 shadow-[0_6px_28px_rgba(0,0,0,0.55),0_0_24px_rgba(34,211,238,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] group-hover:border-cyan-300/90 group-hover:shadow-[0_10px_36px_rgba(0,0,0,0.6),0_0_32px_rgba(34,211,238,0.6)]"
  },
  {
    key: "elevated",
    label: "Priority",
    sub: "Need help soon — faster response",
    icon: Clock,
    border: "border-amber-400/75",
    glow: "shadow-[0_0_0_1px_rgba(251,191,36,0.95),0_0_20px_rgba(251,191,36,0.6),0_0_44px_rgba(234,88,12,0.42),0_0_72px_rgba(180,83,9,0.26)]",
    bg: "bg-[linear-gradient(145deg,rgba(251,191,36,0.14),rgba(234,88,12,0.08),rgba(0,0,0,0.55))]",
    stepBorder: "border-amber-500/70",
    titleText: "text-amber-200",
    hover:
      "hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(251,191,36,1),0_0_28px_rgba(251,191,36,0.7),0_0_56px_rgba(234,88,12,0.48),0_0_88px_rgba(180,83,9,0.32)]",
    ring: "ring-amber-400/70",
    iconColor: "text-amber-100",
    submitBtn:
      "border-amber-400/80 bg-black/75 text-amber-100 shadow-[0_6px_28px_rgba(0,0,0,0.55),0_0_24px_rgba(251,191,36,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] group-hover:border-amber-300/90 group-hover:shadow-[0_10px_36px_rgba(0,0,0,0.6),0_0_32px_rgba(251,191,36,0.58)]"
  },
  {
    key: "critical",
    label: "Emergency",
    sub: "Account block, mental breakdown, suffering from major financial lose, suffering from major life crises, need urgent help and support",
    icon: ShieldAlert,
    border: "border-rose-400/75",
    glow: "shadow-[0_0_0_1px_rgba(244,63,94,0.95),0_0_20px_rgba(244,63,94,0.62),0_0_44px_rgba(225,29,72,0.42),0_0_72px_rgba(136,19,55,0.28)]",
    bg: "bg-[linear-gradient(145deg,rgba(244,63,94,0.14),rgba(190,24,93,0.08),rgba(0,0,0,0.55))]",
    stepBorder: "border-rose-500/70",
    titleText: "text-rose-200",
    hover:
      "hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(244,63,94,1),0_0_28px_rgba(244,63,94,0.72),0_0_56px_rgba(225,29,72,0.5),0_0_88px_rgba(136,19,55,0.34)]",
    ring: "ring-rose-400/70",
    iconColor: "text-rose-100",
    submitBtn:
      "border-rose-400/80 bg-black/75 text-rose-100 shadow-[0_6px_28px_rgba(0,0,0,0.55),0_0_24px_rgba(244,63,94,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] group-hover:border-rose-300/90 group-hover:shadow-[0_10px_36px_rgba(0,0,0,0.6),0_0_32px_rgba(244,63,94,0.58)]"
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
            <h2 className="bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text pl-3 text-xl font-black uppercase tracking-[0.18em] text-transparent md:text-2xl">
              Operator Support
            </h2>
            <p className="mt-2 max-w-2xl pl-3 text-base leading-relaxed text-white/75 md:text-lg">
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
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl border-2 border-violet-500/50 p-4 sm:p-5",
                  METHODS_NOTCH_CLIP,
                  "shadow-[0_0_0_1px_rgba(167,139,250,0.55),0_0_32px_rgba(139,92,246,0.28),inset_0_0_40px_rgba(0,0,0,0.35)]"
                )}
              >
                <span className="pointer-events-none absolute inset-[6px] rounded-[12px] border-2 border-black/45" aria-hidden />
                <label className="relative z-[1] block">
                  <span className="mb-2 block bg-gradient-to-r from-violet-200/90 to-cyan-200/90 bg-clip-text text-sm font-bold uppercase tracking-[0.16em] text-transparent sm:text-base">
                    What do you need help with?
                  </span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue, account problem, or question…"
                    rows={5}
                    className={cn(
                      "w-full resize-y rounded-lg border-2 bg-black/70 px-4 py-3 text-base text-white transition placeholder:text-base placeholder:text-white/40 focus:outline-none focus:ring-2 md:text-lg",
                      charOk
                        ? "border-emerald-400/55 focus:border-emerald-400/75 focus:ring-emerald-400/25"
                        : "border-violet-400/40 focus:border-amber-400/60 focus:ring-amber-400/20"
                    )}
                  />
                  <p
                    className={cn(
                      "mt-2 text-xs font-semibold uppercase tracking-[0.1em] sm:text-sm",
                      charOk ? "text-emerald-400/90" : "text-violet-300/60"
                    )}
                  >
                    {charCount} / {MIN_LEN} min characters
                  </p>
                </label>
              </div>

              <div
                className={cn(
                  "relative overflow-visible rounded-2xl border-2 border-amber-400/45 p-4 pb-6 sm:p-5 sm:pb-7",
                  METHODS_NOTCH_CLIP,
                  "shadow-[0_0_0_1px_rgba(251,191,36,0.45),0_0_28px_rgba(251,191,36,0.18),inset_0_0_40px_rgba(0,0,0,0.35)]"
                )}
              >
                <span className="pointer-events-none absolute inset-[6px] rounded-[12px] border-2 border-black/45" aria-hidden />
                <p className="relative z-[1] mb-4 text-sm font-bold uppercase tracking-[0.16em] text-amber-200/90 sm:text-base">
                  Select priority &amp; submit
                </p>
                <motion.div className="relative z-[1] grid gap-8 pb-3 sm:grid-cols-3 sm:gap-6 sm:pb-4">
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
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "group relative flex min-h-[13rem] w-full flex-col overflow-visible rounded-2xl border-2 bg-black/60 pb-14 text-left transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[14rem] sm:pb-16",
                          METHODS_NOTCH_CLIP,
                          btn.border,
                          btn.glow,
                          btn.hover,
                          active && `ring-2 ${btn.ring}`
                        )}
                      >
                        <span className={cn("pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]", btn.bg)} aria-hidden />
                        <span
                          className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:repeating-linear-gradient(180deg,rgba(0,0,0,0.35)_0px,rgba(0,0,0,0.35)_1px,transparent_1px,transparent_3px)]"
                          aria-hidden
                        />
                        <span className={cn("pointer-events-none absolute inset-[6px] rounded-[12px] border border-white/10")} aria-hidden />
                        <span className={cn("pointer-events-none absolute left-3 top-3 h-6 w-6 border-l-[3px] border-t-[3px]", btn.stepBorder)} aria-hidden />
                        <span className={cn("pointer-events-none absolute bottom-3 right-3 h-6 w-6 border-b-[3px] border-r-[3px]", btn.stepBorder)} aria-hidden />
                        <div className="relative z-[1] flex h-full flex-col items-start gap-3 p-4 sm:p-5 sm:pb-6">
                          <Icon
                            className={cn(
                              "h-7 w-7 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8",
                              btn.iconColor,
                              btn.key === "critical" && urgentStep === "none" && "animate-pulse"
                            )}
                            aria-hidden
                          />
                          <span className={cn("text-base font-black uppercase tracking-[0.14em] sm:text-lg", btn.titleText)}>
                            {btn.label}
                          </span>
                          <span className="text-sm leading-relaxed text-zinc-100/90 sm:text-base">{btn.sub}</span>
                        </div>
                        <span
                          className={cn(
                            "pointer-events-none absolute bottom-0 left-1/2 z-[2] -translate-x-1/2 translate-y-1/2 rounded-lg border-2 px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] backdrop-blur-md transition-all duration-300 sm:px-6 sm:py-3 sm:text-sm",
                            btn.submitBtn
                          )}
                          aria-hidden
                        >
                          Tap to submit
                        </span>
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
                        <p className="text-base font-bold text-rose-100 sm:text-lg">Emergency support only</p>
                        <p className="mt-2 text-sm leading-relaxed text-rose-200/90 sm:text-base">
                          For account block, mental breakdown, major financial loss, major life crises, or when you need
                          urgent help and support. Misuse may be rate-limited.
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

              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl border-2 border-cyan-500/45 pt-5 sm:pt-6",
                  METHODS_NOTCH_CLIP,
                  "shadow-[0_0_0_1px_rgba(34,211,238,0.45),0_0_28px_rgba(34,211,238,0.16),inset_0_0_40px_rgba(0,0,0,0.35)]"
                )}
              >
                <span className="pointer-events-none absolute inset-[6px] rounded-[12px] border-2 border-black/45" aria-hidden />
                <h3 className="relative z-[1] mb-4 flex items-center gap-2 px-4 text-sm font-black uppercase tracking-[0.16em] sm:px-5 sm:text-base">
                  <MessageCircle className="h-5 w-5 text-cyan-400" aria-hidden />
                  <span className="bg-gradient-to-r from-cyan-200/90 to-amber-200/90 bg-clip-text text-transparent">
                    Your history
                  </span>
                </h3>
                <div className="relative z-[1] px-3 pb-4 sm:px-4 sm:pb-5">
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
                  <p className="text-base text-white/55 sm:text-lg">No requests yet.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {threads.map((t) => {
                      const theme = PRIORITY_THEME[t.priority];
                      const historyBorder =
                        t.priority === "normal"
                          ? "border-cyan-500/75"
                          : t.priority === "elevated"
                            ? "border-amber-400/80"
                            : "border-rose-500/85";
                      const historyGlow =
                        t.priority === "normal"
                          ? "shadow-[0_0_0_1px_rgba(34,211,238,0.65),0_0_24px_rgba(34,211,238,0.28)]"
                          : t.priority === "elevated"
                            ? "shadow-[0_0_0_1px_rgba(251,191,36,0.65),0_0_24px_rgba(251,191,36,0.28)]"
                            : "shadow-[0_0_0_1px_rgba(244,63,94,0.7),0_0_24px_rgba(244,63,94,0.3)]";
                      return (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => void openThread(t.id)}
                            className={cn(
                              "group relative w-full overflow-hidden rounded-2xl border-2 bg-black/50 px-4 py-4 text-left transition duration-300 hover:-translate-y-0.5 hover:bg-black/65 sm:px-5 sm:py-4",
                              METHODS_NOTCH_CLIP,
                              historyBorder,
                              historyGlow,
                              theme.historyBorder
                            )}
                          >
                            <span className="pointer-events-none absolute inset-[5px] rounded-[11px] border border-white/10" aria-hidden />
                            <div
                              className={cn(
                                "absolute left-0 top-0 h-full w-[4px] bg-gradient-to-b opacity-80 transition-opacity group-hover:opacity-100",
                                theme.accentBar
                              )}
                              aria-hidden
                            />
                            <div className="relative z-[1] flex flex-wrap items-center justify-between gap-2 pl-3">
                              <span
                                className={cn(
                                  "rounded-md border-2 px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] sm:text-sm",
                                  theme.badge
                                )}
                              >
                                {theme.label}
                              </span>
                              <span className="text-xs uppercase tracking-[0.1em] text-violet-300/65 group-hover:text-violet-200/85 sm:text-sm">
                                {formatWhen(t.updated_at)}
                              </span>
                            </div>
                            <p className="relative z-[1] mt-3 line-clamp-2 pl-3 text-base text-white/85 group-hover:text-white sm:text-lg">
                              {t.preview || "—"}
                            </p>
                            <p className="relative z-[1] mt-2 pl-3">
                              <span
                                className={cn(
                                  "inline-block rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-[0.1em]",
                                  statusBadge(t.status)
                                )}
                              >
                                {statusLabel(t.status)}
                              </span>
                              <span className="ml-2 text-xs uppercase tracking-[0.1em] text-white/45 sm:text-sm">
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
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
