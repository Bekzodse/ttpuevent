"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Package,
  RefreshCw,
  RotateCcw,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import { useNotifications } from "@/components/NotificationProvider";
import UserAvatar from "@/components/UserAvatar";
import AdminApplicationsTab from "@/components/AdminApplicationsTab";
import AdminEquipmentTab from "@/components/AdminEquipmentTab";
import AdminCancellationsTab from "@/components/AdminCancellationsTab";
import AdminOverviewTab from "@/components/admin/AdminOverviewTab";
import AdminEventsTab from "@/components/admin/AdminEventsTab";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminAnalyticsTab from "@/components/admin/AdminAnalyticsTab";
import AdminNotificationsTab from "@/components/admin/AdminNotificationsTab";
import AdminActivityLogsTab from "@/components/admin/AdminActivityLogsTab";
import AdminSettingsTab from "@/components/admin/AdminSettingsTab";

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { unreadCount, refreshNotifications } = useNotifications();

  const [section, setSection] = useState<AdminSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const qTab = new URLSearchParams(window.location.search).get("tab");
      if (
        qTab === "dashboard" ||
        qTab === "events" ||
        qTab === "applications" ||
        qTab === "users" ||
        qTab === "analytics" ||
        qTab === "notifications" ||
        qTab === "activity" ||
        qTab === "settings" ||
        qTab === "equipment" ||
        qTab === "cancellations"
      ) {
        setSection(qTab);
      } else if (qTab === "branding") {
        setSection("settings");
      }
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== "ADMIN")) {
      router.replace(currentUser ? "/dashboard" : "/login");
    }
  }, [authLoading, currentUser, router]);

  if (authLoading || !currentUser || currentUser.role !== "ADMIN") {
    return <div className="card h-96 animate-pulse bg-white" />;
  }

  const navigate = (next: AdminSection) => {
    setSection(next);
    setSidebarOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const primaryNav: { id: AdminSection; label: string; icon: typeof LayoutDashboard; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "events", label: "Events Management", icon: CalendarDays },
    { id: "applications", label: "Applications", icon: ClipboardList },
    { id: "users", label: "User Management", icon: Users },
    { id: "analytics", label: "Statistics & Analytics", icon: BarChart3 },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { id: "activity", label: "Activity Logs", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const operationsNav: { id: AdminSection; label: string; icon: typeof Package }[] = [
    { id: "equipment", label: "Equipment Inventory", icon: Package },
    { id: "cancellations", label: "Cancellations & Refunds", icon: RotateCcw },
  ];

  const activeTitle =
    [...primaryNav, ...operationsNav].find((i) => i.id === section)?.label || "Admin Panel";

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="brand-gradient grid h-9 w-9 place-items-center rounded-xl text-white shadow-sm">
              <ShieldCheck size={18} />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-slate-900">Admin Console</p>
              <p className="text-[11px] font-medium text-slate-400">UEMS Governance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-1">
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Administration
          </p>
          {primaryNav.map(({ id, label, icon: Icon, badge }) => {
            const active = section === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={17} />
                  <span>{label}</span>
                </span>
                {typeof badge === "number" && badge > 0 && (
                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <nav className="space-y-1 border-t border-slate-100 pt-4">
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Hall Operations
          </p>
          {operationsNav.map(({ id, label, icon: Icon }) => {
            const active = section === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={17} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-6 flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-3">
        <UserAvatar
          firstName={currentUser.firstName}
          lastName={currentUser.lastName}
          profilePictureUrl={currentUser.profilePictureUrl}
          size="sm"
          online={true}
        />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-xs font-bold text-slate-900">
            {currentUser.firstName} {currentUser.lastName}
          </p>
          <p className="truncate text-[10px] font-medium text-slate-500">
            @{currentUser.username} · ADMIN
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Mobile / Tablet Slide-over Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="card relative z-10 h-full w-72 overflow-y-auto rounded-none rounded-r-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="card sticky top-20 hidden w-64 shrink-0 overflow-hidden lg:block">
        {sidebarContent}
      </aside>

      {/* Main Workspace */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="btn-outline px-2.5 py-2 lg:hidden"
              aria-label="Open admin menu"
            >
              <Menu size={18} />
            </button>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-700">
                <ShieldCheck size={13} /> {t.admin.badge}
              </span>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                {activeTitle}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setRefreshTick((n) => n + 1);
              refreshNotifications();
            }}
            className="btn-outline text-xs"
          >
            <RefreshCw size={15} /> {t.admin.refresh}
          </button>
        </div>

        {/* Feedback Banner */}
        {banner && (
          <div
            className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
              banner.type === "ok"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {banner.type === "ok" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
              <span>{banner.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="text-current opacity-70 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Active View */}
        {section === "dashboard" && (
          <AdminOverviewTab
            onNavigate={navigate}
            onBanner={setBanner}
            refreshTick={refreshTick}
          />
        )}
        {section === "events" && (
          <AdminEventsTab onBanner={setBanner} refreshTick={refreshTick} />
        )}
        {section === "applications" && (
          <AdminApplicationsTab onBanner={setBanner} refreshTick={refreshTick} />
        )}
        {section === "users" && (
          <AdminUsersTab
            currentUserId={currentUser.id}
            onBanner={setBanner}
            refreshTick={refreshTick}
          />
        )}
        {section === "analytics" && (
          <AdminAnalyticsTab onBanner={setBanner} refreshTick={refreshTick} />
        )}
        {section === "notifications" && (
          <AdminNotificationsTab onGoToApplications={() => navigate("applications")} />
        )}
        {section === "activity" && (
          <AdminActivityLogsTab onBanner={setBanner} refreshTick={refreshTick} />
        )}
        {section === "settings" && <AdminSettingsTab onBanner={setBanner} />}
        {section === "equipment" && <AdminEquipmentTab onBanner={setBanner} />}
        {section === "cancellations" && <AdminCancellationsTab onBanner={setBanner} />}
      </div>
    </div>
  );
}
