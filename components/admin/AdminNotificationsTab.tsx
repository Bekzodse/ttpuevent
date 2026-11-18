"use client";

import { useState } from "react";
import { Bell, CheckCheck, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import { useNotifications } from "@/components/NotificationProvider";
import BookingStatusBadge from "@/components/BookingStatusBadge";

export default function AdminNotificationsTab({
  onGoToApplications,
}: {
  onGoToApplications: () => void;
}) {
  const {
    notifications,
    unreadCount,
    wsConnected,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const visible =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <Bell size={19} className="text-brand-600" />
            Admin Notifications
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white">
                {unreadCount} unread
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500">
            {wsConnected
              ? "Live WebSocket stream connected — new applications & receipts appear automatically."
              : "Synced with server notifications."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-lg px-3 py-1.5 font-semibold ${
                filter === "all" ? "bg-brand-50 text-brand-700" : "text-slate-600"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`rounded-lg px-3 py-1.5 font-semibold ${
                filter === "unread" ? "bg-brand-50 text-brand-700" : "text-slate-600"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <button
            type="button"
            onClick={refreshNotifications}
            className="btn-outline px-3 py-1.5 text-xs"
          >
            <RefreshCw size={14} /> Refresh
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="btn-primary px-3 py-1.5 text-xs"
            >
              <CheckCheck size={14} /> Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="card divide-y divide-slate-100 overflow-hidden">
        {visible.length === 0 ? (
          <div className="p-12 text-center">
            <Bell size={34} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-800">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              You will be notified here whenever users submit applications or upload payment receipts.
            </p>
          </div>
        ) : (
          visible.map((n) => (
            <div
              key={n.id}
              className={`flex flex-wrap items-start justify-between gap-4 p-4 transition ${
                n.read ? "bg-white" : "bg-brand-50/35"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {!n.read && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                  <p className="text-sm font-bold text-slate-900">{n.title}</p>
                  {n.bookingStatus && <BookingStatusBadge status={n.bookingStatus} />}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{n.message}</p>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  {new Date(n.createdAt).toLocaleString()}
                  {n.applicationCode ? ` · Ref: ${n.applicationCode}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => markAsRead(n.id)}
                    className="btn-outline px-2.5 py-1.5 text-xs"
                  >
                    <CheckCircle2 size={14} /> Mark Read
                  </button>
                )}
                {n.applicationId && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!n.read) markAsRead(n.id);
                      onGoToApplications();
                    }}
                    className="btn-primary px-2.5 py-1.5 text-xs"
                  >
                    <ExternalLink size={14} /> Open Applications
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
