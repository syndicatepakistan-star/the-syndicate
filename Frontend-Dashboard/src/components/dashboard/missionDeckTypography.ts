/**
 * Typography for Goals & Milestones / mission deck — aligned with Syndicate snapshot
 * on dashboard home (`SyndicateMissionsSnapshotCard`).
 */
export const DECK_TYPO = {
  /** Section titles: Missions, Notes, Browse by day */
  sectionTitle:
    "font-mono text-[clamp(1.05rem,2vw+0.55rem,1.45rem)] font-black uppercase tracking-[0.07em]",
  sectionTitleGold:
    "font-mono text-[clamp(1.05rem,2vw+0.55rem,1.45rem)] font-black uppercase tracking-[0.07em] text-[color:var(--goals-milestones-gold)]/95 drop-shadow-[0_0_20px_rgba(250,204,21,0.2)]",
  /** Column / sub-panel titles: Active missions, Note library, Reader */
  columnTitleGold:
    "font-mono text-[clamp(0.82rem,0.55vw+0.68rem,0.98rem)] font-black uppercase tracking-[0.18em] text-[color:var(--goals-milestones-gold)] [text-shadow:0_0_14px_rgba(255,215,0,0.35)]",
  columnTitleCyan:
    "font-mono text-[clamp(0.82rem,0.55vw+0.68rem,0.98rem)] font-black uppercase tracking-[0.18em] text-cyan-200/92 [text-shadow:0_0_14px_rgba(34,211,238,0.35)]",
  columnTitleAmber:
    "font-mono text-[clamp(0.82rem,0.55vw+0.68rem,0.98rem)] font-black uppercase tracking-[0.18em] text-amber-200/88 [text-shadow:0_0_14px_rgba(251,191,36,0.32)]",
  columnTitleRose:
    "font-mono text-[clamp(0.82rem,0.55vw+0.68rem,0.98rem)] font-black uppercase tracking-[0.18em] text-rose-200/95 [text-shadow:0_0_14px_rgba(251,113,133,0.32)]",
  columnTitleEmerald:
    "font-mono text-[clamp(0.82rem,0.55vw+0.68rem,0.98rem)] font-black uppercase tracking-[0.18em] text-emerald-200/95 [text-shadow:0_0_14px_rgba(52,211,153,0.32)]",
  columnTitleFuchsia:
    "font-mono text-[clamp(0.82rem,0.55vw+0.68rem,0.98rem)] font-black uppercase tracking-[0.18em] text-fuchsia-200/95 [text-shadow:0_0_14px_rgba(217,70,239,0.32)]",
  /** Body copy, help text, descriptions */
  body: "text-[clamp(0.82rem,1vw+0.62rem,1.02rem)] font-medium leading-relaxed text-neutral-200/90",
  bodyMuted: "text-[clamp(0.82rem,1vw+0.62rem,1.02rem)] font-medium leading-relaxed text-neutral-300/88",
  /** Form labels */
  labelGold:
    "font-mono text-[clamp(0.78rem,0.45vw+0.68rem,0.92rem)] font-extrabold uppercase tracking-[0.16em] text-[color:var(--goals-milestones-gold)]",
  labelFuchsia:
    "font-mono text-[clamp(0.78rem,0.45vw+0.68rem,0.92rem)] font-extrabold uppercase tracking-[0.16em] text-fuchsia-200/95",
  /** Inputs / search fields */
  input:
    "text-[clamp(0.95rem,0.85vw+0.72rem,1.05rem)] font-medium leading-relaxed",
  /** List row titles */
  listTitle: "text-[clamp(1rem,0.9vw+0.78rem,1.12rem)] font-bold leading-snug tracking-tight text-neutral-50",
  /** Reader body */
  readerBody:
    "text-[clamp(0.95rem,0.9vw+0.75rem,1.05rem)] font-normal leading-[1.65] text-neutral-100/92 md:leading-relaxed",
  /** Empty states */
  emptyPrimary: "text-[clamp(0.9rem,0.95vw+0.65rem,1.02rem)] font-semibold leading-relaxed",
  emptySecondary: "text-[clamp(0.82rem,0.85vw+0.62rem,0.98rem)] font-medium leading-relaxed",
  /** Buttons (create mission, save note, sort) */
  btn: "text-[clamp(0.72rem,0.35vw+0.65rem,0.85rem)] font-black uppercase tracking-[0.14em]",
  /** Pagination / meta */
  meta: "text-[clamp(0.78rem,0.5vw+0.62rem,0.9rem)] font-semibold leading-snug",
  /** Due date lines in mission rows */
  dueLine: "text-[clamp(0.82rem,0.75vw+0.62rem,0.95rem)] font-medium leading-snug text-neutral-200/92",
} as const;
