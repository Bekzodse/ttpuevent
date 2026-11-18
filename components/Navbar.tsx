"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  CalendarRange,
  CheckCheck,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  UserCircle,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";
import { useNotifications } from "./NotificationProvider";
import { useThemeAndBranding } from "./ThemeAndBrandingProvider";
import UserAvatar from "./UserAvatar";
import BookingStatusBadge from "./BookingStatusBadge";
import { resolveAvatarUrl } from "@/lib/api";
import { Locale } from "@/lib/types";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "uz", label: "UZ" },
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const { theme, toggleTheme, branding } = useThemeAndBranding();
  const { notifications, unreadCount, wsConnected, markAsRead, markAllAsRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { href: "/", label: t.nav.home, icon: GraduationCap, show: true },
    { href: "/calendar", label: t.nav.calendar, icon: CalendarRange, show: true },
    { href: "/events", label: t.nav.events, icon: CalendarDays, show: true },
    { href: "/dashboard", label: t.nav.cabinet, icon: LayoutDashboard, show: !!user },
    {
      href: "/admin",
      label: t.nav.admin,
      icon: ShieldCheck,
      show: user?.role === "ADMIN",
    },
  ].filter((l) => l.show);

  const logoSrc = resolveAvatarUrl(branding.logoUrl);

  const handleLogout = () => {
    logout();
    setOpen(false);
    setNotifOpen(false);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight text-slate-900">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={branding.universityName}
              className="h-9 w-9 rounded-xl border border-slate-200 object-cover"
            />
          ) : (
            <span className="brand-gradient grid h-9 w-9 place-items-center rounded-xl text-white shadow-sm">
              <GraduationCap size={20} />
            </span>
          )}
          <div className="leading-tight">
            <span className="block max-w-[160px] truncate text-sm sm:max-w-[200px] sm:text-base">
              {branding.universityName}
            </span>
            <span className="block max-w-[180px] truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {branding.universitySubtitle}
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-brand-50 font-semibold text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="hidden items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-0.5 sm:flex">
            {LOCALES.map((loc) => (
              <button
                key={loc.code}
                type="button"
                onClick={() => setLocale(loc.code)}
                className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                  locale === loc.code
                    ? "brand-gradient text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2 text-slate-600 transition hover:text-brand-600"
            title={theme === "dark" ? t.nav.lightMode : t.nav.darkMode}
            aria-label={theme === "dark" ? t.nav.lightMode : t.nav.darkMode}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {user && (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative rounded-xl border border-slate-200/80 bg-slate-50/70 p-2 text-slate-600 transition hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-700"
                aria-label={t.nav.notifications}
                title={wsConnected ? t.nav.realtimeActive : t.nav.notifications}
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {wsConnected && (
                  <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </button>

              {notifOpen && (
                <div className="card absolute right-0 mt-2 w-80 overflow-hidden shadow-xl sm:w-96">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t.nav.notifications}</p>
                      <p className="text-[11px] text-slate-500">
                        {wsConnected ? t.nav.realtimeActive : t.nav.syncedServer}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                      >
                        <CheckCheck size={14} /> {t.nav.markAllRead}
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-xs text-slate-500">
                        {t.nav.noNotifications}
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.read) markAsRead(n.id);
                            setNotifOpen(false);
                            router.push(
                              user.role === "ADMIN"
                                ? "/admin?tab=applications"
                                : "/dashboard?tab=bookings"
                            );
                          }}
                          className={`cursor-pointer px-4 py-3 transition hover:bg-slate-50 ${
                            n.read ? "opacity-75" : "bg-brand-50/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-slate-900">{n.title}</p>
                            {!n.read && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-600">{n.message}</p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            {n.bookingStatus && <BookingStatusBadge status={n.bookingStatus} />}
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="hidden items-center gap-2 lg:flex">
            {loading ? (
              <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-100" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-2.5 py-1.5 transition hover:border-brand-200"
                >
                  <UserAvatar
                    firstName={user.firstName}
                    lastName={user.lastName}
                    profilePictureUrl={user.profilePictureUrl}
                    size="sm"
                    online={user.active}
                  />
                  <div className="text-left leading-tight">
                    <p className="text-xs font-bold text-slate-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500">
                      @{user.username} · {user.role}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-outline px-2.5 py-2 text-xs text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  title={t.nav.signOut}
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="btn-outline px-3 py-2 text-xs">
                  {t.nav.signIn}
                </Link>
                <Link href="/register" className="btn-primary px-3 py-2 text-xs">
                  {t.nav.register}
                </Link>
              </>
            )}
          </div>

          <button
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-2 border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
          <div className="flex items-center justify-between gap-2 pb-2 sm:hidden">
            <span className="text-xs font-semibold text-slate-500">Language</span>
            <div className="flex items-center gap-1">
              {LOCALES.map((loc) => (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => setLocale(loc.code)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                    locale === loc.code ? "brand-gradient text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>

          {user && (
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <UserAvatar
                firstName={user.firstName}
                lastName={user.lastName}
                profilePictureUrl={user.profilePictureUrl}
                size="md"
              />
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-500">
                  @{user.username} · {user.role}
                </p>
              </div>
            </div>
          )}

          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  active ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}

          <div className="border-t border-slate-100 pt-3">
            {user ? (
              <button
                onClick={handleLogout}
                className="btn-outline w-full justify-center text-rose-600 hover:bg-rose-50"
              >
                <LogOut size={16} /> {t.nav.signOut}
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setOpen(false)} className="btn-outline w-full">
                  <UserCircle size={16} /> {t.nav.signIn}
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="btn-primary w-full">
                  {t.nav.register}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
