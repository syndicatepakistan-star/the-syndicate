"use client";

import { useId, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { cn } from "@/components/dashboard/dashboardPrimitives";

type CategoryColor = {
  fill: string;
  fillLight: string;
  fillDark: string;
  stroke: string;
  glow: string;
};

export const SYNDICATE_HOLO_CATEGORY_COLORS: Record<string, CategoryColor> = {
  business: {
    fill: "#00d4ff",
    fillLight: "#7df9ff",
    fillDark: "#0c4a6e",
    stroke: "#bae6fd",
    glow: "#22d3ee",
  },
  money: {
    fill: "#ffbf00",
    fillLight: "#ffe566",
    fillDark: "#92400e",
    stroke: "#fde68a",
    glow: "#fbbf24",
  },
  fitness: {
    fill: "#84cc16",
    fillLight: "#d9f99d",
    fillDark: "#365314",
    stroke: "#ecfccb",
    glow: "#a3e635",
  },
  power: {
    fill: "#f472f8",
    fillLight: "#f9a8ff",
    fillDark: "#86198f",
    stroke: "#f5d0fe",
    glow: "#e879f9",
  },
  grooming: {
    fill: "#a78bfa",
    fillLight: "#ddd6fe",
    fillDark: "#4c1d95",
    stroke: "#ede9fe",
    glow: "#8b5cf6",
  },
  personal: {
    fill: "#ff6b1a",
    fillLight: "#fdba74",
    fillDark: "#9a3412",
    stroke: "#fed7aa",
    glow: "#fb923c",
  },
};

function colorForCategory(key: string): CategoryColor {
  return (
    SYNDICATE_HOLO_CATEGORY_COLORS[key] ?? {
      fill: "#94a3b8",
      fillLight: "#e2e8f0",
      fillDark: "#334155",
      stroke: "#f1f5f9",
      glow: "#94a3b8",
    }
  );
}

type Slice = { key: string; name: string; value: number; pct: number };

export type SyndicateCategoryHologramPieProps = {
  categories: readonly string[];
  labels: Record<string, string>;
  totals: Record<string, number>;
  totalPoints: number;
  className?: string;
};

function SliceDetailFloater({
  slice,
  standby,
}: {
  slice: Slice | null;
  standby: boolean;
}) {
  if (!slice) return null;
  const c = colorForCategory(slice.key);
  return (
    <div
      className="syndicate-holo-pie__slice-detail"
      style={{
        borderColor: c.fill,
        boxShadow: `0 0 28px ${c.glow}55, 0 8px 32px rgba(0,0,0,0.85)`,
      }}
      role="status"
    >
      <span
        className="syndicate-holo-pie__slice-detail-swatch shrink-0 self-stretch"
        style={{ background: `linear-gradient(145deg, ${c.fillLight}, ${c.fill})` }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[13px] font-black uppercase tracking-[0.08em] text-white sm:text-[14px]">
          {slice.name}
        </div>
        <div className="mt-0.5 font-mono text-[10px] text-white/50 sm:text-[11px]">Mission category</div>
        <div className="mt-2 font-mono text-[15px] font-black tabular-nums sm:text-[16px]" style={{ color: c.fillLight }}>
          {standby ? "No points yet" : `${slice.value} pts · ${slice.pct}%`}
        </div>
      </div>
    </div>
  );
}

function renderSliceLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
  value?: number;
}) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0, value = 0 } = props;
  if (!value || percent < 0.05) return null;
  const RAD = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.08;
  const x = cx + radius * Math.cos(-midAngle * RAD);
  const y = cy + radius * Math.sin(-midAngle * RAD);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="font-mono text-[11px] font-black sm:text-[12px]"
      style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 4 }}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

function CategoryPieLayers({
  chartSlices,
  hasLiveData,
  standby,
  activeKey,
  onActiveKey,
  gradientPrefix,
}: {
  chartSlices: Slice[];
  hasLiveData: boolean;
  standby: boolean;
  activeKey: string | null;
  onActiveKey: (key: string | null) => void;
  gradientPrefix: string;
}) {
  const renderCells = (layer: "top" | "shadow") =>
    chartSlices.map((entry) => {
      const c = colorForCategory(entry.key);
      const dim = activeKey != null && activeKey !== entry.key;
      const fill =
        layer === "shadow"
          ? c.fillDark
          : standby
            ? c.fill
            : `url(#${gradientPrefix}-${entry.key})`;
      return (
        <Cell
          key={`${layer}-${entry.key}`}
          fill={fill}
          stroke={layer === "top" ? c.stroke : "#000"}
          strokeWidth={layer === "top" ? 2.5 : 1}
          opacity={layer === "shadow" ? 0.95 : dim ? 0.4 : standby ? 0.82 : 1}
          style={
            layer === "top"
              ? {
                  filter: dim
                    ? `drop-shadow(0 2px 4px rgba(0,0,0,0.7)) drop-shadow(0 0 6px ${c.glow})`
                    : `drop-shadow(0 4px 8px rgba(0,0,0,0.9)) drop-shadow(0 0 14px ${c.glow}) drop-shadow(0 0 26px ${c.glow})`,
                }
              : undefined
          }
        />
      );
    });

  return (
    <>
      <defs>
        {chartSlices.map((entry) => {
          const c = colorForCategory(entry.key);
          return (
            <linearGradient
              key={entry.key}
              id={`${gradientPrefix}-${entry.key}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={c.fillLight} />
              <stop offset="45%" stopColor={c.fill} />
              <stop offset="100%" stopColor={c.fillDark} />
            </linearGradient>
          );
        })}
      </defs>
      {/* 3D extrusion — darker layer shifted down-right */}
      <Pie
        data={chartSlices}
        dataKey="value"
        nameKey="name"
        cx="51%"
        cy="52.5%"
        innerRadius="48%"
        outerRadius="82%"
        paddingAngle={hasLiveData ? 3 : 2}
        cornerRadius={4}
        stroke="#000"
        strokeWidth={1}
        isAnimationActive={false}
      >
        {renderCells("shadow")}
      </Pie>
      <Pie
        data={chartSlices}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        innerRadius="48%"
        outerRadius="82%"
        paddingAngle={hasLiveData ? 3 : 2}
        cornerRadius={5}
        stroke="#0a0a0f"
        strokeWidth={2.5}
        isAnimationActive
        animationDuration={650}
        label={hasLiveData ? renderSliceLabel : false}
        labelLine={false}
        onMouseEnter={(_d, index) => onActiveKey(chartSlices[index]?.key ?? null)}
        onClick={(_d, index) => {
          const key = chartSlices[index]?.key ?? null;
          onActiveKey(activeKey === key ? null : key);
        }}
      >
        {renderCells("top")}
      </Pie>
    </>
  );
}

export function SyndicateCategoryHologramPie({
  categories,
  labels,
  totals,
  totalPoints,
  className,
}: SyndicateCategoryHologramPieProps) {
  const gradientPrefix = useId().replace(/:/g, "");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const allSlices = useMemo<Slice[]>(() => {
    const sum = totalPoints > 0 ? totalPoints : 0;
    return categories.map((key) => {
      const value = Math.max(0, totals[key] ?? 0);
      return {
        key,
        name: labels[key] ?? key,
        value,
        pct: sum > 0 ? Math.round((value / sum) * 100) : 0,
      };
    });
  }, [categories, labels, totals, totalPoints]);

  const hasLiveData = totalPoints > 0 && allSlices.some((s) => s.value > 0);
  const standby = !hasLiveData;

  const chartSlices = useMemo<Slice[]>(() => {
    if (hasLiveData) return allSlices.filter((s) => s.value > 0);
    return allSlices.map((s) => ({ ...s, value: 1, pct: 0 }));
  }, [allSlices, hasLiveData]);

  const topCategory = useMemo(() => {
    if (!hasLiveData) return null;
    return [...allSlices].sort((a, b) => b.value - a.value)[0] ?? null;
  }, [allSlices, hasLiveData]);

  return (
    <div
      className={cn(
        "syndicate-holo-pie syndicate-holo-pie--dystopia syndicate-stats-chart-panel syndicate-stats-neon-card syndicate-stats-neon-card--cyan",
        standby && "syndicate-holo-pie--standby",
        className
      )}
      aria-label="Category points distribution chart"
    >
      <div className="syndicate-holo-pie__alert-rail" aria-hidden />
      <div className="syndicate-holo-pie__grid" aria-hidden />
      <div className="syndicate-holo-pie__scanlines pointer-events-none" aria-hidden />
      <div className="syndicate-holo-pie__noise pointer-events-none" aria-hidden />

      <div className="relative z-[2]">
        <p className="syndicate-holo-pie__eyebrow font-mono text-[10px] font-black uppercase tracking-[0.32em] text-red-400/90">
          ◆ Sector scan
        </p>
        <h3 className="syndicate-holo-pie__title mt-1 text-[clamp(1rem,2.2vw+0.35rem,1.25rem)] font-black uppercase tracking-[0.14em] text-[#ffe566]">
          Points by mission category
        </h3>
        <p className="mt-2 max-w-[36rem] font-mono text-[12px] leading-relaxed text-cyan-100/75 sm:text-[14px]">
          <span className="text-red-300/80">VISUAL:</span> each neon slice = lifetime points in that category.
          Larger slice = more points. Center = your total.
        </p>

        {standby ? (
          <p className="syndicate-holo-pie__warn mt-2 border-l-4 border-red-500 bg-red-950/40 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-red-200/90">
            Preview — complete missions to activate live sector data
          </p>
        ) : topCategory ? (
          <p className="mt-2 font-mono text-[11px] text-amber-300">
            <span className="text-red-400/90">DOMINANT:</span>{" "}
            <span className="font-black text-amber-100">
              {topCategory.name} · {topCategory.value} pts ({topCategory.pct}%)
            </span>
          </p>
        ) : null}

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
          <div className="syndicate-holo-pie__viz relative mx-auto w-full max-w-[380px]">
            <div className="syndicate-holo-pie__viz-orbit pointer-events-none" aria-hidden>
              <span className="syndicate-holo-pie__viz-ring syndicate-holo-pie__viz-ring--a" />
              <span className="syndicate-holo-pie__viz-ring syndicate-holo-pie__viz-ring--b" />
            </div>

            <div className="syndicate-holo-pie__viz-halo" aria-hidden />
            <div className="syndicate-holo-pie__chart-3d">
              <div className="syndicate-holo-pie__chart-aura" aria-hidden />
              <div className="syndicate-holo-pie__chart-floor" aria-hidden />
              <div className="syndicate-holo-pie__chart-tilt">
                <div
                  className="syndicate-holo-pie__chart-frame relative aspect-square w-full"
                  onMouseLeave={() => setActiveKey(null)}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <CategoryPieLayers
                        chartSlices={chartSlices}
                        hasLiveData={hasLiveData}
                        standby={standby}
                        activeKey={activeKey}
                        onActiveKey={setActiveKey}
                        gradientPrefix={gradientPrefix}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="syndicate-holo-pie__chart-hub-mount">
                <div className="syndicate-holo-pie__hub-glow" aria-hidden />
                <div className="syndicate-holo-pie__hub-ring" aria-hidden />
                <div className="syndicate-holo-pie__hub" role="status">
                  <span className="syndicate-holo-pie__hub-label">Lifetime</span>
                  <span
                    className={cn(
                      "syndicate-holo-pie__hub-value",
                      hasLiveData ? "syndicate-holo-pie__hub-value--live" : "syndicate-holo-pie__hub-value--idle"
                    )}
                  >
                    {totalPoints}
                  </span>
                  <span
                    className={cn(
                      "syndicate-holo-pie__hub-sublabel",
                      hasLiveData ? "syndicate-holo-pie__hub-sublabel--live" : "syndicate-holo-pie__hub-sublabel--idle"
                    )}
                  >
                    pts total
                  </span>
                </div>
              </div>

              <div className="syndicate-holo-pie__slice-detail-mount pointer-events-none">
                <SliceDetailFloater
                  slice={allSlices.find((s) => s.key === activeKey) ?? null}
                  standby={standby}
                />
              </div>
            </div>

            <p className="syndicate-holo-pie__viz-caption mt-3 text-center font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-400/55 sm:text-[12px]">
              {hasLiveData ? "▸ Slice size = category points" : "▸ Equal preview · awaiting mission data"}
            </p>
          </div>

          <div className="min-w-0">
            <p className="syndicate-holo-pie__legend-head mb-3 border-b border-red-500/30 pb-2.5 font-mono text-[12px] font-black uppercase tracking-[0.2em] text-red-300/90 sm:text-[13px]">
              Category breakdown
            </p>
            <ul className="syndicate-holo-pie__legend space-y-2.5 sm:space-y-3" role="list">
              {allSlices.map((row) => {
                const c = colorForCategory(row.key);
                const isActive = activeKey === row.key;
                return (
                  <li
                    key={row.key}
                    className={cn(
                      "syndicate-holo-pie__legend-row flex items-center gap-4 border px-4 py-3.5 transition sm:px-5 sm:py-4",
                      row.value > 0 ? "bg-black/55" : "bg-black/35 opacity-75",
                      isActive && "syndicate-holo-pie__legend-row--active"
                    )}
                    style={{
                      borderColor: isActive ? c.fill : "rgba(255,255,255,0.1)",
                      boxShadow: isActive ? `0 0 22px ${c.glow}55, inset 3px 0 0 ${c.fill}` : `inset 3px 0 0 ${c.fill}88`,
                    }}
                    onMouseEnter={() => setActiveKey(row.key)}
                    onMouseLeave={() => setActiveKey(null)}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-sm border-2 border-black/80 sm:h-5 sm:w-5"
                      style={{
                        background: `linear-gradient(145deg, ${c.fillLight}, ${c.fill})`,
                        boxShadow: `0 0 12px ${c.glow}`,
                      }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[14px] font-black uppercase leading-tight tracking-[0.05em] text-white sm:text-[16px]">
                        {row.name}
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-white/50 sm:text-[12px]">Mission category</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className="font-mono text-[18px] font-black tabular-nums leading-none sm:text-[20px]"
                        style={{ color: c.fillLight }}
                      >
                        {row.value}
                      </div>
                      <div className="mt-1 font-mono text-[13px] font-bold tabular-nums text-white/55 sm:text-[14px]">
                        {row.pct}%
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
