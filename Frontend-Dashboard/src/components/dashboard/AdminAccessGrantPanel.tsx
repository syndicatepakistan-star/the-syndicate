"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DASHBOARD_HEADING_LIGHTNING } from "@/components/dashboard/dashboardPrimitives";
import {
  fetchAdminGrantCatalog,
  lookupAdminGrantEmail,
  postAdminGrantAccess,
  type AdminGrantCatalog,
  type AdminGrantDurationType,
  type AdminGrantLookup,
  type AdminGrantResult,
} from "@/lib/admin-grants-api";
import { cn } from "@/lib/cn";

type ThemeMode = "default" | "danger" | "cyberpunk";

const GROUP_LABELS: Record<string, string> = {
  primary: "Core plans",
  vault_pack: "Vault packs",
  trading_module: "Trading modules",
  level1_pack: "Level 1 unlock-all",
  agentic_ai_course: "Agentic AI courses",
  ai_content_course: "AI Content courses",
  trading_course: "Trading courses",
  vault_course: "Other vault courses",
};

const GROUP_ORDER = [
  "primary",
  "vault_pack",
  "trading_module",
  "level1_pack",
  "agentic_ai_course",
  "ai_content_course",
  "trading_course",
  "vault_course",
];

/** Distinct neon chrome per catalog group (matches Settings multi-hue panels). */
const GROUP_NEON: Record<
  string,
  { border: string; glow: string; label: string; wash: string; selected: string; check: string }
> = {
  primary: {
    border: "border-amber-300/45",
    glow: "shadow-[0_0_0_1px_rgba(251,191,36,0.22),0_0_22px_rgba(251,191,36,0.16)]",
    label: "text-amber-100",
    wash: "bg-[radial-gradient(420px_160px_at_0%_0%,rgba(251,191,36,0.16),transparent_70%)]",
    selected: "bg-amber-400/15 border-amber-300/40",
    check: "accent-amber-400",
  },
  vault_pack: {
    border: "border-cyan-300/45",
    glow: "shadow-[0_0_0_1px_rgba(34,211,238,0.22),0_0_22px_rgba(34,211,238,0.16)]",
    label: "text-cyan-100",
    wash: "bg-[radial-gradient(420px_160px_at_0%_0%,rgba(34,211,238,0.16),transparent_70%)]",
    selected: "bg-cyan-400/15 border-cyan-300/40",
    check: "accent-cyan-400",
  },
  trading_module: {
    border: "border-emerald-300/45",
    glow: "shadow-[0_0_0_1px_rgba(52,211,153,0.22),0_0_22px_rgba(52,211,153,0.16)]",
    label: "text-emerald-100",
    wash: "bg-[radial-gradient(420px_160px_at_0%_0%,rgba(52,211,153,0.14),transparent_70%)]",
    selected: "bg-emerald-400/15 border-emerald-300/40",
    check: "accent-emerald-400",
  },
  level1_pack: {
    border: "border-violet-300/45",
    glow: "shadow-[0_0_0_1px_rgba(167,139,250,0.22),0_0_22px_rgba(167,139,250,0.16)]",
    label: "text-violet-100",
    wash: "bg-[radial-gradient(420px_160px_at_0%_0%,rgba(167,139,250,0.16),transparent_70%)]",
    selected: "bg-violet-400/15 border-violet-300/40",
    check: "accent-violet-400",
  },
  agentic_ai_course: {
    border: "border-fuchsia-300/45",
    glow: "shadow-[0_0_0_1px_rgba(232,121,249,0.22),0_0_22px_rgba(232,121,249,0.14)]",
    label: "text-fuchsia-100",
    wash: "bg-[radial-gradient(420px_160px_at_0%_0%,rgba(232,121,249,0.14),transparent_70%)]",
    selected: "bg-fuchsia-400/15 border-fuchsia-300/40",
    check: "accent-fuchsia-400",
  },
  ai_content_course: {
    border: "border-rose-300/45",
    glow: "shadow-[0_0_0_1px_rgba(251,113,133,0.22),0_0_22px_rgba(251,113,133,0.14)]",
    label: "text-rose-100",
    wash: "bg-[radial-gradient(420px_160px_at_0%_0%,rgba(251,113,133,0.14),transparent_70%)]",
    selected: "bg-rose-400/15 border-rose-300/40",
    check: "accent-rose-400",
  },
  trading_course: {
    border: "border-lime-300/40",
    glow: "shadow-[0_0_0_1px_rgba(163,230,53,0.2),0_0_22px_rgba(163,230,53,0.12)]",
    label: "text-lime-100",
    wash: "bg-[radial-gradient(420px_160px_at_0%_0%,rgba(163,230,53,0.12),transparent_70%)]",
    selected: "bg-lime-400/15 border-lime-300/35",
    check: "accent-lime-400",
  },
  vault_course: {
    border: "border-sky-300/45",
    glow: "shadow-[0_0_0_1px_rgba(56,189,248,0.22),0_0_22px_rgba(56,189,248,0.14)]",
    label: "text-sky-100",
    wash: "bg-[radial-gradient(420px_160px_at_0%_0%,rgba(56,189,248,0.14),transparent_70%)]",
    selected: "bg-sky-400/15 border-sky-300/40",
    check: "accent-sky-400",
  },
};

const DEFAULT_GROUP_NEON = GROUP_NEON.primary;

function themeShell(themeMode: ThemeMode) {
  if (themeMode === "danger") {
    return {
      border: "border-rose-300/40",
      shadow: "shadow-[0_0_0_1px_rgba(251,113,133,0.16),0_0_28px_rgba(244,63,94,0.16),inset_0_0_20px_rgba(244,63,94,0.06)]",
      wash: "[background:radial-gradient(520px_240px_at_8%_0%,rgba(244,63,94,0.14),transparent_65%),radial-gradient(560px_260px_at_100%_100%,rgba(251,191,36,0.08),transparent_70%)]",
    };
  }
  if (themeMode === "cyberpunk") {
    return {
      border: "border-fuchsia-300/40",
      shadow: "shadow-[0_0_0_1px_rgba(232,121,249,0.16),0_0_28px_rgba(168,85,247,0.16),inset_0_0_20px_rgba(34,211,238,0.06)]",
      wash: "[background:radial-gradient(520px_240px_at_8%_0%,rgba(168,85,247,0.14),transparent_65%),radial-gradient(560px_260px_at_100%_100%,rgba(34,211,238,0.1),transparent_70%)]",
    };
  }
  return {
    border: "border-cyan-300/35",
    shadow: "shadow-[0_0_0_1px_rgba(34,211,238,0.14),0_0_26px_rgba(34,211,238,0.14),inset_0_0_18px_rgba(168,85,247,0.08)]",
    wash: "[background:radial-gradient(500px_220px_at_8%_0%,rgba(34,211,238,0.12),transparent_65%),radial-gradient(560px_260px_at_100%_100%,rgba(244,63,94,0.08),transparent_70%)]",
  };
}

export function AdminAccessGrantPanel({ themeMode }: { themeMode: ThemeMode }) {
  const shell = themeShell(themeMode);
  const [catalog, setCatalog] = useState<AdminGrantCatalog | null>(null);
  const [catalogError, setCatalogError] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [lookup, setLookup] = useState<AdminGrantLookup | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);

  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<number>>(new Set());
  const [planFilter, setPlanFilter] = useState("");
  const [playlistFilter, setPlaylistFilter] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(["primary", "vault_pack", "trading_module", "level1_pack"]),
  );

  const [durationType, setDurationType] = useState<AdminGrantDurationType>("lifetime");
  const [days, setDays] = useState(30);
  const [customExpiry, setCustomExpiry] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AdminGrantResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      setCatalogError("");
      const data = await fetchAdminGrantCatalog();
      if (cancelled) return;
      if (!data) {
        setCatalogError("Could not load grant catalog. Confirm you are signed in as staff.");
        setCatalog(null);
      } else {
        setCatalog(data);
      }
      setCatalogLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const plansByGroup = useMemo(() => {
    const map = new Map<string, AdminGrantCatalog["plans"]>();
    for (const plan of catalog?.plans ?? []) {
      const list = map.get(plan.group) ?? [];
      list.push(plan);
      map.set(plan.group, list);
    }
    return map;
  }, [catalog]);

  const filteredPlaylists = useMemo(() => {
    const q = playlistFilter.trim().toLowerCase();
    const rows = catalog?.playlists ?? [];
    if (!q) return rows;
    return rows.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        String(p.id).includes(q),
    );
  }, [catalog, playlistFilter]);

  const togglePlan = useCallback((slug: string) => {
    setSelectedPlans((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const togglePlaylist = useCallback((id: number) => {
    setSelectedPlaylists((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllInGroup = useCallback(
    (group: string, on: boolean) => {
      const rows = plansByGroup.get(group) ?? [];
      setSelectedPlans((prev) => {
        const next = new Set(prev);
        for (const row of rows) {
          if (on) next.add(row.slug);
          else next.delete(row.slug);
        }
        return next;
      });
    },
    [plansByGroup],
  );

  const selectAllPlans = useCallback(
    (on: boolean) => {
      if (!catalog) return;
      setSelectedPlans(on ? new Set(catalog.plans.map((p) => p.slug)) : new Set());
    },
    [catalog],
  );

  const selectAllPlaylistsVisible = useCallback(
    (on: boolean) => {
      setSelectedPlaylists((prev) => {
        const next = new Set(prev);
        for (const row of filteredPlaylists) {
          if (on) next.add(row.id);
          else next.delete(row.id);
        }
        return next;
      });
    },
    [filteredPlaylists],
  );

  const onLookup = async () => {
    const e = email.trim();
    if (!e) return;
    setLookupBusy(true);
    setError("");
    setLookup(null);
    const data = await lookupAdminGrantEmail(e);
    setLookupBusy(false);
    if (!data) {
      setError("Lookup failed.");
      return;
    }
    setLookup(data);
  };

  const onGrant = async () => {
    const e = email.trim();
    if (!e) {
      setError("Enter an email address.");
      return;
    }
    if (selectedPlans.size === 0 && selectedPlaylists.size === 0) {
      setError("Select at least one plan or playlist.");
      return;
    }
    if (durationType === "days" && (!Number.isFinite(days) || days < 1)) {
      setError("Days must be at least 1.");
      return;
    }
    if (durationType === "custom" && !customExpiry.trim()) {
      setError("Pick a custom expiry date.");
      return;
    }

    setSubmitting(true);
    setError("");
    setResult(null);
    const expiresAt =
      durationType === "custom" && customExpiry ? new Date(customExpiry).toISOString() : null;
    const { ok, data } = await postAdminGrantAccess({
      email: e,
      plan_slugs: Array.from(selectedPlans),
      playlist_ids: Array.from(selectedPlaylists),
      duration_type: durationType,
      days: durationType === "days" ? days : null,
      expires_at: expiresAt,
      create_user_if_missing: true,
    });
    setSubmitting(false);
    if (!ok) {
      setError((data as AdminGrantResult)?.detail || "Grant failed.");
      return;
    }
    setResult(data);
    const refreshed = await lookupAdminGrantEmail(e);
    if (refreshed) setLookup(refreshed);
  };

  const planFilterLower = planFilter.trim().toLowerCase();
  const selectionCount = selectedPlans.size + selectedPlaylists.size;

  return (
    <section className="w-full">
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border bg-[#05070d]/92 p-[clamp(0.9rem,2vw,1.5rem)]",
          shell.border,
          shell.shadow,
        )}
      >
        <div className={cn("pointer-events-none absolute inset-0 opacity-55", shell.wash)} />

        <div className="relative z-[1] space-y-5">
          <header className="border-b border-cyan-300/20 pb-4">
            <p className="mb-1 text-[12px] font-bold uppercase tracking-[0.16em] text-cyan-200/75">
              Staff console · free trial unlocks
            </p>
            <h2
              className={`${DASHBOARD_HEADING_LIGHTNING} text-[clamp(1.25rem,1.4vw+0.85rem,1.75rem)] font-black uppercase tracking-[0.1em]`}
            >
              Grant access by email
            </h2>
            <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-slate-200/85 sm:text-[16px]">
              Unlock programs for any email at $0. Account is created if missing. Recipients stay normal
              members — not admins. Duration applies to Knight; packs and playlists stay lifetime.
            </p>
          </header>

          {catalogLoading ? (
            <div className="rounded-lg border border-cyan-300/25 bg-[#040a12]/85 px-4 py-10 text-center text-[15px] font-semibold uppercase tracking-[0.12em] text-cyan-100/70">
              Loading catalog…
            </div>
          ) : catalogError ? (
            <div className="rounded-lg border border-rose-400/45 bg-rose-950/50 px-4 py-3 text-[15px] text-rose-100">
              {catalogError}
            </div>
          ) : (
            <>
              {/* Step 1 — recipient */}
              <div className="relative overflow-hidden rounded-lg border border-cyan-300/45 bg-[#040a12]/88 p-4 shadow-[0_0_0_1px_rgba(34,211,238,0.2),0_0_18px_rgba(34,211,238,0.16)]">
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(360px_160px_at_0%_0%,rgba(34,211,238,0.16),transparent_65%)]" />
                <div className="relative z-[1]">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-[0.14em] text-cyan-300/80">Step 1</p>
                      <h3 className="text-[17px] font-black uppercase tracking-[0.08em] text-cyan-50 sm:text-[18px]">
                        Member email
                      </h3>
                    </div>
                    <span className="rounded-md border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.1em] text-cyan-100">
                      Creates account if new
                    </span>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
                    <label className="block min-w-0">
                      <span className="mb-1.5 block text-[13px] font-black uppercase tracking-[0.12em] text-cyan-100/90">
                        Email address
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(ev) => setEmail(ev.target.value)}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter") {
                            ev.preventDefault();
                            void onLookup();
                          }
                        }}
                        placeholder="member@example.com"
                        className="w-full rounded-md border border-cyan-200/30 bg-[#040710] px-3.5 py-3 text-[16px] text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70 focus:shadow-[0_0_0_1px_rgba(34,211,238,0.4),0_0_14px_rgba(34,211,238,0.22)]"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={onLookup}
                      disabled={lookupBusy || !email.trim()}
                      className="mt-auto inline-flex min-h-[48px] items-center justify-center rounded-md border border-sky-300/50 bg-sky-400/15 px-5 py-3 text-[14px] font-black uppercase tracking-[0.08em] text-sky-50 transition hover:bg-sky-400/25 disabled:opacity-40"
                    >
                      {lookupBusy ? "Checking…" : "Lookup"}
                    </button>
                    <button
                      type="button"
                      onClick={onGrant}
                      disabled={submitting || !email.trim() || selectionCount === 0}
                      className="mt-auto inline-flex min-h-[48px] items-center justify-center rounded-md border border-amber-300/55 bg-amber-400/20 px-5 py-3 text-[14px] font-black uppercase tracking-[0.08em] text-amber-50 shadow-[0_0_18px_rgba(251,191,36,0.18)] transition hover:bg-amber-400/30 disabled:opacity-40"
                    >
                      {submitting ? "Granting…" : "Grant access"}
                    </button>
                  </div>

                  {lookup ? (
                    <div
                      className={cn(
                        "mt-3 rounded-md border px-3.5 py-3 text-[14px] leading-relaxed sm:text-[15px]",
                        lookup.exists
                          ? "border-emerald-300/40 bg-emerald-950/40 text-emerald-50/95"
                          : "border-amber-300/40 bg-amber-950/35 text-amber-50/95",
                      )}
                    >
                      {lookup.exists ? (
                        <>
                          <span className="font-black text-emerald-200">Account found</span>
                          <span className="text-emerald-100/75">
                            {" "}
                            · #{lookup.user_id} · {lookup.username} · tier{" "}
                            {lookup.entitlement?.access_tier ?? "—"}
                            {lookup.entitlement?.money_mastery_lifetime ? " · Money Mastery" : ""}
                            {lookup.entitlement?.knight_subscription_expires_at
                              ? ` · Knight until ${lookup.entitlement.knight_subscription_expires_at}`
                              : ""}
                            {lookup.plan_slugs?.length
                              ? ` · ${lookup.plan_slugs.length} plan(s)`
                              : ""}
                            {lookup.playlist_ids?.length
                              ? ` · ${lookup.playlist_ids.length} playlist(s)`
                              : ""}
                          </span>
                        </>
                      ) : (
                        <span>
                          <span className="font-black text-amber-200">No account yet</span>
                          {" — "}
                          granting will create a normal member (OTP login still works later).
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Step 2 — duration */}
              <div className="relative overflow-hidden rounded-lg border border-fuchsia-300/45 bg-[#0a0412]/88 p-4 shadow-[0_0_0_1px_rgba(217,70,239,0.2),0_0_18px_rgba(217,70,239,0.14)]">
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(340px_150px_at_100%_0%,rgba(217,70,239,0.16),transparent_65%)]" />
                <div className="relative z-[1]">
                  <p className="text-[12px] font-black uppercase tracking-[0.14em] text-fuchsia-300/80">Step 2</p>
                  <h3 className="mb-1 text-[17px] font-black uppercase tracking-[0.08em] text-fuchsia-50 sm:text-[18px]">
                    Knight duration
                  </h3>
                  <p className="mb-3 text-[14px] text-slate-200/75">
                    Only applies when The Knight is selected. Other unlocks remain lifetime.
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="block">
                      <span className="mb-1.5 block text-[13px] font-black uppercase tracking-[0.12em] text-fuchsia-100/90">
                        Duration
                      </span>
                      <select
                        value={durationType}
                        onChange={(ev) => setDurationType(ev.target.value as AdminGrantDurationType)}
                        className="w-full rounded-md border border-fuchsia-200/30 bg-[#0b0614] px-3.5 py-3 text-[15px] text-slate-100 outline-none focus:border-fuchsia-300/70"
                      >
                        <option value="lifetime">Lifetime</option>
                        <option value="month">1 month</option>
                        <option value="days">Custom days</option>
                        <option value="custom">Custom end date</option>
                      </select>
                    </label>
                    {durationType === "days" ? (
                      <label className="block">
                        <span className="mb-1.5 block text-[13px] font-black uppercase tracking-[0.12em] text-fuchsia-100/90">
                          Days
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={3650}
                          value={days}
                          onChange={(ev) => setDays(Number(ev.target.value))}
                          className="w-full rounded-md border border-fuchsia-200/30 bg-[#0b0614] px-3.5 py-3 text-[15px] text-slate-100 outline-none focus:border-fuchsia-300/70"
                        />
                      </label>
                    ) : null}
                    {durationType === "custom" ? (
                      <label className="block sm:col-span-2">
                        <span className="mb-1.5 block text-[13px] font-black uppercase tracking-[0.12em] text-fuchsia-100/90">
                          Expires
                        </span>
                        <input
                          type="datetime-local"
                          value={customExpiry}
                          onChange={(ev) => setCustomExpiry(ev.target.value)}
                          className="w-full rounded-md border border-fuchsia-200/30 bg-[#0b0614] px-3.5 py-3 text-[15px] text-slate-100 outline-none focus:border-fuchsia-300/70"
                        />
                      </label>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Step 3 — plans */}
              <div className="relative overflow-hidden rounded-lg border border-amber-300/40 bg-[#110904]/88 p-4 shadow-[0_0_0_1px_rgba(251,191,36,0.18),0_0_18px_rgba(251,191,36,0.12)]">
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(480px_180px_at_50%_-10%,rgba(251,191,36,0.12),transparent_65%)]" />
                <div className="relative z-[1] space-y-3">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-[0.14em] text-amber-300/80">Step 3</p>
                      <h3 className="text-[17px] font-black uppercase tracking-[0.08em] text-amber-50 sm:text-[18px]">
                        Plans & packs
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => selectAllPlans(true)}
                        className="rounded-md border border-amber-300/45 bg-amber-400/15 px-3 py-2 text-[13px] font-black uppercase tracking-[0.08em] text-amber-50 transition hover:bg-amber-400/25"
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        onClick={() => selectAllPlans(false)}
                        className="rounded-md border border-white/20 bg-black/40 px-3 py-2 text-[13px] font-black uppercase tracking-[0.08em] text-slate-200 transition hover:bg-white/10"
                      >
                        Clear
                      </button>
                      <span className="rounded-md border border-amber-300/30 bg-black/35 px-2.5 py-1.5 text-[13px] font-bold text-amber-100/90">
                        {selectedPlans.size} selected
                      </span>
                    </div>
                  </div>

                  <input
                    type="search"
                    value={planFilter}
                    onChange={(ev) => setPlanFilter(ev.target.value)}
                    placeholder="Filter plans by name or slug…"
                    className="w-full rounded-md border border-amber-200/25 bg-[#0c0804] px-3.5 py-2.5 text-[15px] text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-300/60"
                  />

                  <div className="space-y-3">
                    {GROUP_ORDER.map((group) => {
                      const neon = GROUP_NEON[group] ?? DEFAULT_GROUP_NEON;
                      const rows = (plansByGroup.get(group) ?? []).filter((row) => {
                        if (!planFilterLower) return true;
                        return (
                          row.slug.includes(planFilterLower) ||
                          row.title.toLowerCase().includes(planFilterLower)
                        );
                      });
                      if (!rows.length) return null;
                      const open = expandedGroups.has(group);
                      const selectedInGroup = rows.filter((r) => selectedPlans.has(r.slug)).length;
                      return (
                        <div
                          key={group}
                          className={cn(
                            "overflow-hidden rounded-lg border bg-[#06080e]/90",
                            neon.border,
                            neon.glow,
                          )}
                        >
                          <div className="relative flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2.5">
                            <span className={cn("pointer-events-none absolute inset-0 opacity-80", neon.wash)} />
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedGroups((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(group)) next.delete(group);
                                  else next.add(group);
                                  return next;
                                })
                              }
                              className={cn(
                                "relative z-[1] text-[14px] font-black uppercase tracking-[0.1em] sm:text-[15px]",
                                neon.label,
                              )}
                            >
                              {open ? "▾" : "▸"} {GROUP_LABELS[group] || group}
                              <span className="ml-1.5 font-semibold opacity-70">
                                ({rows.length}
                                {selectedInGroup ? ` · ${selectedInGroup} on` : ""})
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => selectAllInGroup(group, true)}
                              className={cn(
                                "relative z-[1] ml-auto text-[12px] font-black uppercase tracking-[0.1em] underline-offset-2 hover:underline",
                                neon.label,
                              )}
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={() => selectAllInGroup(group, false)}
                              className="relative z-[1] text-[12px] font-bold uppercase tracking-[0.1em] text-slate-400 hover:text-slate-200"
                            >
                              None
                            </button>
                          </div>
                          {open ? (
                            <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2 xl:grid-cols-3">
                              {rows.map((row) => {
                                const checked = selectedPlans.has(row.slug);
                                return (
                                  <label
                                    key={row.slug}
                                    className={cn(
                                      "flex cursor-pointer items-start gap-3 rounded-md border border-transparent px-3 py-2.5 text-[14px] transition hover:bg-white/5 sm:text-[15px]",
                                      checked && neon.selected,
                                    )}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => togglePlan(row.slug)}
                                      className={cn("mt-1 h-4 w-4 shrink-0", neon.check)}
                                    />
                                    <span className="min-w-0">
                                      <span className="block font-semibold leading-snug text-slate-50">
                                        {row.title}
                                      </span>
                                      <span className="mt-0.5 block text-[12px] text-slate-400">{row.slug}</span>
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step 4 — playlists */}
              <div className="relative overflow-hidden rounded-lg border border-violet-300/45 bg-[#080414]/88 p-4 shadow-[0_0_0_1px_rgba(167,139,250,0.2),0_0_18px_rgba(167,139,250,0.14)]">
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(400px_160px_at_0%_0%,rgba(167,139,250,0.14),transparent_65%)]" />
                <div className="relative z-[1] space-y-3">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-[0.14em] text-violet-300/80">Step 4</p>
                      <h3 className="text-[17px] font-black uppercase tracking-[0.08em] text-violet-50 sm:text-[18px]">
                        Single playlists
                      </h3>
                      <p className="mt-1 text-[14px] text-slate-200/75">Optional — unlock individual programs one by one.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => selectAllPlaylistsVisible(true)}
                        className="rounded-md border border-violet-300/45 bg-violet-400/15 px-3 py-2 text-[13px] font-black uppercase tracking-[0.08em] text-violet-50 transition hover:bg-violet-400/25"
                      >
                        Select visible
                      </button>
                      <button
                        type="button"
                        onClick={() => selectAllPlaylistsVisible(false)}
                        className="rounded-md border border-white/20 bg-black/40 px-3 py-2 text-[13px] font-black uppercase tracking-[0.08em] text-slate-200 transition hover:bg-white/10"
                      >
                        Clear visible
                      </button>
                      <span className="rounded-md border border-violet-300/30 bg-black/35 px-2.5 py-1.5 text-[13px] font-bold text-violet-100/90">
                        {selectedPlaylists.size} selected
                      </span>
                    </div>
                  </div>

                  <input
                    type="search"
                    value={playlistFilter}
                    onChange={(ev) => setPlaylistFilter(ev.target.value)}
                    placeholder="Filter playlists by title, category, or id…"
                    className="w-full rounded-md border border-violet-200/25 bg-[#0a0614] px-3.5 py-2.5 text-[15px] text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-300/60"
                  />

                  <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto rounded-md border border-violet-300/20 bg-black/35 p-3 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredPlaylists.map((row) => {
                      const checked = selectedPlaylists.has(row.id);
                      return (
                        <label
                          key={row.id}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-md border border-transparent px-3 py-2.5 text-[14px] transition hover:bg-white/5 sm:text-[15px]",
                            checked && "border-violet-300/40 bg-violet-400/15",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePlaylist(row.id)}
                            className="mt-1 h-4 w-4 shrink-0 accent-violet-400"
                          />
                          <span className="min-w-0">
                            <span className="block font-semibold leading-snug text-slate-50">{row.title}</span>
                            <span className="mt-0.5 block text-[12px] text-slate-400">
                              #{row.id}
                              {row.category ? ` · ${row.category}` : ""}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                    {!filteredPlaylists.length ? (
                      <div className="col-span-full px-2 py-6 text-center text-[14px] text-slate-400">
                        No playlists match.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-rose-400/50 bg-rose-950/55 px-4 py-3 text-[15px] text-rose-100">
                  {error}
                </div>
              ) : null}

              {result ? (
                <div className="rounded-lg border border-emerald-300/45 bg-emerald-950/45 px-4 py-4 text-[15px] text-emerald-50 shadow-[0_0_20px_rgba(52,211,153,0.12)]">
                  <div className="mb-1 text-[14px] font-black uppercase tracking-[0.12em] text-emerald-200">
                    Grant complete
                  </div>
                  <div className="leading-relaxed">
                    {result.user_created ? "Created account · " : ""}
                    user #{result.user_id} ({result.username})
                    {result.summary
                      ? ` · ${result.summary.plans_granted} plan(s), ${result.summary.playlists_granted} playlist(s)`
                      : ""}
                  </div>
                  {result.knight_expires_at ? (
                    <div className="mt-1.5 text-[14px] text-emerald-100/75">
                      Knight expires: {result.knight_expires_at}
                    </div>
                  ) : null}
                  {result.entitlement ? (
                    <div className="mt-1 text-[14px] text-emerald-100/75">
                      Now: tier {result.entitlement.access_tier ?? "—"}
                      {result.entitlement.money_mastery_lifetime ? " · Money Mastery on" : ""}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Sticky summary */}
              <div className="sticky bottom-2 z-[2] flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-300/35 bg-[#05070d]/95 px-4 py-3 shadow-[0_0_24px_rgba(34,211,238,0.18)] backdrop-blur-md">
                <div className="text-[14px] text-slate-200 sm:text-[15px]">
                  <span className="font-black text-cyan-100">{selectionCount}</span> item
                  {selectionCount === 1 ? "" : "s"} ready
                  <span className="text-slate-400">
                    {" "}
                    ({selectedPlans.size} plans · {selectedPlaylists.size} playlists)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onGrant}
                  disabled={submitting || !email.trim() || selectionCount === 0}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-amber-300/55 bg-amber-400/20 px-5 py-2.5 text-[14px] font-black uppercase tracking-[0.08em] text-amber-50 transition hover:bg-amber-400/30 disabled:opacity-40"
                >
                  {submitting ? "Granting…" : "Grant access"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
