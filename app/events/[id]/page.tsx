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
  X,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import { ApiError, eventsApi, resolveEventImageUrl } from "@/lib/api";
import { UniversityEvent } from "@/lib/types";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { locale, t } = useI18n();

  const [event, setEvent] = useState<UniversityEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [regModalOpen, setRegModalOpen] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regForm, setRegForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    department: "",
    studentCode: "",
    notes: "",
  });

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
  const closed =
    event.status === "Completed" ||
    event.status === "Cancelled" ||
    event.published === false ||
    left <= 0;
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

  const modalCopy =
    locale === "uz"
      ? {
          title: "Tadbirga ro‘yxatdan o‘tish",
          subtitle: "Ishtirok etish uchun talaba ma’lumotlarini tasdiqlang yoki kiriting.",
          fullName: "To‘liq ism-familiya",
          phone: "Telefon raqam",
          email: "Email manzil",
          department: "Fakultet / Yo‘nalish",
          studentCode: "Talaba ID / Guruh (ixtiyoriy)",
          notes: "Qo‘shimcha izoh (ixtiyoriy)",
          confirm: "Ro‘yxatdan o‘tishni tasdiqlash",
          submitting: "Saqlanmoqda...",
          nameErr: "Iltimos, to‘liq ism-familiyangizni kiriting (kamida 2 belgi).",
          phoneErr: "Iltimos, to‘g‘ri telefon raqamini kiriting (masalan: +998901234567).",
        }
      : locale === "ru"
      ? {
          title: "Регистрация на мероприятие",
          subtitle: "Заполните или подтвердите данные студента перед регистрацией.",
          fullName: "Полное имя (ФИО)",
          phone: "Номер телефона",
          email: "Email",
          department: "Факультет / Направление",
          studentCode: "ID студента / Группа (необязательно)",
          notes: "Комментарий (необязательно)",
          confirm: "Подтвердить регистрацию",
          submitting: "Регистрация...",
          nameErr: "Введите полное имя (минимум 2 символа).",
          phoneErr: "Введите корректный номер телефона (напр. +998901234567).",
        }
      : {
          title: "Event Registration",
          subtitle: "Please enter or confirm your student details before completing registration.",
          fullName: "Full Name",
          phone: "Phone Number",
          email: "Email Address",
          department: "Faculty / Department",
          studentCode: "Student ID / Group (optional)",
          notes: "Notes / Comments (optional)",
          confirm: "Confirm Registration",
          submitting: "Registering...",
          nameErr: "Please enter your full name (at least 2 characters).",
          phoneErr: "Please enter a valid phone number (e.g. +998901234567).",
        };

  const openRegistrationModal = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setError(null);
    setRegError(null);
    setRegForm({
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      phoneNumber: user.phoneNumber || "",
      email: user.email || "",
      department: user.department || "",
      studentCode: "",
      notes: "",
    });
    setRegModalOpen(true);
  };

  const handleConfirmRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (regForm.fullName.trim().length < 2) {
      setRegError(modalCopy.nameErr);
      return;
    }
    const digits = regForm.phoneNumber.replace(/[^0-9]/g, "");
    if (!/^\+?[0-9\s\-()]{7,20}$/.test(regForm.phoneNumber.trim()) || digits.length < 7) {
      setRegError(modalCopy.phoneErr);
      return;
    }

    setBusy(true);
    try {
      const updated = await eventsApi.register(event.id, {
        fullName: regForm.fullName.trim(),
        phoneNumber: regForm.phoneNumber.trim(),
        email: regForm.email.trim() || undefined,
        department: regForm.department.trim() || undefined,
        studentCode: regForm.studentCode.trim() || undefined,
        notes: regForm.notes.trim() || undefined,
      });
      setEvent(updated);
      setRegModalOpen(false);
    } catch (err) {
      setRegError(err instanceof ApiError ? err.message : "Could not complete registration.");
    } finally {
      setBusy(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const updated = await eventsApi.unregister(event.id);
      setEvent(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not cancel registration.");
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
        <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${event.gradient} p-6 sm:h-60`}>
          {imgSrc && (
            <img
              src={imgSrc}
              alt={event.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              {categoryLabel}
            </span>
            {event.status !== "Upcoming" && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm ${
                  event.status === "Cancelled" ? "bg-rose-600/90" : "bg-slate-900/75"
                }`}
              >
                {event.status}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-extrabold text-slate-900">{event.title}</h1>
            <h2 className="mt-6 text-lg font-bold text-slate-900">{t.events.aboutEvent}</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-600">
              {event.description}
            </p>
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
                  onClick={handleCancelRegistration}
                  disabled={busy}
                  className="btn-outline w-full text-xs text-rose-600 hover:bg-rose-50"
                >
                  {busy ? t.events.processing : t.events.cancelRegistration}
                </button>
              </div>
            ) : (
              <button
                onClick={openRegistrationModal}
                disabled={busy || closed}
                className="btn-primary w-full"
              >
                <Ticket size={18} />
                {closed
                  ? event.status === "Cancelled"
                    ? "Event Cancelled"
                    : event.status === "Completed"
                    ? t.events.eventEnded
                    : t.events.noSeatsLeft
                  : user
                  ? t.events.registerForEvent
                  : t.nav.signIn}
              </button>
            )}
          </aside>
        </div>
      </div>

      {/* Student Registration Details Modal */}
      {regModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="card max-h-[92vh] w-full max-w-lg overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{modalCopy.title}</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {event.title} · {event.date} {event.time}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRegModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-600">{modalCopy.subtitle}</p>

            {regError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                <AlertCircle size={15} /> {regError}
              </div>
            )}

            <form className="mt-4 space-y-3.5" onSubmit={handleConfirmRegistration}>
              <div>
                <label className="label">
                  {modalCopy.fullName} <span className="text-rose-500">*</span>
                </label>
                <input
                  className="input"
                  required
                  minLength={2}
                  maxLength={160}
                  value={regForm.fullName}
                  onChange={(e) => setRegForm((p) => ({ ...p, fullName: e.target.value }))}
                />
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="label">
                    {modalCopy.phone} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="input"
                    required
                    placeholder="+998901234567"
                    value={regForm.phoneNumber}
                    onChange={(e) => setRegForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">{modalCopy.email}</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="student@turin.uz"
                    value={regForm.email}
                    onChange={(e) => setRegForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="label">{modalCopy.department}</label>
                  <input
                    className="input"
                    placeholder="Computer Science"
                    value={regForm.department}
                    onChange={(e) => setRegForm((p) => ({ ...p, department: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">{modalCopy.studentCode}</label>
                  <input
                    className="input"
                    placeholder="U221045 / SE-21"
                    maxLength={60}
                    value={regForm.studentCode}
                    onChange={(e) => setRegForm((p) => ({ ...p, studentCode: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="label">{modalCopy.notes}</label>
                <textarea
                  rows={2}
                  maxLength={500}
                  className="input resize-none"
                  value={regForm.notes}
                  onChange={(e) => setRegForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRegModalOpen(false)}
                  className="btn-outline px-4 py-2 text-xs"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-primary px-4 py-2 text-xs"
                >
                  <Ticket size={14} />
                  {busy ? modalCopy.submitting : modalCopy.confirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
