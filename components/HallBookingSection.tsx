"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileCheck2,
  History,
  Info,
  MapPin,
  MessageSquareReply,
  Package,
  RotateCcw,
  Send,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import BookingStatusBadge from "./BookingStatusBadge";
import SecureReceiptViewer from "./SecureReceiptViewer";
import { useI18n } from "./I18nProvider";
import { useNotifications } from "./NotificationProvider";
import {
  ApiError,
  applicationsApi,
  calendarApi,
  cancellationsApi,
  equipmentApi,
  hallsApi,
} from "@/lib/api";
import {
  CancellationPolicy,
  Equipment,
  EventHall,
  HallApplication,
  TimeSlotAvailability,
  User,
} from "@/lib/types";

const EVENT_TYPES = [
  "Seminar",
  "Conference",
  "Meeting",
  "Workshop",
  "Academic Lecture",
  "Career Fair",
  "Cultural Event",
  "Sports Event",
  "Other",
];

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTimeRemaining(deadlineIso: string | null) {
  if (!deadlineIso) return null;
  const diffMs = new Date(deadlineIso).getTime() - Date.now();
  if (diffMs <= 0) return "Deadline passed";
  const hrs = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  return `${hrs}h ${mins}m`;
}

export default function HallBookingSection({
  user,
  mode,
  onSubmitted,
}: {
  user: User;
  mode: "apply" | "list";
  onSubmitted?: (created: HallApplication) => void;
}) {
  const { t } = useI18n();
  const { lastEventTick } = useNotifications();
  const [halls, setHalls] = useState<EventHall[]>([]);
  const [applications, setApplications] = useState<HallApplication[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<TimeSlotAvailability[]>([]);
  const [policy, setPolicy] = useState<CancellationPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    eventName: "",
    eventType: "Seminar",
    hallId: "",
    eventDate: "",
    startTime: "10:00",
    endTime: "12:00",
    expectedParticipants: "50",
    description: "",
  });
  const [selectedEquipment, setSelectedEquipment] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [replyMap, setReplyMap] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<Record<number, boolean>>({});

  // Cancellation request modal
  const [cancelModalApp, setCancelModalApp] = useState<HallApplication | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Read calendar pre-fill params once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = new URLSearchParams(window.location.search);
    const qHall = qs.get("hallId");
    const qDate = qs.get("date");
    const qStart = qs.get("startTime");
    const qEnd = qs.get("endTime");
    if (qHall || qDate || qStart || qEnd) {
      setForm((prev) => ({
        ...prev,
        hallId: qHall || prev.hallId,
        eventDate: qDate || prev.eventDate,
        startTime: qStart || prev.startTime,
        endTime: qEnd || prev.endTime,
      }));
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [hallsRes, appsRes, policyRes] = await Promise.all([
        hallsApi.list(),
        applicationsApi.myApplications(),
        cancellationsApi.getPolicy().catch(() => null),
      ]);
      setHalls(hallsRes);
      setApplications(appsRes);
      if (policyRes) setPolicy(policyRes);
      setForm((prev) =>
        prev.hallId || hallsRes.length === 0 ? prev : { ...prev, hallId: String(hallsRes[0].id) }
      );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, lastEventTick]);

  // Refresh live equipment availability for selected date & time window
  useEffect(() => {
    equipmentApi
      .listAvailable(form.eventDate || undefined, form.startTime, form.endTime)
      .then(setEquipmentList)
      .catch(() => setEquipmentList([]));
  }, [form.eventDate, form.startTime, form.endTime, lastEventTick]);

  // Refresh live hall slots for selected hall & date
  useEffect(() => {
    if (!form.hallId || !form.eventDate) {
      setAvailabilitySlots([]);
      return;
    }
    calendarApi
      .getDailyAvailability(form.hallId, form.eventDate)
      .then(setAvailabilitySlots)
      .catch(() => setAvailabilitySlots([]));
  }, [form.hallId, form.eventDate, lastEventTick]);

  const selectedHall = useMemo(
    () => halls.find((h) => String(h.id) === form.hallId) || null,
    [halls, form.hallId]
  );

  const estimatedFee = useMemo(() => {
    if (!selectedHall || !form.startTime || !form.endTime) return null;
    const [sh, sm] = form.startTime.split(":").map(Number);
    const [eh, em] = form.endTime.split(":").map(Number);
    const mins = eh * 60 + em - (sh * 60 + sm);
    if (mins <= 0) return null;
    const hours = Math.max(mins, 60) / 60;
    const hallCost = selectedHall.hourlyRate * hours;
    const eqCost = equipmentList.reduce((sum, eq) => {
      const qty = selectedEquipment[eq.id] || 0;
      return sum + eq.unitFee * qty;
    }, 0);
    return (hallCost + eqCost).toFixed(2);
  }, [selectedHall, form.startTime, form.endTime, equipmentList, selectedEquipment]);

  const handleEquipmentQty = (eqId: number, maxQty: number, nextVal: number) => {
    const clamped = Math.max(0, Math.min(maxQty, nextVal));
    setSelectedEquipment((prev) => {
      const copy = { ...prev };
      if (clamped === 0) delete copy[eqId];
      else copy[eqId] = clamped;
      return copy;
    });
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setFieldErrors({});

    const errs: Record<string, string> = {};
    if (form.eventName.trim().length < 3) errs.eventName = "Event name must be at least 3 characters.";
    if (!form.hallId) errs.hallId = "Please select an event hall.";
    if (!form.eventDate) errs.eventDate = "Please select an event date.";
    if (!form.startTime || !form.endTime) errs.startTime = "Start and end times are required.";
    else if (form.endTime <= form.startTime) errs.endTime = "End time must be after start time.";

    const count = Number(form.expectedParticipants);
    if (!Number.isFinite(count) || count < 1) {
      errs.expectedParticipants = "Participants must be at least 1.";
    } else if (selectedHall && count > selectedHall.capacity) {
      errs.expectedParticipants = `Cannot exceed ${selectedHall.name} capacity (${selectedHall.capacity}).`;
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    const equipmentItems = Object.entries(selectedEquipment)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ equipmentId: Number(id), quantity: qty }));

    setSubmitting(true);
    try {
      const created = await applicationsApi.submit({
        eventName: form.eventName.trim(),
        eventType: form.eventType,
        hallId: Number(form.hallId),
        eventDate: form.eventDate,
        startTime: form.startTime,
        endTime: form.endTime,
        expectedParticipants: count,
        description: form.description.trim() || undefined,
        equipmentItems,
      });

      setFormSuccess(
        `${t.cabinet.appAcceptedTitle} ${t.cabinet.appAcceptedSubtitle} (${created.applicationCode})`
      );
      setForm((prev) => ({ ...prev, eventName: "", description: "" }));
      setSelectedEquipment({});
      await loadData();
      onSubmitted?.(created);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      } else {
        setFormError("Failed to submit application.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (appId: number) => {
    const text = (replyMap[appId] || "").trim();
    if (text.length < 3) {
      setActionMsg({ type: "err", text: "Please provide at least 3 characters in your reply." });
      return;
    }
    setBusyId(appId);
    setActionMsg(null);
    try {
      await applicationsApi.reply(appId, text);
      setReplyMap((p) => ({ ...p, [appId]: "" }));
      setActionMsg({ type: "ok", text: "Additional information submitted." });
      await loadData();
    } catch (err) {
      setActionMsg({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to send reply.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleUploadReceipt = async (appId: number, file: File | undefined) => {
    if (!file) return;
    setActionMsg(null);
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setActionMsg({
        type: "err",
        text: "Invalid receipt format. Upload PNG, JPG, WEBP, GIF, or PDF.",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setActionMsg({ type: "err", text: "Receipt file must be 5 MB or smaller." });
      return;
    }

    setBusyId(appId);
    try {
      await applicationsApi.uploadReceipt(appId, file);
      setActionMsg({
        type: "ok",
        text: "Payment receipt uploaded! Status changed to PAYMENT_UNDER_REVIEW.",
      });
      await loadData();
    } catch (err) {
      setActionMsg({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to upload payment receipt.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDirectCancel = async (appId: number) => {
    setBusyId(appId);
    setActionMsg(null);
    try {
      await applicationsApi.cancel(appId);
      setActionMsg({ type: "ok", text: "Application cancelled." });
      await loadData();
    } catch (err) {
      setActionMsg({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to cancel application.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleSubmitCancellationRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalApp) return;
    setCancelError(null);
    if (cancelReason.trim().length < 5) {
      setCancelError("Please enter a reason (at least 5 characters).");
      return;
    }

    setBusyId(cancelModalApp.id);
    try {
      await applicationsApi.requestCancellation(cancelModalApp.id, cancelReason.trim());
      setCancelModalApp(null);
      setCancelReason("");
      setActionMsg({
        type: "ok",
        text: "Cancellation & refund request submitted for administrator review.",
      });
      await loadData();
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : "Failed to submit cancellation request.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDownloadPdf = async (app: HallApplication) => {
    setBusyId(app.id);
    setActionMsg(null);
    try {
      await applicationsApi.downloadConfirmationPdf(app.id, app.applicationCode);
    } catch (err) {
      setActionMsg({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to download PDF confirmation.",
      });
    } finally {
      setBusyId(null);
    }
  };

  if (mode === "apply") {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="mb-5 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-extrabold text-slate-900">{t.cabinet.formTitle}</h2>
            <p className="mt-1 text-xs text-slate-500">{t.cabinet.autoFilledNotice}</p>
          </div>

          {formSuccess && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              <CheckCircle2 size={18} /> {formSuccess}
            </div>
          )}
          {formError && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              <AlertCircle size={18} /> {formError}
            </div>
          )}

          {/* Auto-retrieved profile info (NO Student ID) */}
          <div className="mb-6 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
            <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-brand-700">
              {t.cabinet.personalInfo}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <span className="block text-[11px] font-medium text-slate-500">
                  {t.auth.firstName}
                </span>
                <span className="text-sm font-bold text-slate-900">{user.firstName}</span>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-slate-500">
                  {t.auth.lastName}
                </span>
                <span className="text-sm font-bold text-slate-900">{user.lastName}</span>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-slate-500">
                  {t.auth.phoneNumber}
                </span>
                <span className="font-mono text-sm font-bold text-slate-900">
                  {user.phoneNumber}
                </span>
              </div>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmitApplication} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="hall-eventName">
                  {t.cabinet.eventName} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="hall-eventName"
                  type="text"
                  className={`input ${fieldErrors.eventName ? "border-rose-400" : ""}`}
                  value={form.eventName}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, eventName: e.target.value }));
                    setFieldErrors((p) => ({ ...p, eventName: "" }));
                  }}
                />
                {fieldErrors.eventName && (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.eventName}</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="hall-eventType">
                  {t.cabinet.eventType} <span className="text-rose-500">*</span>
                </label>
                <select
                  id="hall-eventType"
                  className="input"
                  value={form.eventType}
                  onChange={(e) => setForm((p) => ({ ...p, eventType: e.target.value }))}
                >
                  {EVENT_TYPES.map((et) => (
                    <option key={et} value={et}>
                      {et}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="hall-select">
                {t.cabinet.selectHall} <span className="text-rose-500">*</span>
              </label>
              {halls.length > 0 && (
                <div className="mb-3 grid gap-3 sm:grid-cols-3">
                  {halls.map((h) => {
                    const selected = String(h.id) === form.hallId;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          setForm((p) => ({ ...p, hallId: String(h.id) }));
                          setFieldErrors((p) => ({ ...p, hallId: "" }));
                        }}
                        className={`overflow-hidden rounded-xl border text-left transition ${
                          selected
                            ? "border-transparent ring-2 shadow-sm"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                        style={
                          selected
                            ? ({ "--tw-ring-color": "var(--brand-primary)" } as React.CSSProperties)
                            : undefined
                        }
                      >
                        {h.imageUrl && (
                          <img
                            src={h.imageUrl}
                            alt={h.name}
                            className="h-24 w-full object-cover"
                          />
                        )}
                        <div className="p-2.5">
                          <p className="truncate text-xs font-extrabold text-slate-900">{h.name}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {h.capacity} seats · ${h.hourlyRate}/hr
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <select
                id="hall-select"
                className={`input ${fieldErrors.hallId ? "border-rose-400" : ""}`}
                value={form.hallId}
                onChange={(e) => {
                  setForm((p) => ({ ...p, hallId: e.target.value }));
                  setFieldErrors((p) => ({ ...p, hallId: "" }));
                }}
              >
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} — {h.building} ({h.capacity} seats · ${h.hourlyRate}/hr)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="hall-date">
                  {t.cabinet.eventDate} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="hall-date"
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  className={`input ${fieldErrors.eventDate ? "border-rose-400" : ""}`}
                  value={form.eventDate}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, eventDate: e.target.value }));
                    setFieldErrors((p) => ({ ...p, eventDate: "" }));
                  }}
                />
                {fieldErrors.eventDate && (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.eventDate}</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="hall-start">
                  {t.cabinet.startTime} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="hall-start"
                  type="time"
                  className="input"
                  value={form.startTime}
                  onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                />
              </div>

              <div>
                <label className="label" htmlFor="hall-end">
                  {t.cabinet.endTime} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="hall-end"
                  type="time"
                  className={`input ${fieldErrors.endTime ? "border-rose-400" : ""}`}
                  value={form.endTime}
                  onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                />
                {fieldErrors.endTime && (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.endTime}</p>
                )}
              </div>
            </div>

            {/* Live Hall Availability Preview on Selected Date */}
            {form.eventDate && availabilitySlots.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="mb-2.5 text-xs font-bold text-slate-800">
                  {t.cabinet.liveAvailability} ({form.eventDate})
                </p>
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 md:grid-cols-7">
                  {availabilitySlots.map((slot) => {
                    const cls =
                      slot.slotState === "CONFIRMED"
                        ? "border-rose-300 bg-rose-100 text-rose-800"
                        : slot.slotState === "RESERVED" || slot.slotState === "PENDING"
                        ? "border-amber-300 bg-amber-100 text-amber-800"
                        : slot.slotState === "BLOCKED"
                        ? "border-slate-300 bg-slate-200 text-slate-700"
                        : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer";
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        disabled={slot.slotState !== "AVAILABLE"}
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            startTime: slot.startTime.slice(0, 5),
                            endTime: slot.endTime.slice(0, 5),
                          }))
                        }
                        title={slot.eventName || t.calendar.available}
                        className={`rounded-lg border px-2 py-1.5 text-center text-[11px] font-bold transition ${cls}`}
                      >
                        {slot.startTime.slice(0, 5)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="label" htmlFor="hall-participants">
                {t.cabinet.expectedParticipants} <span className="text-rose-500">*</span>
              </label>
              <input
                id="hall-participants"
                type="number"
                min={1}
                max={selectedHall?.capacity || 5000}
                className={`input ${fieldErrors.expectedParticipants ? "border-rose-400" : ""}`}
                value={form.expectedParticipants}
                onChange={(e) => {
                  setForm((p) => ({ ...p, expectedParticipants: e.target.value }));
                  setFieldErrors((p) => ({ ...p, expectedParticipants: "" }));
                }}
              />
              {fieldErrors.expectedParticipants && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.expectedParticipants}</p>
              )}
            </div>

            {/* Additional Equipment Selection */}
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Package size={16} style={{ color: "var(--brand-primary)" }} />
                    {t.cabinet.equipmentSection}
                  </h3>
                  <p className="text-xs text-slate-500">{t.cabinet.equipmentHint}</p>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {equipmentList.map((eq) => {
                  const qty = selectedEquipment[eq.id] || 0;
                  return (
                    <div
                      key={eq.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900">{eq.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {eq.category} ·{" "}
                          <span
                            className={
                              eq.availableQuantity > 0
                                ? "font-semibold text-emerald-700"
                                : "font-semibold text-rose-600"
                            }
                          >
                            {eq.availableQuantity}/{eq.totalQuantity} {t.cabinet.availableUnits}
                          </span>
                          {eq.unitFee > 0 ? ` · $${eq.unitFee}/unit` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={qty === 0}
                          onClick={() => handleEquipmentQty(eq.id, eq.availableQuantity, qty - 1)}
                          className="h-7 w-7 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-extrabold text-slate-900">
                          {qty}
                        </span>
                        <button
                          type="button"
                          disabled={qty >= eq.availableQuantity}
                          onClick={() => handleEquipmentQty(eq.id, eq.availableQuantity, qty + 1)}
                          className="h-7 w-7 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="hall-description">
                {t.cabinet.description}
              </label>
              <textarea
                id="hall-description"
                rows={3}
                maxLength={2000}
                className="input resize-none"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={submitting} className="btn-primary px-6 py-3">
                <Send size={16} />
                {submitting ? t.cabinet.submitting : t.cabinet.submitApplication}
              </button>
            </div>
          </form>
        </div>

        {/* Selected Hall Info & Pricing Preview */}
        <div className="space-y-5">
          {selectedHall && (
            <div className="card overflow-hidden">
              {selectedHall.imageUrl && (
                <img
                  src={selectedHall.imageUrl}
                  alt={selectedHall.name}
                  className="h-44 w-full object-cover"
                />
              )}
              <div className="p-6">
              <div className="flex items-center gap-2.5">
                <Building2 size={20} style={{ color: "var(--brand-primary)" }} />
                <h3 className="text-base font-extrabold text-slate-900">{selectedHall.name}</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {selectedHall.description}
              </p>

              <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t.cabinet.buildingFloor}</dt>
                  <dd className="font-semibold text-slate-800">
                    {selectedHall.building} ({selectedHall.floor})
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t.cabinet.capacity}</dt>
                  <dd className="font-semibold text-slate-800">
                    {selectedHall.capacity} {t.calendar.seats}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t.cabinet.hourlyRate}</dt>
                  <dd className="font-semibold text-slate-800">${selectedHall.hourlyRate}/hr</dd>
                </div>
                {estimatedFee && (
                  <div className="flex justify-between border-t border-slate-100 pt-2.5 text-sm">
                    <dt className="font-bold text-slate-700">{t.cabinet.estimatedTotal}</dt>
                    <dd className="font-extrabold" style={{ color: "var(--brand-primary)" }}>
                      ${estimatedFee}
                    </dd>
                  </div>
                )}
              </dl>
              </div>
            </div>
          )}

          {policy && (
            <div className="card p-5 text-xs text-slate-600">
              <h4 className="flex items-center gap-1.5 font-bold text-slate-900">
                <Info size={15} style={{ color: "var(--brand-primary)" }} /> {policy.name}
              </h4>
              <p className="mt-2 leading-relaxed">{policy.description}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List & Track My Applications + Payments + Cancellations + Confirmations
  return (
    <div className="space-y-5">
      {actionMsg && (
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
            actionMsg.type === "ok"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {actionMsg.type === "ok" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {loading ? (
        <div className="card h-48 animate-pulse bg-white" />
      ) : applications.length === 0 ? (
        <div className="card p-10 text-center">
          <Building2 size={36} className="mx-auto text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-900">{t.cabinet.noApplications}</h3>
        </div>
      ) : (
        <div className="space-y-5">
          {applications.map((app) => {
            const isBusy = busyId === app.id;
            const remaining = getTimeRemaining(app.paymentDeadline);
            const canRequestCancel =
              !app.cancellationRequest &&
              app.status !== "REJECTED" &&
              app.status !== "EXPIRED" &&
              app.status !== "CANCELLED";

            return (
              <div key={app.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-slate-200/80 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-800">
                        {app.applicationCode}
                      </span>
                      <BookingStatusBadge status={app.status} />
                      {app.paymentStatus && app.paymentStatus !== app.status && (
                        <BookingStatusBadge status={app.paymentStatus} />
                      )}
                    </div>
                    <h3 className="mt-1.5 text-lg font-extrabold text-slate-900">
                      {app.eventName}{" "}
                      <span className="text-sm font-medium text-slate-500">({app.eventType})</span>
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {app.status === "CONFIRMED" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDownloadPdf(app)}
                        className="btn-primary text-xs"
                      >
                        <Download size={15} /> {t.cabinet.downloadPdf}
                      </button>
                    )}

                    {canRequestCancel &&
                      (app.status === "CONFIRMED" || app.status === "PAYMENT_UNDER_REVIEW" ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => {
                            setCancelModalApp(app);
                            setCancelReason("");
                            setCancelError(null);
                          }}
                          className="btn-outline px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          <RotateCcw size={14} /> {t.cabinet.requestCancellation}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDirectCancel(app.id)}
                          className="btn-outline px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          <XCircle size={14} /> {t.common.cancel}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="space-y-5 p-6">
                  <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-start gap-2.5">
                      <MapPin size={17} className="mt-0.5 shrink-0 text-brand-600" />
                      <div>
                        <p className="text-xs text-slate-500">{t.cabinet.eventHallLabel}</p>
                        <p className="font-semibold text-slate-900">{app.hall.name}</p>
                        <p className="text-xs text-slate-500">{app.hall.building}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CalendarDays size={17} className="mt-0.5 shrink-0 text-brand-600" />
                      <div>
                        <p className="text-xs text-slate-500">{t.cabinet.dateTimeLabel}</p>
                        <p className="font-semibold text-slate-900">{app.eventDate}</p>
                        <p className="text-xs text-slate-500">
                          {app.startTime} – {app.endTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Users size={17} className="mt-0.5 shrink-0 text-brand-600" />
                      <div>
                        <p className="text-xs text-slate-500">{t.cabinet.participantsFeeLabel}</p>
                        <p className="font-semibold text-slate-900">
                          {app.expectedParticipants} {t.cabinet.expectedSuffix}
                        </p>
                        <p className="text-xs font-semibold text-brand-700">
                          ${app.requiredAmount} {t.cabinet.totalSuffix}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Clock size={17} className="mt-0.5 shrink-0 text-brand-600" />
                      <div>
                        <p className="text-xs text-slate-500">{t.cabinet.submittedOn}</p>
                        <p className="font-medium text-slate-800">{formatDateTime(app.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Equipment Reservations */}
                  {app.equipmentReservations && app.equipmentReservations.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Package size={14} /> {t.cabinet.requestedEquipment}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {app.equipmentReservations.map((eq) => (
                          <span
                            key={eq.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs"
                          >
                            <span className="font-semibold text-slate-900">
                              {eq.quantityRequested}x {eq.equipmentName}
                            </span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                              {eq.status}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cancellation & Refund Progress Card */}
                  {app.cancellationRequest && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-extrabold text-amber-950">
                          {t.cabinet.cancellationStatus}: {app.cancellationRequest.status}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-0.5 font-bold text-amber-900">
                          {t.cabinet.refundProgress}: {app.cancellationRequest.refundStatus}
                        </span>
                      </div>
                      <p className="mt-1 text-amber-900">
                        {t.cabinet.reasonLabel}: {app.cancellationRequest.reason}
                      </p>
                      {app.cancellationRequest.paidAmount > 0 && (
                        <p className="mt-1 text-amber-900">
                          {t.cabinet.eligibleRefund}:{" "}
                          <strong>
                            {app.cancellationRequest.eligibleRefundPercent}% ($
                            {app.cancellationRequest.eligibleRefundAmount})
                          </strong>
                          {app.cancellationRequest.approvedRefundAmount != null && (
                            <>
                              {" · "}{t.cabinet.refundedLabel}:{" "}
                              <strong>${app.cancellationRequest.approvedRefundAmount}</strong>
                            </>
                          )}
                          {app.cancellationRequest.refundTransactionRef && (
                            <>
                              {" · "}
                              {t.cabinet.refundRef}:{" "}
                              <strong className="font-mono">
                                {app.cancellationRequest.refundTransactionRef}
                              </strong>
                            </>
                          )}
                        </p>
                      )}
                      {app.cancellationRequest.adminComment && (
                        <p className="mt-1 font-medium text-slate-700">
                          {t.cabinet.adminNoteLabel}: {app.cancellationRequest.adminComment}
                        </p>
                      )}
                    </div>
                  )}

                  {app.adminComment && (
                    <div
                      className={`rounded-xl border px-4 py-3 text-xs ${
                        app.status === "REJECTED" || app.status === "PAYMENT_REJECTED"
                          ? "border-rose-200 bg-rose-50 text-rose-800"
                          : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="font-bold">{t.cabinet.adminNoteLabel}: </span>
                      {app.adminComment}
                    </div>
                  )}

                  {app.status === "UNDER_REVIEW" && (
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
                      <p className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                        <MessageSquareReply size={15} /> {t.cabinet.infoRequestedTitle}
                      </p>
                      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
                        <input
                          type="text"
                          className="input flex-1"
                          value={replyMap[app.id] || ""}
                          onChange={(e) =>
                            setReplyMap((p) => ({ ...p, [app.id]: e.target.value }))
                          }
                        />
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleSendReply(app.id)}
                          className="btn-primary shrink-0 text-xs"
                        >
                          {t.cabinet.submitReply}
                        </button>
                      </div>
                    </div>
                  )}

                  {(app.status === "PAYMENT_PENDING" || app.status === "PAYMENT_REJECTED") && (
                    <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="flex items-center gap-2 text-sm font-extrabold text-orange-950">
                          <CreditCard size={18} className="text-orange-600" />
                          {t.cabinet.paymentInstructions}
                        </h4>
                        {remaining && (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
                            {remaining} ({formatDateTime(app.paymentDeadline)})
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid gap-3 rounded-xl border border-orange-200/80 bg-white p-4 text-xs sm:grid-cols-3">
                        <div>
                          <span className="text-slate-500">{t.cabinet.bankCard}</span>
                          <p className="mt-0.5 font-mono text-sm font-extrabold text-slate-900">
                            {app.bankCardNumber}
                          </p>
                          <p className="text-[11px] text-slate-500">{app.bankName}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">{t.cabinet.cardholder}</span>
                          <p className="mt-0.5 font-bold text-slate-900">{app.bankCardHolder}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">{t.cabinet.requiredAmount}</span>
                          <p className="mt-0.5 text-lg font-extrabold text-brand-700">
                            ${app.requiredAmount}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                        <label className="btn-primary cursor-pointer text-xs">
                          <Upload size={15} />
                          {app.status === "PAYMENT_REJECTED"
                            ? t.cabinet.reuploadReceipt
                            : t.cabinet.uploadReceipt}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                            className="hidden"
                            disabled={isBusy}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              handleUploadReceipt(app.id, file);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {app.receiptUrl && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <SecureReceiptViewer
                        receiptUrl={app.receiptUrl}
                        filename={app.receiptFilename}
                      />
                    </div>
                  )}

                  {app.status === "CONFIRMED" && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <FileCheck2 size={20} className="mt-0.5 text-emerald-700" />
                          <div className="text-xs text-emerald-900">
                            <p className="text-sm font-extrabold">{t.cabinet.bookingConfirmedTitle}</p>
                            <p className="mt-0.5">
                              {t.cabinet.paidLabel} <strong>${app.requiredAmount}</strong> · {t.cabinet.verifiedByLabel}{" "}
                              <strong>{app.verifiedByAdmin}</strong>
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDownloadPdf(app)}
                          className="btn-primary text-xs"
                        >
                          <Download size={15} /> {t.cabinet.downloadPdf}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedHistory((p) => ({ ...p, [app.id]: !p[app.id] }))
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600"
                    >
                      <History size={14} /> {t.cabinet.actionHistory} ({app.history.length})
                    </button>

                    {expandedHistory[app.id] && (
                      <ul className="mt-3 space-y-2 border-l-2 border-slate-200 pl-4">
                        {app.history.map((h) => (
                          <li key={h.id} className="text-xs">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-800">{h.action}</span>
                              <BookingStatusBadge status={h.newStatus} />
                              <span className="text-slate-400">
                                {h.actorFullName} ({h.actorRole}) · {formatDateTime(h.createdAt)}
                              </span>
                            </div>
                            {h.comment && <p className="mt-0.5 text-slate-600">{h.comment}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Cancellation Modal */}
      {cancelModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                {t.cabinet.requestCancellation}
              </h3>
              <button
                onClick={() => setCancelModalApp(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {policy && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-bold text-slate-800">{policy.name}</p>
                <p className="mt-1">{policy.description}</p>
              </div>
            )}

            {cancelError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                <AlertCircle size={15} /> {cancelError}
              </div>
            )}

            <form className="mt-4 space-y-4" onSubmit={handleSubmitCancellationRequest}>
              <div>
                <label className="label">{t.cabinet.cancelReasonPrompt}</label>
                <textarea
                  rows={3}
                  required
                  className="input"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelModalApp(null)}
                  className="btn-outline"
                >
                  {t.common.cancel}
                </button>
                <button type="submit" disabled={busyId === cancelModalApp.id} className="btn-danger">
                  {t.cabinet.submitCancellation}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
