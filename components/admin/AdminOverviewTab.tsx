"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { adminApi, adminApplicationsApi, ApiError } from "@/lib/api";
import { AdminActivityLog, AdminAnalytics, HallApplication } from "@/lib/types";
import { useNotifications } from "@/components/NotificationProvider";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import { ApplicationStatusDonut, MonthlyTrendsChart } from "./AdminCharts";

type AdminSection =
  | "dashboard"
  | "events"
  | "applications"
  | "users"
  | "analytics"
  | "notifications"
  | "activity"
  | "settings"
  | "equipment"
  | "cancellations";

export default function AdminOverviewTab({
  onNavigate,
  onBanner,
  refreshTick,
}: {
  onNavigate: (tab: AdminSection) => void;
  onBanner: (b: { type: "ok" | "err"; text: string }) => void;
  refreshTick: number;
}) {
  const { notifications, unreadCount, lastEventTick } = useNotifications();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [recentApps, setRecentApps] = useState<HallApplication[]>([]);
  const [recentLogs, setRecentLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, appsRes, logsRes] = await Promise.all([
        adminApi.getAnalytics(),
        adminApplicationsApi.list({ page: 0, size: 5 }),
        adminApi.getActivityLogs({ page: 0, size: 6 }),
      ]);
      setAnalytics(analyticsRes);
      setRecentApps(appsRes.content);
      setRecentLogs(logsRes.content);
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to load dashboard overview.",
      });
    } finally {
      setLoading(false);
    }
  }, [onBanner]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview, refreshTick, lastEventTick]);

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="card h-28 animate-pulse bg-white" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card h-72 animate-pulse bg-white" />
          <div className="card h-72 animate-pulse bg-white" />
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Total Events",
      value: analytics?.totalEvents ?? 0,
      sub: `${analytics?.publishedEvents ?? 0} published · ${analytics?.totalEventRegistrations ?? 0} registrations`,
      icon: CalendarDays,
      tone: "bg-brand-50 text-brand-600",
      target: "events" as AdminSection,
    },
    {
      label: "Total Users",
      value: analytics?.totalUsers ?? 0,
      sub: `${analytics?.activeAccounts ?? 0} active · ${analytics?.currentlyActiveUsers ?? 0} online`,
      icon: Users,
      tone: "bg-sky-50 text-sky-600",
      target: "users" as AdminSection,
    },
    {
      label: "Total Applications",
      value: analytics?.totalApplications ?? 0,
      sub: `${analytics?.confirmedApplications ?? 0} confirmed bookings`,
      icon: FileText,
      tone: "bg-indigo-50 text-indigo-600",
      target: "applications" as AdminSection,
    },
    {
      label: "Pending Applications",
      value: analytics?.pendingApplications ?? 0,
      sub: "Awaiting admin decision",
      icon: Clock,
      tone: "bg-amber-50 text-amber-600",
      target: "applications" as AdminSection,
    },
    {
      label: "Approved Applications",
      value: analytics?.approvedApplications ?? 0,
      sub: `${analytics?.approvalRatePercent ?? 0}% approval rate`,
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-600",
      target: "applications" as AdminSection,
    },
    {
      label: "Rejected Applications",
      value: analytics?.rejectedApplications ?? 0,
      sub: `${analytics?.rejectionRatePercent ?? 0}% rejection rate`,
      icon: XCircle,
      tone: "bg-rose-50 text-rose-600",
      target: "applications" as AdminSection,
    },
    {
      label: "Upcoming Events",
      value: analytics?.upcomingEvents ?? 0,
      sub: `${analytics?.draftEvents ?? 0} drafts · ${analytics?.cancelledEvents ?? 0} cancelled`,
      icon: CalendarClock,
      tone: "bg-purple-50 text-purple-600",
      target: "events" as AdminSection,
    },
    {
      label: "Completed Events",
      value: analytics?.completedEvents ?? 0,
      sub: `${analytics?.eventFillRatePercent ?? 0}% overall seat fill rate`,
      icon: CalendarCheck2,
      tone: "bg-teal-50 text-teal-600",
      target: "analytics" as AdminSection,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Action Bar */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Platform Control Center</h2>
          <p className="text-xs text-slate-500">
            Real-time metrics computed directly from database records.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate("events")}
            className="btn-primary px-3.5 py-2 text-xs"
          >
            <Plus size={15} /> Create Event
          </button>
          <button
            type="button"
            onClick={() => onNavigate("applications")}
            className="btn-outline px-3.5 py-2 text-xs"
          >
            Review Applications ({analytics?.pendingApplications ?? 0} pending)
          </button>
          <button
            type="button"
            onClick={() => onNavigate("analytics")}
            className="btn-outline px-3.5 py-2 text-xs"
          >
            <TrendingUp size={14} /> Full Analytics
          </button>
        </div>
      </div>

      {/* 8 Core KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, sub, icon: Icon, tone, target }) => (
          <button
            key={label}
            type="button"
            onClick={() => onNavigate(target)}
            className="card group p-5 text-left transition hover:-translate-y-0.5 hover:border-brand-200"
          >
            <div className="flex items-center justify-between">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}>
                <Icon size={21} />
              </span>
              <span className="text-3xl font-extrabold text-slate-900">{value}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-800">{label}</p>
              <ArrowRight
                size={14}
                className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
              />
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
          </button>
        ))}
      </div>

      {/* Interactive Charts Row */}
      {analytics && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="card p-5 lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Monthly Application Trends
                </h3>
                <p className="text-xs text-slate-500">
                  Submitted applications grouped by month and outcome
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("analytics")}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                Detailed View
              </button>
            </div>
            <MonthlyTrendsChart data={analytics.monthlyApplicationTrends} />
          </div>

          <div className="card p-5 lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-base font-extrabold text-slate-900">
                Application Status Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Approval rate: <strong>{analytics.approvalRatePercent}%</strong> · Rejection rate:{" "}
                <strong>{analytics.rejectionRatePercent}%</strong>
              </p>
            </div>
            <ApplicationStatusDonut
              breakdown={analytics.applicationStatusBreakdown}
              total={analytics.totalApplications}
            />
          </div>
        </div>
      )}

      {/* Recent Applications, Admin Activities & Notifications */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Applications */}
        <div className="card flex flex-col p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Recent Applications</h3>
              <p className="text-xs text-slate-500">Latest user submissions across campus halls</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("applications")}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              View All
            </button>
          </div>

          {recentApps.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No applications submitted yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentApps.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                        {app.applicationCode}
                      </span>
                      <p className="truncate font-bold text-slate-900">{app.eventName}</p>
                    </div>
                    <p className="mt-1 text-slate-500">
                      {app.applicantFirstName} {app.applicantLastName} · {app.hall.name} ·{" "}
                      {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <BookingStatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications & Activity Feed */}
        <div className="space-y-6">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
                <Bell size={15} className="text-brand-600" />
                Notifications
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={() => onNavigate("notifications")}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                Open
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">No notifications yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {notifications.slice(0, 3).map((n) => (
                  <li
                    key={n.id}
                    className={`rounded-xl border p-2.5 text-xs ${
                      n.read ? "border-slate-100 bg-slate-50/70" : "border-brand-200 bg-brand-50/40"
                    }`}
                  >
                    <p className="font-bold text-slate-900">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-slate-600">{n.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
                <Activity size={15} className="text-brand-600" />
                Recent Admin Activity
              </h3>
              <button
                type="button"
                onClick={() => onNavigate("activity")}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                Full Log
              </button>
            </div>
            {recentLogs.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">
                No administrative actions logged yet.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {recentLogs.slice(0, 4).map((log) => (
                  <li key={log.id} className="border-l-2 border-brand-200 pl-3 text-xs">
                    <p className="font-bold text-slate-800">{log.actionType.replace(/_/g, " ")}</p>
                    <p className="line-clamp-1 text-slate-600">
                      {log.details || log.targetLabel}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      @{log.actorUsername} · {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
