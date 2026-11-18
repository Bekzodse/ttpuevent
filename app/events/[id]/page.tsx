"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Ticket,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import { ApiError, eventsApi } from "@/lib/api";
import { UniversityEvent } from "@/lib/types";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();

  const [event, setEvent] = useState<UniversityEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    eventsApi
      .get(params.id)
      .then(setEvent)
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [params.id, user]);

  if (loading) {
    return <div className="card h-96 animate-pulse bg-white" />;
  }

  if (!event) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">{t.events.notFoundTitle}</h1>
        <p className="mt-2 text-sm text-slate-500">{t.events.notFoundDesc}</p>
        <Link href="/events" className="btn-primary mt-5">
          {t.events.backToEvents}
        </Link>
      </div>
    );
  }

  const left = Math.max(0, event.capacity - event.registered);
  const percent = Math.min(100, Math.round((event.registered / event.capacity) * 100));
  const closed = event.status === "Completed" || left <= 0;

  const categoryLabel =
    event.category === "Academic"
      ? t.events.catAcademic
      : event.category === "Technology"
      ? t.events.catTechnology
      : event.category === "Career"
      ? t.events.catCareer
      : event.category === "Sports"
      ? t.events.catSports
      : event.category === "Cultural"
      ? t.events.catCultural
      : event.category === "Arts & Media"
      ? t.events.catArts
      : event.category;

  const handleToggleRegistration = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const updated = event.userRegistered
        ? await eventsApi.unregister(event.id)
        : await eventsApi.register(event.id);
      setEvent(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update registration.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Link
        href="/events"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft size={16} /> {t.events.backToEvents}
      </Link>

      <div className="card overflow-hidden">
        <div className={`h-48 bg-gradient-to-br ${event.gradient} p-6 sm:h-56`}>
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700">
            {categoryLabel}
          </span>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-extrabold text-slate-900">{event.title}</h1>
            <h2 className="mt-6 text-lg font-bold text-slate-900">{t.events.aboutEvent}</h2>
            <p className="mt-2 leading-relaxed text-slate-600">{event.description}</p>
          </div>

          <aside className="space-y-5 rounded-2xl bg-slate-50 p-5">
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-3">
                <CalendarDays size={18} className="text-brand-600" /> {event.date}
              </li>
              <li className="flex items-center gap-3">
                <Clock size={18} className="text-brand-600" /> {event.time}
              </li>
              <li className="flex items-center gap-3">
                <MapPin size={18} className="text-brand-600" /> {event.location}
              </li>
              <li className="flex items-center gap-3">
                <UserIcon size={18} className="text-brand-600" /> {event.organizer}
              </li>
              <li className="flex items-center gap-3">
                <Users size={18} className="text-brand-600" /> {event.registered}/{event.capacity}{" "}
                {t.events.participants}
              </li>
            </ul>

            <div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {left > 0 ? `${left} ${t.events.seatsRemaining}` : t.events.eventFull}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            {event.userRegistered ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 size={18} /> {t.events.youAreRegistered}
                </div>
                <button
                  onClick={handleToggleRegistration}
                  disabled={busy}
                  className="btn-outline w-full text-xs text-rose-600 hover:bg-rose-50"
                >
                  {busy ? t.events.processing : t.events.cancelRegistration}
                </button>
              </div>
            ) : (
              <button
                onClick={handleToggleRegistration}
                disabled={busy || closed}
                className="btn-primary w-full"
              >
                <Ticket size={18} />
                {closed
                  ? event.status === "Completed"
                    ? t.events.eventEnded
                    : t.events.noSeatsLeft
                  : user
                  ? busy
                    ? t.events.processing
                    : t.events.registerForEvent
                  : t.nav.signIn}
              </button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
