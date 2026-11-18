"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, Bell, CheckCircle2, Info, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { API_BASE_URL, notificationsApi } from "@/lib/api";
import { StompWsClient } from "@/lib/stompClient";
import { AppNotification } from "@/lib/types";

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  wsConnected: boolean;
  lastEventTick: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface ToastItem {
  key: string;
  notification: AppNotification;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastEventTick, setLastEventTick] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const clientRef = useRef<StompWsClient | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!user || !token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const [list, countRes] = await Promise.all([
        notificationsApi.list(),
        notificationsApi.unreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(countRes.unreadCount);
    } catch {
      // ignore transient network errors
    }
  }, [user, token]);

  const pushToast = useCallback((notif: AppNotification) => {
    const key = `${notif.id}-${Date.now()}`;
    setToasts((prev) => [{ key, notification: notif }, ...prev].slice(0, 4));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.key !== key));
    }, 6500);
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (!user || !token) {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      setWsConnected(false);
      return;
    }

    const wsUrl = API_BASE_URL.replace(/^http/i, "ws") + "/ws";
    const client = new StompWsClient(wsUrl, token, () => {
      setWsConnected(true);
    });

    const unsubUser = client.subscribe("/user/queue/notifications", (body) => {
      try {
        const incoming = JSON.parse(body) as AppNotification;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === incoming.id)) return prev;
          return [incoming, ...prev].slice(0, 40);
        });
        setUnreadCount((c) => c + 1);
        setLastEventTick((t) => t + 1);
        pushToast(incoming);
      } catch {
        // ignore parse errors
      }
    });

    let unsubAdmin: (() => void) | null = null;
    if (user.role === "ADMIN") {
      unsubAdmin = client.subscribe("/topic/admin/applications", () => {
        setLastEventTick((t) => t + 1);
      });
    }

    client.activate();
    clientRef.current = client;

    return () => {
      unsubUser();
      if (unsubAdmin) unsubAdmin();
      client.deactivate();
      clientRef.current = null;
      setWsConnected(false);
    };
  }, [user, token, pushToast]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        wsConnected,
        lastEventTick,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}

      {/* Real-time WebSocket Toast Stack */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0">
          {toasts.map(({ key, notification }) => {
            const tone =
              notification.type === "SUCCESS"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : notification.type === "ERROR"
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : notification.type === "WARNING"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-brand-200 bg-white text-slate-900";
            const Icon =
              notification.type === "SUCCESS"
                ? CheckCircle2
                : notification.type === "ERROR" || notification.type === "WARNING"
                ? AlertCircle
                : Info;

            return (
              <div
                key={key}
                className={`flex items-start gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur ${tone}`}
              >
                <Icon size={18} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1 text-xs">
                  <p className="font-bold">{notification.title}</p>
                  <p className="mt-1 opacity-90">{notification.message}</p>
                </div>
                <button
                  onClick={() => setToasts((prev) => prev.filter((t) => t.key !== key))}
                  className="opacity-60 hover:opacity-100"
                  aria-label="Close notification"
                >
                  <X size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }
  return ctx;
}
