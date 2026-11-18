"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import EventsExplorer from "@/components/EventsExplorer";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import { eventsApi } from "@/lib/api";
import { UniversityEvent } from "@/lib/types";

export default function EventsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [events, setEvents] = useState<UniversityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsApi
      .list()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">{t.events.pageTitle}</h1>
          <p className="mt-1 text-slate-500">{t.events.pageSubtitle}</p>
        </div>
        {user && (
          <Link href="/events/new" className="btn-primary">
            <Plus size={18} /> {t.events.createEvent}
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-64 animate-pulse bg-white" />
          ))}
        </div>
      ) : (
        <EventsExplorer events={events} />
      )}
    </div>
  );
}
