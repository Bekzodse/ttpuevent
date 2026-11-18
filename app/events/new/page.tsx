"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import { ApiError, eventsApi } from "@/lib/api";

export default function NewEventPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useI18n();

  const categories = [
    { key: "Academic", label: t.events.catAcademic },
    { key: "Technology", label: t.events.catTechnology },
    { key: "Career", label: t.events.catCareer },
    { key: "Sports", label: t.events.catSports },
    { key: "Cultural", label: t.events.catCultural },
    { key: "Arts & Media", label: t.events.catArts },
  ];

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    date: "",
    time: "",
    capacity: "100",
    organizer: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="card mx-auto h-96 max-w-2xl animate-pulse bg-white" />;
  }

  if (createdId !== null) {
    return (
      <div className="card mx-auto flex max-w-md flex-col items-center gap-3 p-10 text-center">
        <CheckCircle2 size={48} className="text-emerald-500" />
        <h2 className="text-xl font-bold text-slate-900">{t.events.publishedTitle}</h2>
        <p className="text-sm text-slate-500">{t.events.publishedDesc}</p>
        <div className="mt-3 flex gap-2">
          <Link href={`/events/${createdId}`} className="btn-primary">
            {t.events.viewEvent}
          </Link>
          <Link href="/events" className="btn-outline">
            {t.events.allEvents}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await eventsApi.create({
        title: form.title,
        description: form.description,
        category: form.category,
        location: form.location,
        date: form.date,
        time: form.time,
        capacity: Number(form.capacity),
        organizer: form.organizer,
      });
      setCreatedId(created.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create event.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold text-slate-900">{t.events.newEventTitle}</h1>
      <p className="mb-6 mt-1 text-slate-500">{t.events.newEventSub}</p>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={17} /> {error}
        </div>
      )}

      <form className="card space-y-5 p-6" onSubmit={handleSubmit}>
        <div>
          <label className="label">{t.events.eventTitleLabel}</label>
          <input
            className="input"
            required
            minLength={3}
            placeholder={t.events.eventTitlePh}
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="label">{t.events.descLabel}</label>
          <textarea
            className="input min-h-28"
            required
            minLength={10}
            placeholder={t.events.descPh}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">{t.events.categoryLabel}</label>
            <select
              className="input"
              required
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            >
              <option value="" disabled>
                {t.events.selectCategory}
              </option>
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t.events.locationLabel}</label>
            <input
              className="input"
              required
              placeholder="The Annual Conference Hall"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">{t.events.dateLabel}</label>
            <input
              type="date"
              className="input"
              required
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">{t.events.timeLabel}</label>
            <input
              type="time"
              className="input"
              required
              value={form.time}
              onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">{t.events.capacityLabel}</label>
            <input
              type="number"
              min={1}
              className="input"
              required
              value={form.capacity}
              onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">{t.events.organizerLabel}</label>
            <input
              className="input"
              required
              placeholder={t.events.organizerPh}
              value={form.organizer}
              onChange={(e) => setForm((p) => ({ ...p, organizer: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/events" className="btn-outline">
            {t.common.cancel}
          </Link>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? t.events.publishingBtn : t.events.publishBtn}
          </button>
        </div>
      </form>
    </div>
  );
}
