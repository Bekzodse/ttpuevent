"use client";

import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { resolveEventImageUrl } from "@/lib/api";
import { UniversityEvent } from "@/lib/types";

export default function EventCard({ event }: { event: UniversityEvent }) {
  const { t } = useI18n();
  const percent = Math.round((event.registered / event.capacity) * 100);
  const full = event.registered >= event.capacity;
  const imgSrc = resolveEventImageUrl(event.imageUrl);

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

  return (
    <Link
      href={`/events/${event.id}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-1"
    >
      <div className={`relative h-36 overflow-hidden bg-gradient-to-br ${event.gradient}`}>
        {imgSrc && (
          <img
            src={imgSrc}
            alt={event.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
          {categoryLabel}
        </span>
        {(event.status === "Completed" || event.status === "Cancelled") && (
          <span
            className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm ${
              event.status === "Cancelled" ? "bg-rose-600/90" : "bg-slate-900/75"
            }`}
          >
            {event.status === "Cancelled" ? "Cancelled" : t.events.completed}
          </span>
        )}
        {event.userRegistered && (
          <span className="absolute bottom-3 right-3 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            {t.events.registered}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-brand-700">
          {event.title}
        </h3>

        <ul className="mt-3 space-y-1.5 text-sm text-slate-500">
          <li className="flex items-center gap-2">
            <CalendarDays size={15} /> {event.date}, {event.time}
          </li>
          <li className="flex items-center gap-2">
            <MapPin size={15} /> {event.location}
          </li>
          <li className="flex items-center gap-2">
            <Users size={15} /> {event.registered}/{event.capacity} {t.events.participants}
          </li>
        </ul>

        <div className="mt-4 pt-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${full ? "bg-rose-500" : "bg-brand-500"}`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            {full
              ? t.events.noSeatsLeft
              : `${event.capacity - event.registered} ${t.events.seatsAvailable}`}
          </p>
        </div>
      </div>
    </Link>
  );
}
