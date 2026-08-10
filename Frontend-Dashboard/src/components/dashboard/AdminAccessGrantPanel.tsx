"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

function accentBorder(themeMode: ThemeMode) {
  if (themeMode === "danger") return "border-[rgba(255,92,92,0.42)]";
  if (themeMode === "cyberpunk") return "border-[rgba(196,126,255,0.44)]";
  return "border-[rgba(255,215,0,0.28)]";
}

export function AdminAccessGrantPanel({ themeMode }: { themeMode: ThemeMode }) {
  const accent = accentBorder(themeMode);
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
      durationType === "custom" && customExpiry
        ? new Date(customExpiry).toISOString()
        : null;
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

  return (
    <div className={cn("cut-frame-sm border bg-black/45 p-4 backdrop-blur-sm", accent)}>
      <div className="mb-1 text-[14px] font-extrabold uppercase tracking-[0.18em] text-white/82">
        Grant access by email
      </div>
      <p className="mb-4 max-w-3xl text-[12px] leading-relaxed text-white/55">
        Unlock Money Mastery, Knight, vault packs, Level 1 packs, individual courses, or single playlists
        for any email — account is created if missing. Amount is recorded as $0. Stripe checkout and login
        OTP are unchanged. Duration applies to Knight; other products stay lifetime like paid unlocks.
      </p>

      {catalogLoading ? (
        <div className="py-8 text-center text-[12px] uppercase tracking-[0.14em] text-white/45">
          Loading catalog…
        </div>
      ) : catalogError ? (
        <div className="rounded-md border border-red-500/40 bg-red-950/30 px-3 py-2 text-[13px] text-red-200">
          {catalogError}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto]">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="member@example.com"
                className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-[14px] text-white outline-none focus:border-[color:var(--gold)]"
              />
            </label>
            <button
              type="button"
              onClick={onLookup}
              disabled={lookupBusy || !email.trim()}
              className={cn(
                "mt-auto rounded-md border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/85 disabled:opacity-40",
                accent,
              )}
            >
              {lookupBusy ? "Checking…" : "Lookup"}
            </button>
            <button
              type="button"
              onClick={onGrant}
              disabled={submitting || !email.trim()}
              className="mt-auto rounded-md border border-[rgba(255,215,0,0.45)] bg-[rgba(255,215,0,0.12)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--gold)] disabled:opacity-40"
            >
              {submitting ? "Granting…" : "Grant access"}
            </button>
          </div>

          {lookup ? (
            <div className={cn("rounded-md border bg-black/40 px-3 py-2 text-[12px] text-white/75", accent)}>
              {lookup.exists ? (
                <>
                  <span className="font-semibold text-white/90">Account exists</span>
                  {" · "}
                  user #{lookup.user_id} ({lookup.username})
                  {" · "}
                  tier {lookup.entitlement?.access_tier ?? "—"}
                  {lookup.entitlement?.money_mastery_lifetime ? " · Money Mastery" : ""}
                  {lookup.entitlement?.knight_subscription_expires_at
                    ? ` · Knight until ${lookup.entitlement.knight_subscription_expires_at}`
                    : ""}
                  {lookup.plan_slugs?.length ? ` · ${lookup.plan_slugs.length} plan purchase(s)` : ""}
                  {lookup.playlist_ids?.length ? ` · ${lookup.playlist_ids.length} playlist(s)` : ""}
                </>
              ) : (
                <span>No account yet — granting will create one with an unusable password (OTP signup still works later).</span>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="block md:col-span-1">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                Duration (Knight)
              </span>
              <select
                value={durationType}
                onChange={(ev) => setDurationType(ev.target.value as AdminGrantDurationType)}
                className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-[13px] text-white outline-none"
              >
                <option value="lifetime">Lifetime</option>
                <option value="month">1 month</option>
                <option value="days">Custom days</option>
                <option value="custom">Custom end date</option>
              </select>
            </label>
            {durationType === "days" ? (
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                  Days
                </span>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={days}
                  onChange={(ev) => setDays(Number(ev.target.value))}
                  className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-[13px] text-white outline-none"
                />
              </label>
            ) : null}
            {durationType === "custom" ? (
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                  Expires
                </span>
                <input
                  type="datetime-local"
                  value={customExpiry}
                  onChange={(ev) => setCustomExpiry(ev.target.value)}
                  className="w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-[13px] text-white outline-none"
                />
              </label>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => selectAllPlans(true)}
              className="rounded border border-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/70"
            >
              Select all plans
            </button>
            <button
              type="button"
              onClick={() => selectAllPlans(false)}
              className="rounded border border-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/70"
            >
              Clear plans
            </button>
            <span className="text-[11px] text-white/45">
              {selectedPlans.size} plan(s) · {selectedPlaylists.size} playlist(s)
            </span>
            <input
              type="search"
              value={planFilter}
              onChange={(ev) => setPlanFilter(ev.target.value)}
              placeholder="Filter plans…"
              className="ml-auto min-w-[160px] flex-1 rounded-md border border-white/15 bg-black/50 px-2 py-1.5 text-[12px] text-white outline-none sm:max-w-[220px]"
            />
          </div>

          <div className="space-y-3">
            {GROUP_ORDER.map((group) => {
              const rows = (plansByGroup.get(group) ?? []).filter((row) => {
                if (!planFilterLower) return true;
                return (
                  row.slug.includes(planFilterLower) ||
                  row.title.toLowerCase().includes(planFilterLower)
                );
              });
              if (!rows.length) return null;
              const open = expandedGroups.has(group);
              return (
                <div key={group} className={cn("rounded-md border bg-black/35", accent)}>
                  <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
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
                      className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/80"
                    >
                      {open ? "▾" : "▸"} {GROUP_LABELS[group] || group} ({rows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => selectAllInGroup(group, true)}
                      className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--gold)]/80"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => selectAllInGroup(group, false)}
                      className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50"
                    >
                      None
                    </button>
                  </div>
                  {open ? (
                    <div className="grid max-h-56 grid-cols-1 gap-1 overflow-y-auto p-2 sm:grid-cols-2 xl:grid-cols-3">
                      {rows.map((row) => {
                        const checked = selectedPlans.has(row.slug);
                        return (
                          <label
                            key={row.slug}
                            className={cn(
                              "flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-[12px] text-white/80 hover:bg-white/5",
                              checked && "bg-[rgba(255,215,0,0.08)]",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePlan(row.slug)}
                              className="mt-0.5"
                            />
                            <span>
                              <span className="font-semibold text-white/90">{row.title}</span>
                              <span className="mt-0.5 block text-[10px] text-white/40">{row.slug}</span>
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

          <div className={cn("rounded-md border bg-black/35", accent)}>
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
                Single playlists
              </span>
              <button
                type="button"
                onClick={() => selectAllPlaylistsVisible(true)}
                className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--gold)]/80"
              >
                Select visible
              </button>
              <button
                type="button"
                onClick={() => selectAllPlaylistsVisible(false)}
                className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50"
              >
                Clear visible
              </button>
              <input
                type="search"
                value={playlistFilter}
                onChange={(ev) => setPlaylistFilter(ev.target.value)}
                placeholder="Filter playlists…"
                className="ml-auto min-w-[160px] flex-1 rounded-md border border-white/15 bg-black/50 px-2 py-1.5 text-[12px] text-white outline-none sm:max-w-[240px]"
              />
            </div>
            <div className="grid max-h-64 grid-cols-1 gap-1 overflow-y-auto p-2 sm:grid-cols-2 xl:grid-cols-3">
              {filteredPlaylists.map((row) => {
                const checked = selectedPlaylists.has(row.id);
                return (
                  <label
                    key={row.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-[12px] text-white/80 hover:bg-white/5",
                      checked && "bg-[rgba(255,215,0,0.08)]",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePlaylist(row.id)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="font-semibold text-white/90">{row.title}</span>
                      <span className="mt-0.5 block text-[10px] text-white/40">
                        #{row.id}
                        {row.category ? ` · ${row.category}` : ""}
                      </span>
                    </span>
                  </label>
                );
              })}
              {!filteredPlaylists.length ? (
                <div className="col-span-full px-2 py-4 text-[12px] text-white/45">No playlists match.</div>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-red-500/40 bg-red-950/30 px-3 py-2 text-[13px] text-red-200">
              {error}
            </div>
          ) : null}

          {result ? (
            <div className={cn("rounded-md border bg-black/40 px-3 py-3 text-[12px] text-white/80", accent)}>
              <div className="mb-1 font-bold uppercase tracking-[0.14em] text-[color:var(--gold)]">
                Grant complete
              </div>
              <div>
                {result.user_created ? "Created account · " : ""}
                user #{result.user_id} ({result.username})
                {result.summary
                  ? ` · ${result.summary.plans_granted} plan(s), ${result.summary.playlists_granted} playlist(s)`
                  : ""}
              </div>
              {result.knight_expires_at ? (
                <div className="mt-1 text-white/55">Knight expires: {result.knight_expires_at}</div>
              ) : null}
              {result.entitlement ? (
                <div className="mt-1 text-white/55">
                  Now: tier {result.entitlement.access_tier ?? "—"}
                  {result.entitlement.money_mastery_lifetime ? " · Money Mastery on" : ""}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
