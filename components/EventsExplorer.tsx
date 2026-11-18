"use client";

import { useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";
import EventCard from "./EventCard";
import { useI18n } from "@/components/I18nProvider";
import { UniversityEvent } from "@/lib/types";

export default function EventsExplorer({ events }: { events: UniversityEvent[] }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = [
    { key: "All", label: t.events.allCategories },
    { key: "Academic", label: t.events.catAcademic },
    { key: "Technology", label: t.events.catTechnology },
    { key: "Career", label: t.events.catCareer },
    { key: "Sports", label: t.events.catSports },
    { key: "Cultural", label: t.events.catCultural },
    { key: "Arts & Media", label: t.events.catArts },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter(
      (e) =>
        (category === "All" || e.category.toLowerCase() === category.toLowerCase()) &&
        (!q ||
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.organizer.toLowerCase().includes(q))
    );
  }, [events, query, category]);

  return (
    <div>
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-10"
          placeholder={t.events.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              category === c.key
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card mt-8 flex flex-col items-center gap-2 py-16 text-center text-slate-500">
          <SearchX size={36} className="text-slate-300" />
          <p className="font-medium">{t.events.noEventsFound}</p>
          <p className="text-sm">{t.events.adjustFilterHint}</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
