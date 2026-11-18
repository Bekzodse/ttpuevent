"use client";

import { useState } from "react";
import { AdminAnalytics } from "@/lib/types";

const STATUS_COLORS: Record<string, { hex: string; bg: string; text: string }> = {
  CONFIRMED: { hex: "#10b981", bg: "bg-emerald-500", text: "text-emerald-700" },
  APPROVED: { hex: "#6366f1", bg: "bg-indigo-500", text: "text-indigo-700" },
  PENDING: { hex: "#f59e0b", bg: "bg-amber-500", text: "text-amber-700" },
  REJECTED: { hex: "#f43f5e", bg: "bg-rose-500", text: "text-rose-700" },
  CANCELLED: { hex: "#64748b", bg: "bg-slate-500", text: "text-slate-700" },
  EXPIRED: { hex: "#94a3b8", bg: "bg-slate-400", text: "text-slate-600" },
};

export function MonthlyTrendsChart({
  data,
}: {
  data: AdminAnalytics["monthlyApplicationTrends"];
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center text-sm text-slate-400">
        No monthly application data available yet.
      </div>
    );
  }

  const maxTotal = Math.max(1, ...data.map((d) => d.total));
  const activeItem = hoveredIdx !== null ? data[hoveredIdx] : data[data.length - 1];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Approved
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Pending
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> Rejected
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-400" /> Cancelled
          </span>
        </div>

        {activeItem && (
          <div className="rounded-lg bg-slate-50 px-2.5 py-1 font-medium text-slate-700">
            <span className="font-bold text-slate-900">{activeItem.label}:</span>{" "}
            {activeItem.total} total ({activeItem.approved} approved · {activeItem.pending} pending ·{" "}
            {activeItem.rejected} rejected)
          </div>
        )}
      </div>

      <div className="grid h-56 grid-cols-6 items-end gap-2 sm:gap-4 pt-4" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
        {data.map((item, idx) => {
          const totalH = Math.max(4, Math.round((item.total / maxTotal) * 100));
          const appH = item.total > 0 ? Math.round((item.approved / item.total) * 100) : 0;
          const penH = item.total > 0 ? Math.round((item.pending / item.total) * 100) : 0;
          const rejH = item.total > 0 ? Math.round((item.rejected / item.total) * 100) : 0;
          const canH = Math.max(0, 100 - appH - penH - rejH);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={item.month}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="group flex h-full cursor-pointer flex-col items-center justify-end gap-1.5"
            >
              <span className="text-[11px] font-bold text-slate-700 opacity-85 group-hover:opacity-100">
                {item.total}
              </span>
              <div className="flex h-40 w-full max-w-[44px] items-end justify-center rounded-t-xl bg-slate-100/80 p-1 transition group-hover:bg-slate-200/70">
                {item.total > 0 ? (
                  <div
                    className={`flex w-full flex-col-reverse overflow-hidden rounded-lg transition-all duration-300 ${
                      isHovered ? "ring-2 ring-brand-500/40" : ""
                    }`}
                    style={{ height: `${totalH}%` }}
                  >
                    {item.approved > 0 && (
                      <div className="w-full bg-emerald-500" style={{ height: `${appH}%` }} />
                    )}
                    {item.pending > 0 && (
                      <div className="w-full bg-amber-500" style={{ height: `${penH}%` }} />
                    )}
                    {item.rejected > 0 && (
                      <div className="w-full bg-rose-500" style={{ height: `${rejH}%` }} />
                    )}
                    {item.cancelled > 0 && (
                      <div className="w-full bg-slate-400" style={{ height: `${canH}%` }} />
                    )}
                  </div>
                ) : (
                  <div className="h-1 w-full rounded bg-slate-300/60" />
                )}
              </div>
              <span className="truncate text-[11px] font-medium text-slate-500">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ApplicationStatusDonut({
  breakdown,
  total,
}: {
  breakdown: AdminAnalytics["applicationStatusBreakdown"];
  total: number;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const nonZero = breakdown.filter((b) => b.count > 0);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 144 144" className="h-full w-full -rotate-90">
          <circle
            cx="72"
            cy="72"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-slate-100"
            strokeWidth="18"
          />
          {total > 0 &&
            nonZero.map((item) => {
              const fraction = item.count / total;
              const dash = fraction * circumference;
              const offset = -cumulative * circumference;
              cumulative += fraction;
              const color = STATUS_COLORS[item.status]?.hex || "#6366f1";
              const isHov = hovered === item.status;

              return (
                <circle
                  key={item.status}
                  cx="72"
                  cy="72"
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHov ? "21" : "18"}
                  strokeDasharray={`${dash} ${circumference}`}
                  strokeDashoffset={offset}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHovered(item.status)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-extrabold text-slate-900">
            {hovered
              ? breakdown.find((b) => b.status === hovered)?.count ?? total
              : total}
          </span>
          <span className="max-w-[84px] truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {hovered
              ? breakdown.find((b) => b.status === hovered)?.label
              : "Total Apps"}
          </span>
        </div>
      </div>

      <div className="w-full flex-1 space-y-2.5">
        {breakdown.map((item) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const tone = STATUS_COLORS[item.status]?.bg || "bg-indigo-500";
          return (
            <div
              key={item.status}
              onMouseEnter={() => setHovered(item.status)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer rounded-lg p-1.5 transition hover:bg-slate-50"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className={`h-2.5 w-2.5 rounded-full ${tone}`} />
                  {item.label}
                </span>
                <span className="font-bold text-slate-900">
                  {item.count} <span className="font-normal text-slate-400">({pct}%)</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CategoryParticipationChart({
  items,
}: {
  items: AdminAnalytics["eventParticipationByCategory"];
}) {
  if (!items || items.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        No event participation records yet.
      </div>
    );
  }

  const maxCap = Math.max(1, ...items.map((i) => Math.max(i.totalCapacity, i.totalRegistered)));

  return (
    <div className="space-y-3.5">
      {items.map((item) => {
        const regWidth = Math.min(100, Math.round((item.totalRegistered / maxCap) * 100));
        const capWidth = Math.min(100, Math.round((item.totalCapacity / maxCap) * 100));
        return (
          <div key={item.category} className="space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-800">
                {item.category}{" "}
                <span className="font-normal text-slate-400">({item.eventCount} events)</span>
              </span>
              <span className="font-semibold text-slate-700">
                {item.totalRegistered} / {item.totalCapacity} seats ({item.fillRatePercent}%)
              </span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-slate-200"
                style={{ width: `${capWidth}%` }}
              />
              <div
                className="relative h-full rounded-full transition-all duration-500"
                style={{
                  width: `${regWidth}%`,
                  background: "linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
