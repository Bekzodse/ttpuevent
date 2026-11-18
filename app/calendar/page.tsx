"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Hash,
  Lock,
  MapPin,
  Plus,
  RotateCcw,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import { useNotifications } from "@/components/NotificationProvider";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import { ApiError, calendarApi } from "@/lib/api";
import { CalendarEvent, EventHall, HallScheduleBlock } from "@/lib/types";

type ViewMode = "daily" | "weekly" | "monthly";

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 .. 20:00

function toIsoDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function startOfWeek(d: Date) {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday first
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function hourStr(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

function getMondayBasedWeekdayIdx(d: Date) {
  return (d.getDay() + 6) % 7;
}

export default function EventHallCalendarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { locale, t } = useI18n();
  const { lastEventTick } = useNotifications();

  const [view, setView] = useState<ViewMode>("daily");
  const [cursorDate, setCursorDate] = useState<Date>(() => new Date());
  const [selectedHallId, setSelectedHallId] = useState<string>("");
  const [mobileHallId, setMobileHallId] = useState<number | null>(null);
  const [inspectEvent, setInspectEvent] = useState<CalendarEvent | null>(null);

  const [halls, setHalls] = useState<EventHall[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [blocks, setBlocks] = useState<HallScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const currentHour = new Date().getHours();

  // Admin schedule block form
  const [blockForm, setBlockForm] = useState({
    hallId: "",
    blockDate: todayIso,
    startTime: "08:00",
    endTime: "10:00",
    blockType: "MAINTENANCE",
    reason: "",
  });
  const [blockBusy, setBlockBusy] = useState(false);
  const [blockMsg, setBlockMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const dateRange = useMemo(() => {
    if (view === "daily") {
      const iso = toIsoDate(cursorDate);
      return { start: iso, end: iso };
    }
    if (view === "weekly") {
      const start = startOfWeek(cursorDate);
      const end = addDays(start, 6);
      return { start: toIsoDate(start), end: toIsoDate(end) };
    }
    const first = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
    const last = new Date(cursorDate.getFullYear(), cursorDate.getMonth() + 1, 0);
    return { start: toIsoDate(first), end: toIsoDate(last) };
  }, [view, cursorDate]);

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await calendarApi.getCalendar(
        dateRange.start,
        dateRange.end,
        selectedHallId || undefined
      );
      setHalls(res.halls);
      setEvents(res.events);
      setBlocks(res.blocks);
      setBlockForm((prev) =>
        prev.hallId || res.halls.length === 0 ? prev : { ...prev, hallId: String(res.halls[0].id) }
      );
      setMobileHallId((prev) => (prev || res.halls.length === 0 ? prev : res.halls[0].id));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [dateRange.start, dateRange.end, selectedHallId]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar, lastEventTick]);

  const navigate = (dir: -1 | 1) => {
    if (view === "daily") setCursorDate((d) => addDays(d, dir));
    else if (view === "weekly") setCursorDate((d) => addDays(d, dir * 7));
    else setCursorDate((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  };

  const handleBookSlot = (hallId?: number, date?: string, startTime?: string, endTime?: string) => {
    const params = new URLSearchParams({ tab: "book" });
    if (hallId) params.set("hallId", String(hallId));
    if (date) params.set("date", date);
    if (startTime) params.set("startTime", startTime);
    if (endTime) params.set("endTime", endTime);
    const target = `/dashboard?${params.toString()}`;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(target)}`);
      return;
    }
    router.push(target);
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlockMsg(null);
    if (!blockForm.hallId || blockForm.reason.trim().length < 3) {
      setBlockMsg({ type: "err", text: "Please select a hall and enter a reason." });
      return;
    }
    setBlockBusy(true);
    try {
      await calendarApi.createBlock({
        hallId: Number(blockForm.hallId),
        blockDate: blockForm.blockDate,
        startTime: blockForm.startTime,
        endTime: blockForm.endTime,
        blockType: blockForm.blockType,
        reason: blockForm.reason.trim(),
      });
      setBlockForm((p) => ({ ...p, reason: "" }));
      setBlockMsg({ type: "ok", text: "Hall schedule block added." });
      await loadCalendar();
    } catch (err) {
      setBlockMsg({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to block hall slot.",
      });
    } finally {
      setBlockBusy(false);
    }
  };

  const handleDeleteBlock = async (id: number) => {
    setBlockMsg(null);
    try {
      await calendarApi.deleteBlock(id);
      setBlockMsg({ type: "ok", text: "Schedule block removed." });
      setInspectEvent((prev) =>
        prev && prev.itemType === "SCHEDULE_BLOCK" && prev.id === id ? null : prev
      );
      await loadCalendar();
    } catch (err) {
      setBlockMsg({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to remove schedule block.",
      });
    }
  };

  const visibleHalls = useMemo(
    () => (selectedHallId ? halls.filter((h) => String(h.id) === selectedHallId) : halls),
    [halls, selectedHallId]
  );

  const getSlotEvent = useCallback(
    (hallId: number, date: string, hour: number): CalendarEvent | null => {
      const slotStart = hourStr(hour);
      const slotEnd = hourStr(hour + 1);
      const matches = events.filter(
        (ev) =>
          ev.hallId === hallId &&
          ev.date === date &&
          ev.startTime.slice(0, 5) < slotEnd &&
          ev.endTime.slice(0, 5) > slotStart
      );
      if (matches.length === 0) return null;
      return (
        matches.find((m) => m.slotState === "CONFIRMED") ||
        matches.find((m) => m.slotState === "BLOCKED") ||
        matches.find((m) => m.slotState === "RESERVED") ||
        matches[0]
      );
    },
    [events]
  );

  const slotCssClass = (state: string) => {
    switch (state) {
      case "CONFIRMED":
        return "cal-slot-confirmed";
      case "RESERVED":
      case "PENDING":
        return "cal-slot-reserved";
      case "BLOCKED":
        return "cal-slot-blocked";
      default:
        return "cal-slot-available";
    }
  };

  const slotDotColor = (state: string) => {
    switch (state) {
      case "CONFIRMED":
        return "bg-rose-500";
      case "RESERVED":
      case "PENDING":
        return "bg-amber-500";
      case "BLOCKED":
        return "bg-slate-500";
      default:
        return "bg-emerald-500";
    }
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursorDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursorDate]);

  const monthCells = useMemo(() => {
    const year = cursorDate.getFullYear();
    const month = cursorDate.getMonth();
    const first = new Date(year, month, 1);
    const firstDayIdx = getMondayBasedWeekdayIdx(first);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDayIdx; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursorDate]);

  const activeIsoDate = toIsoDate(cursorDate);
  const intlLocale = locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US";

  const stats = useMemo(() => {
    const confirmed = events.filter((e) => e.slotState === "CONFIRMED").length;
    const reserved = events.filter(
      (e) => e.slotState === "RESERVED" || e.slotState === "PENDING"
    ).length;
    const blocked = events.filter((e) => e.slotState === "BLOCKED").length;
    return { confirmed, reserved, blocked, total: events.length };
  }, [events]);

  const activeDateEvents = useMemo(
    () =>
      events
        .filter((e) => e.date === activeIsoDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events, activeIsoDate]
  );

  const selectedMobileHall =
    visibleHalls.find((h) => h.id === mobileHallId) || visibleHalls[0] || null;

  const formattedHeaderDate = useMemo(() => {
    if (view === "monthly") {
      return cursorDate.toLocaleDateString(intlLocale, { month: "long", year: "numeric" });
    }
    if (view === "weekly") {
      return `${dateRange.start} → ${dateRange.end}`;
    }
    return activeIsoDate;
  }, [view, cursorDate, intlLocale, dateRange.start, dateRange.end, activeIsoDate]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="brand-gradient relative overflow-hidden rounded-3xl px-6 py-6 text-white shadow-lg sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur sm:flex">
              <CalendarIcon size={24} className="text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-0.5 text-xs font-semibold text-white/95 backdrop-blur">
                <Clock size={12} />
                <span>{formattedHeaderDate}</span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {t.calendar.title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-white/85">{t.calendar.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/75">
                  {t.calendar.totalHalls}
                </p>
                <p className="text-lg font-extrabold text-white">{visibleHalls.length}</p>
              </div>
              <div className="mx-2 h-7 w-px bg-white/25" />
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/75">
                  {t.calendar.eventsCount}
                </p>
                <p className="text-lg font-extrabold text-white">{stats.total}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleBookSlot(selectedHallId ? Number(selectedHallId) : undefined, activeIsoDate)
              }
              className="btn bg-white text-slate-900 shadow-md hover:bg-slate-100"
            >
              <CalendarPlus size={16} /> {t.home.bookHall}
            </button>
          </div>
        </div>
      </section>

      {/* Streamlined Controls & Status Legend */}
      <section className="card space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* View Mode Segmented Switcher */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-1">
            {(
              [
                { id: "daily", label: t.calendar.daily, Icon: Clock },
                { id: "weekly", label: t.calendar.weekly, Icon: CalendarDays },
                { id: "monthly", label: t.calendar.monthly, Icon: CalendarRange },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition sm:flex-initial ${
                  view === id
                    ? "brand-gradient text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Date Navigation + Date Picker */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-center">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-outline px-2.5 py-2"
                aria-label="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setCursorDate(new Date())}
                className="btn-outline px-3 py-2 text-xs"
              >
                {t.calendar.today}
              </button>
              <span className="min-w-[130px] px-2 text-center text-sm font-extrabold text-slate-900">
                {formattedHeaderDate}
              </span>
              <button
                type="button"
                onClick={() => navigate(1)}
                className="btn-outline px-2.5 py-2"
                aria-label="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <input
              type="date"
              value={activeIsoDate}
              onChange={(e) => {
                if (!e.target.value) return;
                const [y, m, d] = e.target.value.split("-").map(Number);
                if (y && m && d) setCursorDate(new Date(y, m - 1, d));
              }}
              className="input w-auto py-1.5 text-xs font-semibold"
              aria-label={t.calendar.today}
            />
          </div>

          {/* Filter Reset if a single hall is active */}
          <div className="flex items-center justify-between gap-2 lg:justify-end">
            {selectedHallId ? (
              <button
                type="button"
                onClick={() => setSelectedHallId("")}
                className="btn-outline px-3.5 py-2 text-xs"
              >
                <RotateCcw size={13} /> {t.calendar.allHalls}
              </button>
            ) : (
              <span className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600">
                {t.calendar.allHalls} ({halls.length})
              </span>
            )}
          </div>
        </div>

        {/* Clean Status Legend Bar */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15" />
            {t.calendar.available}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/15" />
            {t.calendar.reserved}
            {stats.reserved > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-800">
                {stats.reserved}
              </span>
            )}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/15" />
            {t.calendar.confirmed}
            {stats.confirmed > 0 && (
              <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-800">
                {stats.confirmed}
              </span>
            )}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-500 ring-4 ring-slate-500/15" />
            {t.calendar.blocked}
            {stats.blocked > 0 && (
              <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-700">
                {stats.blocked}
              </span>
            )}
          </span>
        </div>
      </section>

      {/* Interactive 3-Hall Showcase / Filter Strip */}
      {halls.length > 0 && (
        <section className="grid gap-4 md:grid-cols-3">
          {halls.map((hall) => {
            const isActive = selectedHallId === String(hall.id);
            const freeToday = HOURS.filter(
              (h) => !getSlotEvent(hall.id, activeIsoDate, h)
            ).length;
            return (
              <div
                key={hall.id}
                onClick={() => setSelectedHallId(isActive ? "" : String(hall.id))}
                className={`card group cursor-pointer overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md ${
                  isActive ? "ring-2" : ""
                }`}
                style={
                  isActive
                    ? ({ "--tw-ring-color": "var(--brand-primary)" } as React.CSSProperties)
                    : undefined
                }
              >
                <div className="relative h-32 w-full overflow-hidden bg-slate-200">
                  {hall.imageUrl ? (
                    <img
                      src={hall.imageUrl}
                      alt={hall.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <Building2 size={28} />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
                    <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 shadow-sm backdrop-blur">
                      {freeToday}/{HOURS.length} {t.calendar.freeSlots}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <h3 className="truncate text-sm font-extrabold drop-shadow">{hall.name}</h3>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 px-4 py-3 text-xs">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 truncate font-medium text-slate-500">
                      <MapPin size={12} className="shrink-0" />
                      {hall.building} · {hall.floor}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 font-bold text-slate-800">
                      <Users size={12} /> {hall.capacity} {t.calendar.seats} · ${hall.hourlyRate}/hr
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookSlot(hall.id, activeIsoDate);
                    }}
                    className="btn-primary shrink-0 px-3 py-1.5 text-[11px]"
                  >
                    <CalendarPlus size={12} /> {t.calendar.bookThisDate}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Calendar Views */}
      {loading ? (
        <div className="card space-y-3 p-6">
          <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      ) : view === "daily" ? (
        <>
          {/* Desktop / Tablet Schedule Matrix */}
          <div className="card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] table-fixed border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="w-32 border-b border-r border-slate-200 px-4 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} />
                        {t.calendar.time}
                      </span>
                    </th>
                    {visibleHalls.map((hall) => {
                      const freeCount = HOURS.filter(
                        (h) => !getSlotEvent(hall.id, activeIsoDate, h)
                      ).length;
                      return (
                        <th
                          key={hall.id}
                          className="border-b border-r border-slate-200 px-4 py-3.5 last:border-r-0"
                        >
                          <div className="flex items-center gap-3">
                            {hall.imageUrl && (
                              <img
                                src={hall.imageUrl}
                                alt={hall.name}
                                className="h-10 w-14 shrink-0 rounded-lg border border-slate-200 object-cover"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-extrabold text-slate-900">
                                  {hall.name}
                                </p>
                                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                                  {freeCount}/{HOURS.length} {t.calendar.freeSlots}
                                </span>
                              </div>
                              <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                                {hall.building} · {hall.floor} · {hall.capacity} {t.calendar.seats}
                              </p>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map((h) => {
                    const sTime = hourStr(h);
                    const eTime = hourStr(h + 1);
                    const isCurrentHour = activeIsoDate === todayIso && currentHour === h;
                    return (
                      <tr key={h} className="transition-colors hover:bg-slate-50/70">
                        <td className="border-b border-r border-slate-100 bg-white px-4 py-2 font-mono text-xs font-bold text-slate-600">
                          <div className="flex items-center gap-2">
                            <span>
                              {sTime}–{eTime}
                            </span>
                            {isCurrentHour && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white"
                                style={{ backgroundColor: "var(--brand-primary)" }}
                              >
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                                {t.calendar.now}
                              </span>
                            )}
                          </div>
                        </td>
                        {visibleHalls.map((hall) => {
                          const ev = getSlotEvent(hall.id, activeIsoDate, h);
                          if (!ev) {
                            return (
                              <td
                                key={hall.id}
                                className="border-b border-r border-slate-100 p-1.5 last:border-r-0"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleBookSlot(hall.id, activeIsoDate, sTime, eTime)
                                  }
                                  className="cal-slot-available group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition"
                                >
                                  <span className="inline-flex items-center gap-2 text-xs font-bold">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    {t.calendar.available}
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700 opacity-0 shadow-sm transition group-hover:opacity-100">
                                    <Plus size={11} /> {t.calendar.clickToBook}
                                  </span>
                                </button>
                              </td>
                            );
                          }
                          return (
                            <td
                              key={hall.id}
                              className="border-b border-r border-slate-100 p-1.5 last:border-r-0"
                            >
                              <button
                                type="button"
                                onClick={() => setInspectEvent(ev)}
                                className={`w-full rounded-xl px-3.5 py-2 text-left transition ${slotCssClass(
                                  ev.slotState
                                )}`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <p className="truncate text-xs font-extrabold">{ev.eventName}</p>
                                  <ArrowUpRight size={12} className="shrink-0 opacity-65" />
                                </div>
                                <p className="mt-0.5 truncate text-[10px] font-semibold opacity-80">
                                  {ev.startTime.slice(0, 5)}–{ev.endTime.slice(0, 5)} ·{" "}
                                  {ev.bookingStatus ? t.status[ev.bookingStatus] : ev.eventType}
                                </p>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Hall Selector + Hour Grid */}
          <div className="space-y-4 md:hidden">
            {visibleHalls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {visibleHalls.map((hall) => {
                  const active = selectedMobileHall?.id === hall.id;
                  return (
                    <button
                      key={hall.id}
                      type="button"
                      onClick={() => setMobileHallId(hall.id)}
                      className={`shrink-0 rounded-xl border px-3.5 py-2 text-left text-xs font-bold transition ${
                        active
                          ? "border-transparent text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                      style={active ? { backgroundColor: "var(--brand-primary)" } : undefined}
                    >
                      <span className="block">{hall.name}</span>
                      <span className={`text-[10px] ${active ? "text-white/80" : "text-slate-400"}`}>
                        {hall.capacity} {t.calendar.seats}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedMobileHall && (
              <div className="card overflow-hidden p-4">
                <div className="mb-3 flex items-center gap-3 border-b border-slate-100 pb-3">
                  {selectedMobileHall.imageUrl && (
                    <img
                      src={selectedMobileHall.imageUrl}
                      alt={selectedMobileHall.name}
                      className="h-12 w-16 shrink-0 rounded-xl object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {selectedMobileHall.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedMobileHall.building} · {selectedMobileHall.floor} ·{" "}
                      {selectedMobileHall.capacity} {t.calendar.seats}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {HOURS.map((h) => {
                    const sTime = hourStr(h);
                    const eTime = hourStr(h + 1);
                    const ev = getSlotEvent(selectedMobileHall.id, activeIsoDate, h);
                    if (!ev) {
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() =>
                            handleBookSlot(selectedMobileHall.id, activeIsoDate, sTime, eTime)
                          }
                          className="cal-slot-available flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition"
                        >
                          <div>
                            <span className="font-mono font-bold">
                              {sTime}–{eTime}
                            </span>
                            <span className="ml-2 font-semibold">{t.calendar.available}</span>
                          </div>
                          <Plus size={14} />
                        </button>
                      );
                    }
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setInspectEvent(ev)}
                        className={`rounded-xl px-3 py-2.5 text-left text-xs transition ${slotCssClass(
                          ev.slotState
                        )}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold">
                            {sTime}–{eTime}
                          </span>
                          <span className="truncate font-extrabold">{ev.eventName}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      ) : view === "weekly" ? (
        /* Weekly Board */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {weekDays.map((day, idx) => {
            const iso = toIsoDate(day);
            const dayEvents = events
              .filter((e) => e.date === iso)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            const isToday = iso === todayIso;
            const occupiedRatio = Math.min(100, dayEvents.length * 20);

            return (
              <div
                key={iso}
                className={`card flex flex-col justify-between overflow-hidden transition hover:shadow-md ${
                  isToday ? "ring-2" : ""
                }`}
                style={
                  isToday
                    ? ({ "--tw-ring-color": "var(--brand-primary)" } as React.CSSProperties)
                    : undefined
                }
              >
                <div>
                  <div className={`border-b border-slate-100 p-3.5 ${isToday ? "bg-slate-50" : ""}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                        {t.calendar.weekdaysShort[idx]}
                      </span>
                      {isToday && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white"
                          style={{ backgroundColor: "var(--brand-primary)" }}
                        >
                          {t.calendar.today}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-slate-900">{day.getDate()}</span>
                      <span className="text-[11px] font-semibold text-slate-400">{iso.slice(5)}</span>
                    </div>
                    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${dayEvents.length === 0 ? 100 : occupiedRatio}%`,
                          backgroundColor:
                            dayEvents.length === 0 ? "#10b981" : "var(--brand-primary)",
                          opacity: dayEvents.length === 0 ? 0.35 : 0.85,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 p-3">
                    {dayEvents.length === 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleBookSlot(selectedHallId ? Number(selectedHallId) : undefined, iso)
                        }
                        className="cal-slot-available flex w-full flex-col items-center justify-center rounded-xl px-3 py-5 text-center text-xs font-bold transition"
                      >
                        <CheckCircle2 size={18} className="mb-1.5 text-emerald-500" />
                        <span>{t.calendar.allDayFree}</span>
                        <span className="mt-1 text-[10px] font-semibold opacity-75">
                          + {t.calendar.clickToBook}
                        </span>
                      </button>
                    ) : (
                      dayEvents.map((ev) => (
                        <button
                          key={`${ev.itemType}-${ev.id}`}
                          type="button"
                          onClick={() => setInspectEvent(ev)}
                          className={`w-full rounded-xl p-2.5 text-left text-[11px] transition ${slotCssClass(
                            ev.slotState
                          )}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[10px] font-bold">
                              {ev.startTime.slice(0, 5)}–{ev.endTime.slice(0, 5)}
                            </span>
                            <span className={`h-2 w-2 rounded-full ${slotDotColor(ev.slotState)}`} />
                          </div>
                          <p className="mt-1 line-clamp-1 text-xs font-extrabold">{ev.eventName}</p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] opacity-80">
                            <Building2 size={10} />
                            {ev.hallName}
                          </p>
                          {ev.bookingStatus && (
                            <div className="mt-1.5">
                              <BookingStatusBadge status={ev.bookingStatus} />
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCursorDate(day);
                      setView("daily");
                    }}
                    className="text-[11px] font-bold text-slate-600 hover:text-brand-700"
                  >
                    {t.calendar.openDailyView} →
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleBookSlot(selectedHallId ? Number(selectedHallId) : undefined, iso)
                    }
                    className="rounded-lg p-1 text-slate-500 hover:bg-slate-200/70 hover:text-slate-900"
                    title={t.calendar.bookThisDate}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Monthly View + Selected Day Agenda */
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="card overflow-hidden p-4 sm:p-5 lg:col-span-8">
            <div className="mb-2.5 hidden grid-cols-7 gap-2 text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-400 sm:grid">
              {t.calendar.weekdaysShort.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
              {monthCells.map((day, idx) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="hidden min-h-28 rounded-xl border border-dashed border-slate-100 bg-slate-50/40 sm:block"
                    />
                  );
                }
                const iso = toIsoDate(day);
                const isToday = iso === todayIso;
                const isSelected = iso === activeIsoDate;
                const dayEvents = events
                  .filter((e) => e.date === iso)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setCursorDate(day)}
                    className={`flex min-h-28 flex-col justify-between rounded-xl border p-2 text-left transition ${
                      isSelected
                        ? "border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/30"
                        : "border-slate-200/80 bg-white hover:border-brand-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold ${
                          isToday
                            ? "text-white"
                            : isSelected
                            ? "bg-slate-900 text-white"
                            : "text-slate-800"
                        }`}
                        style={isToday ? { backgroundColor: "var(--brand-primary)" } : undefined}
                      >
                        {day.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 space-y-1">
                      {dayEvents.length === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {t.calendar.available}
                        </span>
                      ) : (
                        <>
                          {dayEvents.slice(0, 2).map((ev) => (
                            <div
                              key={`${ev.itemType}-${ev.id}`}
                              className="flex items-center gap-1 truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-800"
                            >
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${slotDotColor(
                                  ev.slotState
                                )}`}
                              />
                              <span className="font-mono opacity-75">
                                {ev.startTime.slice(0, 5)}
                              </span>
                              <span className="truncate">{ev.eventName}</span>
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <p className="px-1 text-[10px] font-bold text-slate-500">
                              +{dayEvents.length - 2} {t.calendar.moreEvents}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Agenda Sidebar */}
          <aside className="card flex flex-col justify-between p-5 lg:col-span-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t.calendar.selectedDay}
                  </p>
                  <h3 className="text-lg font-extrabold text-slate-900">{activeIsoDate}</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                  {activeDateEvents.length}
                </span>
              </div>

              <div className="mt-4 max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
                {activeDateEvents.length === 0 ? (
                  <div className="cal-slot-available rounded-2xl p-6 text-center">
                    <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                    <p className="text-sm font-bold">{t.calendar.allDayFree}</p>
                    <p className="mt-1 text-xs opacity-80">{t.calendar.noBookingsDay}</p>
                  </div>
                ) : (
                  activeDateEvents.map((ev) => (
                    <button
                      key={`${ev.itemType}-${ev.id}`}
                      type="button"
                      onClick={() => setInspectEvent(ev)}
                      className={`w-full rounded-xl p-3 text-left transition ${slotCssClass(
                        ev.slotState
                      )}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-extrabold">
                          {ev.startTime.slice(0, 5)}–{ev.endTime.slice(0, 5)}
                        </span>
                        <ArrowUpRight size={14} className="opacity-60" />
                      </div>
                      <p className="mt-1 text-sm font-extrabold">{ev.eventName}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs opacity-80">
                        <Building2 size={12} />
                        {ev.hallName}
                      </p>
                      {ev.bookingStatus && (
                        <div className="mt-2">
                          <BookingStatusBadge status={ev.bookingStatus} />
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setView("daily")}
                className="btn-outline px-3 py-2 text-xs"
              >
                {t.calendar.openDailyView}
              </button>
              <button
                type="button"
                onClick={() =>
                  handleBookSlot(selectedHallId ? Number(selectedHallId) : undefined, activeIsoDate)
                }
                className="btn-primary px-3 py-2 text-xs"
              >
                <Plus size={14} /> {t.calendar.bookThisDate}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Admin Schedule Management Panel */}
      {user?.role === "ADMIN" && (
        <section className="card p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: "var(--brand-primary)" }}
              >
                <Lock size={16} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {t.calendar.adminScheduleTitle}
                </h2>
                <p className="text-xs text-slate-500">{t.calendar.blockHallSlot}</p>
              </div>
            </div>
            {blocks.length > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {t.calendar.activeBlocks}: {blocks.length}
              </span>
            )}
          </div>

          {blockMsg && (
            <div
              className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                blockMsg.type === "ok"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-rose-50 text-rose-800"
              }`}
            >
              {blockMsg.type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{blockMsg.text}</span>
            </div>
          )}

          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6" onSubmit={handleAddBlock}>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {t.cabinet.selectHall}
              </label>
              <select
                className="input"
                value={blockForm.hallId}
                onChange={(e) => setBlockForm((p) => ({ ...p, hallId: e.target.value }))}
              >
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {t.cabinet.eventDate}
              </label>
              <input
                type="date"
                className="input"
                min={todayIso}
                required
                value={blockForm.blockDate}
                onChange={(e) => setBlockForm((p) => ({ ...p, blockDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {t.cabinet.startTime}
              </label>
              <input
                type="time"
                className="input"
                required
                value={blockForm.startTime}
                onChange={(e) => setBlockForm((p) => ({ ...p, startTime: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {t.cabinet.endTime}
              </label>
              <input
                type="time"
                className="input"
                required
                value={blockForm.endTime}
                onChange={(e) => setBlockForm((p) => ({ ...p, endTime: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {t.calendar.blockType}
              </label>
              <select
                className="input"
                value={blockForm.blockType}
                onChange={(e) => setBlockForm((p) => ({ ...p, blockType: e.target.value }))}
              >
                <option value="MAINTENANCE">{t.calendar.maintenance}</option>
                <option value="UNIVERSITY_RESERVED">{t.calendar.universityReserved}</option>
                <option value="CLOSED">{t.calendar.closed}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                {t.calendar.blockReason}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder={t.calendar.blockReason}
                  required
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm((p) => ({ ...p, reason: e.target.value }))}
                />
                <button
                  type="submit"
                  disabled={blockBusy}
                  className="btn-primary shrink-0 px-3.5"
                  title={t.calendar.addBlock}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </form>

          {blocks.length > 0 && (
            <div className="mt-5 grid gap-2.5 border-t border-slate-100 pt-4 sm:grid-cols-2">
              {blocks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-xs"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Building2 size={13} className="shrink-0 text-slate-500" />
                      <span className="font-extrabold text-slate-900">{b.hallName}</span>
                      <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {b.blockType}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-slate-500">
                      {b.blockDate} · {b.startTime.slice(0, 5)}–{b.endTime.slice(0, 5)}
                    </p>
                    <p className="truncate text-slate-600">{b.reason}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(b.id)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    <Trash2 size={13} /> {t.calendar.removeBlock}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Event / Schedule Block Detail Modal */}
      {inspectEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setInspectEvent(null)}
        >
          <div
            className="card w-full max-w-md overflow-hidden p-0 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4 text-white"
              style={{
                background:
                  inspectEvent.slotState === "CONFIRMED"
                    ? "#e11d48"
                    : inspectEvent.slotState === "RESERVED" || inspectEvent.slotState === "PENDING"
                    ? "#d97706"
                    : "#475569",
              }}
            >
              <div className="flex items-center gap-2">
                <CalendarIcon size={17} />
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  {t.calendar.slotDetails}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectEvent(null)}
                className="rounded-lg p-1 text-white/80 hover:bg-white/15 hover:text-white"
                aria-label={t.calendar.close}
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{inspectEvent.eventName}</h3>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  {inspectEvent.eventType}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 text-xs">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">
                    {t.cabinet.selectHall}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 font-bold text-slate-900">
                    <Building2 size={12} /> {inspectEvent.hallName}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">
                    {t.cabinet.eventDate}
                  </span>
                  <span className="mt-0.5 block font-mono font-bold text-slate-900">
                    {inspectEvent.date}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400">
                    {t.calendar.time}
                  </span>
                  <span className="mt-0.5 block font-mono font-bold text-slate-900">
                    {inspectEvent.startTime.slice(0, 5)}–{inspectEvent.endTime.slice(0, 5)}
                  </span>
                </div>
                {inspectEvent.applicationCode && (
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-400">
                      {t.calendar.applicationCode}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 font-mono font-bold text-slate-900">
                      <Hash size={11} /> {inspectEvent.applicationCode}
                    </span>
                  </div>
                )}
              </div>

              {inspectEvent.bookingStatus && (
                <div className="flex items-center justify-between">
                  <BookingStatusBadge status={inspectEvent.bookingStatus} />
                </div>
              )}

              {inspectEvent.reason && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                    {t.calendar.blockReason}
                  </span>
                  {inspectEvent.reason}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                {user?.role === "ADMIN" && inspectEvent.itemType === "SCHEDULE_BLOCK" && (
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(inspectEvent.id)}
                    className="btn-danger px-3.5 py-2 text-xs"
                  >
                    <Trash2 size={13} /> {t.calendar.removeBlock}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const d = inspectEvent.date;
                    setInspectEvent(null);
                    handleBookSlot(inspectEvent.hallId, d);
                  }}
                  className="btn-primary px-3.5 py-2 text-xs"
                >
                  <Plus size={13} /> {t.calendar.bookThisDate}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
