"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Award,
  BarChart3,
  Building2,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";
import { AdminAnalytics } from "@/lib/types";
import {
  ApplicationStatusDonut,
  CategoryParticipationChart,
  MonthlyTrendsChart,
} from "./AdminCharts";

export default function AdminAnalyticsTab({
  onBanner,
  refreshTick,
}: {
  onBanner: (b: { type: "ok" | "err"; text: string }) => void;
  refreshTick: number;
}) {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      setData(await adminApi.getAnalytics());
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to load platform analytics.",
      });
    } finally {
      setLoading(false);
    }
  }, [onBanner]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics, refreshTick]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="card h-28 animate-pulse bg-white" />
          ))}
        </div>
        <div className="card h-80 animate-pulse bg-white" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-10 text-center text-sm text-slate-500">
        Unable to load analytics data.
      </div>
    );
  }

  const statSummary = [
    { label: "Total Events", value: data.totalEvents, icon: CalendarDays, tone: "bg-brand-50 text-brand-600" },
    { label: "Total Users", value: data.totalUsers, icon: Users, tone: "bg-sky-50 text-sky-600" },
    { label: "Total Applications", value: data.totalApplications, icon: FileText, tone: "bg-indigo-50 text-indigo-600" },
    { label: "Pending Applications", value: data.pendingApplications, icon: Clock, tone: "bg-amber-50 text-amber-600" },
    { label: "Approved Applications", value: data.approvedApplications, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Rejected Applications", value: data.rejectedApplications, icon: XCircle, tone: "bg-rose-50 text-rose-600" },
    { label: "Upcoming Events", value: data.upcomingEvents, icon: CalendarClock, tone: "bg-purple-50 text-purple-600" },
    { label: "Completed Events", value: data.completedEvents, icon: CalendarCheck2, tone: "bg-teal-50 text-teal-600" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statSummary.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="card flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
              <p className="mt-1.5 text-3xl font-extrabold text-slate-900">{value}</p>
            </div>
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}>
              <Icon size={22} />
            </span>
          </div>
        ))}
      </div>

      {/* Rates & Financial Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Approval vs Rejection Rates
            </span>
            <TrendingUp size={17} className="text-emerald-600" />
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-emerald-700">Approval Rate</span>
                <span className="text-slate-900">{data.approvalRatePercent}%</span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${data.approvalRatePercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-rose-700">Rejection Rate</span>
                <span className="text-slate-900">{data.rejectionRatePercent}%</span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-rose-500"
                  style={{ width: `${data.rejectionRatePercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600">Cancellation Rate</span>
                <span className="text-slate-900">{data.cancellationRatePercent}%</span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-500"
                  style={{ width: `${data.cancellationRatePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Event Participation Overview
            </span>
            <BarChart3 size={17} className="text-brand-600" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {data.totalEventRegistrations}
          </p>
          <p className="text-xs text-slate-500">
            Total event registrations across {data.totalEventCapacity} total seats
          </p>
          <div className="mt-4">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Overall Capacity Fill Rate</span>
              <span>{data.eventFillRatePercent}%</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, data.eventFillRatePercent)}%`,
                  background: "linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))",
                }}
              />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Confirmed Hall Revenue
            </span>
            <DollarSign size={17} className="text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            ${Number(data.totalConfirmedRevenue || 0).toFixed(2)}
          </p>
          <p className="text-xs text-slate-500">
            From {data.confirmedApplications} confirmed paid hall bookings
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-slate-50 p-2.5">
              <span className="text-slate-500">Active Users</span>
              <p className="font-extrabold text-slate-900">{data.activeAccounts}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5">
              <span className="text-slate-500">Published Events</span>
              <p className="font-extrabold text-slate-900">{data.publishedEvents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card p-6 lg:col-span-3">
          <h3 className="text-base font-extrabold text-slate-900">Monthly Application Trends</h3>
          <p className="mb-4 text-xs text-slate-500">
            Historical volume of submitted, approved, pending, and rejected applications
          </p>
          <MonthlyTrendsChart data={data.monthlyApplicationTrends} />
        </div>

        <div className="card p-6 lg:col-span-2">
          <h3 className="text-base font-extrabold text-slate-900">Application Status Distribution</h3>
          <p className="mb-4 text-xs text-slate-500">
            Hover over a slice or row to inspect exact counts
          </p>
          <ApplicationStatusDonut
            breakdown={data.applicationStatusBreakdown}
            total={data.totalApplications}
          />
        </div>
      </div>

      {/* Event Participation by Category & Most Popular Events */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-base font-extrabold text-slate-900">
            Event Participation by Category
          </h3>
          <p className="mb-4 text-xs text-slate-500">
            Registered participants compared to total available capacity per category
          </p>
          <CategoryParticipationChart items={data.eventParticipationByCategory} />
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-1.5 text-base font-extrabold text-slate-900">
                <Award size={18} className="text-amber-500" />
                Most Popular Events
              </h3>
              <p className="text-xs text-slate-500">Top campus events ranked by participant count</p>
            </div>
          </div>

          {data.popularEvents.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No events found.</p>
          ) : (
            <div className="space-y-3">
              {data.popularEvents.map((ev, index) => (
                <div
                  key={ev.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-brand-100 text-[11px] font-extrabold text-brand-700">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{ev.title}</p>
                        <p className="text-slate-500">
                          {ev.category} · {ev.date} · {ev.location}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 font-bold text-slate-800 shadow-sm">
                      {ev.registered}/{ev.capacity}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{ width: `${Math.min(100, ev.fillRatePercent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hall Utilization */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
            <Building2 size={18} className="text-brand-600" />
            Event Hall Utilization &amp; Revenue
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3">Hall Name</th>
                <th className="px-6 py-3">Total Applications</th>
                <th className="px-6 py-3">Confirmed Bookings</th>
                <th className="px-6 py-3 text-right">Confirmed Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.hallUtilization.map((h) => (
                <tr key={h.hallId} className="hover:bg-slate-50/70">
                  <td className="px-6 py-3.5 font-bold text-slate-900">{h.hallName}</td>
                  <td className="px-6 py-3.5 text-slate-700">{h.totalApplications}</td>
                  <td className="px-6 py-3.5 text-slate-700">{h.confirmedCount}</td>
                  <td className="px-6 py-3.5 text-right font-bold text-emerald-700">
                    ${Number(h.confirmedRevenue || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
