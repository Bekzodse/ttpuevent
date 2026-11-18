"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarRange,
  Globe,
  GraduationCap,
  MapPin,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import { useThemeAndBranding } from "@/components/ThemeAndBrandingProvider";
import { eventsApi, hallsApi } from "@/lib/api";
import { EventHall, UniversityEvent } from "@/lib/types";

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { branding } = useThemeAndBranding();
  const [events, setEvents] = useState<UniversityEvent[]>([]);
  const [halls, setHalls] = useState<EventHall[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    eventsApi
      .list()
      .then((data) => setEvents(data.filter((e) => e.status === "Upcoming").slice(0, 3)))
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
    hallsApi
      .list()
      .then((data) => setHalls(data))
      .catch(() => setHalls([]));
  }, []);

  const portalFeatures = [
    {
      icon: CalendarRange,
      title: t.home.features.calendarTitle,
      text: t.home.features.calendarText,
    },
    {
      icon: PackageCheck,
      title: t.home.features.equipmentTitle,
      text: t.home.features.equipmentText,
    },
    {
      icon: RotateCcw,
      title: t.home.features.cancellationTitle,
      text: t.home.features.cancellationText,
    },
    {
      icon: Globe,
      title: t.home.features.brandingTitle,
      text: t.home.features.brandingText,
    },
  ];

  return (
    <div className="space-y-16">
      <section className="brand-gradient relative overflow-hidden rounded-3xl px-6 py-14 text-white shadow-xl sm:px-12 sm:py-16">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] lg:block"
          style={{
            WebkitMaskImage: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.85) 26%, black 46%, black 100%)",
            maskImage: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.85) 26%, black 46%, black 100%)",
          }}
        >
          <img
            src="/ttpu-campus.jpg"
            alt={branding.universityName}
            className="h-full w-full object-cover object-center contrast-[1.04] saturate-[1.06]"
          />
        </div>
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur">
            <GraduationCap size={14} /> {branding.universityName} · {t.home.badge}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {t.home.heroTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
            {t.home.heroSubtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <>
                <Link href="/dashboard?tab=book" className="btn bg-white text-slate-900 hover:bg-slate-100">
                  {t.home.bookHall} <ArrowRight size={16} />
                </Link>
                <Link
                  href="/calendar"
                  className="btn border border-white/35 bg-white/15 text-white hover:bg-white/25"
                >
                  <CalendarRange size={16} /> {t.home.viewCalendar}
                </Link>
                <Link
                  href="/dashboard"
                  className="btn border border-white/30 text-white hover:bg-white/15"
                >
                  {t.home.openCabinet}
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20"
                  >
                    <ShieldCheck size={16} /> {t.home.openAdmin}
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/calendar" className="btn bg-white text-slate-900 hover:bg-slate-100">
                  <CalendarRange size={16} /> {t.home.viewCalendar} <ArrowRight size={16} />
                </Link>
                <Link
                  href="/register"
                  className="btn border border-white/35 bg-white/15 text-white hover:bg-white/25"
                >
                  {t.home.createAccount}
                </Link>
                <Link
                  href="/login"
                  className="btn border border-white/30 text-white hover:bg-white/15"
                >
                  {t.home.signInPortal}
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="relative z-10 mt-8 overflow-hidden rounded-2xl border border-white/20 shadow-lg lg:hidden">
          <img
            src="/ttpu-campus.jpg"
            alt={branding.universityName}
            className="h-52 w-full object-cover object-center sm:h-64"
          />
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {portalFeatures.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-6 transition hover:-translate-y-0.5">
            <span
              className="grid h-11 w-11 place-items-center rounded-xl text-white shadow-sm"
              style={{ backgroundColor: "var(--brand-primary)" }}
            >
              <Icon size={22} />
            </span>
            <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{text}</p>
          </div>
        ))}
      </section>

      {halls.length > 0 && (
        <section>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">{t.calendar.allHalls}</h2>
              <p className="mt-1 text-sm text-slate-500">{t.calendar.subtitle}</p>
            </div>
            <Link
              href="/calendar"
              className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
              style={{ color: "var(--brand-primary)" }}
            >
              {t.home.viewCalendar} <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {halls.map((h) => (
              <div key={h.id} className="card group flex flex-col overflow-hidden transition hover:-translate-y-1">
                <div className="relative h-48 w-full overflow-hidden bg-slate-200">
                  {h.imageUrl ? (
                    <img
                      src={h.imageUrl}
                      alt={h.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <Building2 size={36} />
                    </div>
                  )}
                  <span className="absolute right-3 top-3 rounded-full bg-slate-950/75 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                    ${h.hourlyRate}/hr
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-extrabold text-slate-900">{h.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin size={13} /> {h.building} · {h.floor} · {h.capacity} {t.calendar.seats}
                  </p>
                  {h.description && (
                    <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                      {h.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-2 pt-4">
                    <Link
                      href="/calendar"
                      className="btn-outline flex-1 py-2 text-xs"
                    >
                      {t.home.viewCalendar}
                    </Link>
                    <Link
                      href={user ? `/dashboard?tab=book&hallId=${h.id}` : "/login"}
                      className="btn-primary flex-1 py-2 text-xs"
                    >
                      {t.home.bookHall}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">{t.home.upcomingTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{t.home.upcomingSubtitle}</p>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
            style={{ color: "var(--brand-primary)" }}
          >
            {t.home.viewAllEvents} <ArrowRight size={15} />
          </Link>
        </div>

        {loadingEvents ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card h-64 animate-pulse bg-white p-6" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-500">
            <Link href="/events" className="font-semibold text-brand-600 hover:underline">
              {t.home.exploreEvents}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => {
              const pct = Math.min(Math.round((e.registered / e.capacity) * 100), 100);
              return (
                <Link
                  key={e.id}
                  href={`/events/${e.id}`}
                  className="card group flex flex-col overflow-hidden transition hover:-translate-y-1"
                >
                  <div className={`relative h-28 bg-gradient-to-br ${e.gradient}`}>
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {e.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-brand-700">
                      {e.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500">
                      {e.date} · {e.time} · {e.location}
                    </p>
                    <div className="mt-auto pt-4">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Users size={13} /> {e.registered}/{e.capacity}
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
