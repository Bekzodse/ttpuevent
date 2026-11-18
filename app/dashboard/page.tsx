"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock,
  KeyRound,
  Phone,
  Save,
  Shield,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import HallBookingSection from "@/components/HallBookingSection";
import UserAvatar from "@/components/UserAvatar";
import { ApiError, eventsApi, userApi } from "@/lib/api";
import { HallApplication, UniversityEvent } from "@/lib/types";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export default function PersonalCabinetPage() {
  const router = useRouter();
  const { user, loading, updateUserState, refreshUser } = useAuth();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"bookings" | "book" | "profile">("bookings");
  const [submittedApp, setSubmittedApp] = useState<HallApplication | null>(null);

  const formatDateTime = (iso: string | null) => {
    if (!iso) return t.cabinet.never;
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    bio: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string>>({});

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwFieldErrors, setPwFieldErrors] = useState<Record<string, string>>({});

  const [myEvents, setMyEvents] = useState<UniversityEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const qTab = new URLSearchParams(window.location.search).get("tab");
      if (qTab === "book" || qTab === "profile" || qTab === "bookings") {
        setTab(qTab);
      }
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        email: user.email || "",
        bio: user.bio || "",
      });
      eventsApi
        .myEvents()
        .then(setMyEvents)
        .catch(() => setMyEvents([]))
        .finally(() => setEventsLoading(false));
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="space-y-6">
        <div className="card h-36 animate-pulse bg-white" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card h-80 animate-pulse bg-white lg:col-span-2" />
          <div className="card h-80 animate-pulse bg-white" />
        </div>
      </div>
    );
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);
    setProfileFieldErrors({});

    const errs: Record<string, string> = {};
    if (profileForm.firstName.trim().length < 2) {
      errs.firstName = t.auth.valFirstName;
    }
    if (profileForm.lastName.trim().length < 2) {
      errs.lastName = t.auth.valLastName;
    }
    const digits = profileForm.phoneNumber.replace(/[^0-9]/g, "");
    if (!/^\+?[0-9\s\-()]{7,20}$/.test(profileForm.phoneNumber.trim()) || digits.length < 7) {
      errs.phoneNumber = t.auth.valPhone;
    }
    if (Object.keys(errs).length > 0) {
      setProfileFieldErrors(errs);
      return;
    }

    setProfileSaving(true);
    try {
      const updated = await userApi.updateProfile({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        phoneNumber: profileForm.phoneNumber.trim(),
        email: profileForm.email.trim() || undefined,
        bio: profileForm.bio.trim(),
      });
      updateUserState(updated);
      setProfileSuccess(t.cabinet.profileUpdatedOk);
    } catch (err) {
      if (err instanceof ApiError) {
        setProfileError(err.message);
        if (err.fieldErrors) setProfileFieldErrors(err.fieldErrors);
      } else {
        setProfileError(t.cabinet.profileUpdateErr);
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAvatarMsg(null);
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setAvatarMsg({
        type: "err",
        text: t.cabinet.avatarInvalidErr,
      });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarMsg({
        type: "err",
        text: t.cabinet.avatarSizeErr,
      });
      return;
    }

    setAvatarBusy(true);
    try {
      const updated = await userApi.uploadAvatar(file);
      updateUserState(updated);
      setAvatarMsg({ type: "ok", text: t.cabinet.avatarUpdatedOk });
    } catch (err) {
      setAvatarMsg({
        type: "err",
        text: err instanceof ApiError ? err.message : t.cabinet.profileUpdateErr,
      });
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleAvatarDelete = async () => {
    setAvatarMsg(null);
    setAvatarBusy(true);
    try {
      const updated = await userApi.deleteAvatar();
      updateUserState(updated);
      setAvatarMsg({ type: "ok", text: t.cabinet.avatarRemovedOk });
    } catch (err) {
      setAvatarMsg({
        type: "err",
        text: err instanceof ApiError ? err.message : t.cabinet.profileUpdateErr,
      });
    } finally {
      setAvatarBusy(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    setPwFieldErrors({});

    const errs: Record<string, string> = {};
    if (!pwForm.currentPassword) errs.currentPassword = t.cabinet.pwCurrentReq;
    if (pwForm.newPassword.length < 6) {
      errs.newPassword = t.cabinet.pwMinLen;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      errs.confirmPassword = t.cabinet.pwMismatch;
    }
    if (Object.keys(errs).length > 0) {
      setPwFieldErrors(errs);
      return;
    }

    setPwSaving(true);
    try {
      const res = await userApi.changePassword(pwForm);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwMsg({ type: "ok", text: res.message });
      await refreshUser();
    } catch (err) {
      if (err instanceof ApiError) {
        setPwMsg({ type: "err", text: err.message });
        if (err.fieldErrors) setPwFieldErrors(err.fieldErrors);
      } else {
        setPwMsg({ type: "err", text: t.cabinet.pwUpdatedErr });
      }
    } finally {
      setPwSaving(false);
    }
  };

  const handleUnregisterEvent = async (eventId: number) => {
    try {
      await eventsApi.unregister(eventId);
      setMyEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Header Banner */}
      <section className="card overflow-hidden">
        <div className="brand-gradient h-24" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="rounded-full bg-white p-1.5 shadow-md">
                <UserAvatar
                  firstName={user.firstName}
                  lastName={user.lastName}
                  profilePictureUrl={user.profilePictureUrl}
                  size="xl"
                  online={user.active}
                />
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    {user.firstName} {user.lastName}
                  </h1>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-brand-50 text-brand-700"
                    }`}
                  >
                    {user.role}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    {user.active ? t.cabinet.activeAccount : t.cabinet.inactiveAccount}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  @{user.username} · {user.phoneNumber}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                disabled={avatarBusy}
                onClick={() => fileInputRef.current?.click()}
                className="btn-outline text-xs"
              >
                <Camera size={15} />
                {user.profilePictureUrl ? t.cabinet.changePicture : t.cabinet.uploadPicture}
              </button>
              {user.profilePictureUrl && (
                <button
                  type="button"
                  disabled={avatarBusy}
                  onClick={handleAvatarDelete}
                  className="btn-outline text-xs text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 size={15} />
                  {t.calendar.removeBlock}
                </button>
              )}
              <button
                type="button"
                onClick={() => setTab("book")}
                className="btn-primary text-xs"
              >
                <Building2 size={15} /> {t.cabinet.bookEventHallBtn}
              </button>
            </div>
          </div>

          {avatarMsg && (
            <div
              className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
                avatarMsg.type === "ok"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {avatarMsg.type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{avatarMsg.text}</span>
            </div>
          )}
        </div>
      </section>

      {/* Submitted Confirmation Banner ("Arizangiz qabul qilindi! Tez orada siz bilan aloqaga chiqamiz.") */}
      {submittedApp && (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-950 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-emerald-950">
                {t.cabinet.appAcceptedTitle}
              </h2>
              <p className="mt-0.5 text-sm font-medium text-emerald-800">
                {t.cabinet.appAcceptedSubtitle}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="rounded-lg bg-white px-2.5 py-1 font-mono text-emerald-900 shadow-sm">
                  {submittedApp.applicationCode}
                </span>
                <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-emerald-900">
                  {submittedApp.hall.name}
                </span>
                <span className="rounded-lg bg-emerald-100 px-2.5 py-1 font-mono text-emerald-900">
                  {submittedApp.eventDate} · {submittedApp.startTime}–{submittedApp.endTime}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubmittedApp(null)}
            className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-100"
            aria-label={t.common.close}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Personal Cabinet Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab("bookings")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            tab === "bookings"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ClipboardList size={16} /> {t.cabinet.tabBookings}
        </button>
        <button
          onClick={() => setTab("book")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            tab === "book"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 size={16} /> {t.cabinet.tabBook}
        </button>
        <button
          onClick={() => setTab("profile")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            tab === "profile"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <UserIcon size={16} /> {t.cabinet.tabProfile}
        </button>
      </div>

      {tab === "bookings" && <HallBookingSection user={user} mode="list" />}

      {tab === "book" && (
        <HallBookingSection
          user={user}
          mode="apply"
          onSubmitted={(created) => {
            setSubmittedApp(created);
            setTab("bookings");
          }}
        />
      )}

      {tab === "profile" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left 2 Columns: Personal Info & Password Change */}
          <div className="space-y-6 lg:col-span-2">
            {/* Edit Personal Information */}
            <section className="card p-6">
              <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <UserIcon size={18} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{t.cabinet.personalInfo}</h2>
                  <p className="text-xs text-slate-500">{t.cabinet.personalInfoSub}</p>
                </div>
              </div>

              {profileSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  <CheckCircle2 size={17} /> {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  <AlertCircle size={17} /> {profileError}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleProfileSave} noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="cab-firstName">
                      {t.auth.firstName}
                    </label>
                    <input
                      id="cab-firstName"
                      type="text"
                      className={`input ${profileFieldErrors.firstName ? "border-rose-400" : ""}`}
                      value={profileForm.firstName}
                      onChange={(e) => {
                        setProfileForm((p) => ({ ...p, firstName: e.target.value }));
                        setProfileFieldErrors((p) => ({ ...p, firstName: "" }));
                      }}
                    />
                    {profileFieldErrors.firstName && (
                      <p className="mt-1 text-xs text-rose-600">{profileFieldErrors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="label" htmlFor="cab-lastName">
                      {t.auth.lastName}
                    </label>
                    <input
                      id="cab-lastName"
                      type="text"
                      className={`input ${profileFieldErrors.lastName ? "border-rose-400" : ""}`}
                      value={profileForm.lastName}
                      onChange={(e) => {
                        setProfileForm((p) => ({ ...p, lastName: e.target.value }));
                        setProfileFieldErrors((p) => ({ ...p, lastName: "" }));
                      }}
                    />
                    {profileFieldErrors.lastName && (
                      <p className="mt-1 text-xs text-rose-600">{profileFieldErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="cab-phone">
                    {t.auth.phoneNumber}
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="cab-phone"
                      type="tel"
                      className={`input pl-10 ${
                        profileFieldErrors.phoneNumber ? "border-rose-400" : ""
                      }`}
                      value={profileForm.phoneNumber}
                      onChange={(e) => {
                        setProfileForm((p) => ({ ...p, phoneNumber: e.target.value }));
                        setProfileFieldErrors((p) => ({ ...p, phoneNumber: "" }));
                      }}
                    />
                  </div>
                  {profileFieldErrors.phoneNumber && (
                    <p className="mt-1 text-xs text-rose-600">{profileFieldErrors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <label className="label" htmlFor="cab-email">
                    Email
                  </label>
                  <input
                    id="cab-email"
                    type="email"
                    className={`input ${
                      profileFieldErrors.email ? "border-rose-400" : ""
                    }`}
                    placeholder="student@turin.uz"
                    value={profileForm.email}
                    onChange={(e) => {
                      setProfileForm((p) => ({ ...p, email: e.target.value }));
                      setProfileFieldErrors((p) => ({ ...p, email: "" }));
                    }}
                  />
                  {profileFieldErrors.email && (
                    <p className="mt-1 text-xs text-rose-600">{profileFieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="label" htmlFor="cab-bio">
                    {t.cabinet.bioLabel}
                  </label>
                  <textarea
                    id="cab-bio"
                    rows={3}
                    maxLength={500}
                    className="input resize-none"
                    placeholder={t.cabinet.bioPlaceholder}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={profileSaving} className="btn-primary">
                    <Save size={16} />
                    {profileSaving ? t.cabinet.saving : t.cabinet.saveChanges}
                  </button>
                </div>
              </form>
            </section>

            {/* Change Password */}
            <section className="card p-6">
              <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                  <KeyRound size={18} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{t.cabinet.securityPassword}</h2>
                  <p className="text-xs text-slate-500">{t.cabinet.securityPasswordSub}</p>
                </div>
              </div>

              {pwMsg && (
                <div
                  className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                    pwMsg.type === "ok"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {pwMsg.type === "ok" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
                  <span>{pwMsg.text}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handlePasswordChange} noValidate>
                <div>
                  <label className="label" htmlFor="pw-current">
                    {t.cabinet.currentPassword}
                  </label>
                  <input
                    id="pw-current"
                    type="password"
                    className={`input ${pwFieldErrors.currentPassword ? "border-rose-400" : ""}`}
                    value={pwForm.currentPassword}
                    onChange={(e) => {
                      setPwForm((p) => ({ ...p, currentPassword: e.target.value }));
                      setPwFieldErrors((p) => ({ ...p, currentPassword: "" }));
                    }}
                  />
                  {pwFieldErrors.currentPassword && (
                    <p className="mt-1 text-xs text-rose-600">{pwFieldErrors.currentPassword}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="pw-new">
                      {t.cabinet.newPassword}
                    </label>
                    <input
                      id="pw-new"
                      type="password"
                      className={`input ${pwFieldErrors.newPassword ? "border-rose-400" : ""}`}
                      value={pwForm.newPassword}
                      onChange={(e) => {
                        setPwForm((p) => ({ ...p, newPassword: e.target.value }));
                        setPwFieldErrors((p) => ({ ...p, newPassword: "" }));
                      }}
                    />
                    {pwFieldErrors.newPassword && (
                      <p className="mt-1 text-xs text-rose-600">{pwFieldErrors.newPassword}</p>
                    )}
                  </div>

                  <div>
                    <label className="label" htmlFor="pw-confirm">
                      {t.cabinet.confirmNewPassword}
                    </label>
                    <input
                      id="pw-confirm"
                      type="password"
                      className={`input ${pwFieldErrors.confirmPassword ? "border-rose-400" : ""}`}
                      value={pwForm.confirmPassword}
                      onChange={(e) => {
                        setPwForm((p) => ({ ...p, confirmPassword: e.target.value }));
                        setPwFieldErrors((p) => ({ ...p, confirmPassword: "" }));
                      }}
                    />
                    {pwFieldErrors.confirmPassword && (
                      <p className="mt-1 text-xs text-rose-600">{pwFieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={pwSaving} className="btn-outline">
                    <KeyRound size={16} />
                    {pwSaving ? t.cabinet.updating : t.cabinet.updatePassword}
                  </button>
                </div>
              </form>
            </section>
          </div>

          {/* Right Column: Account Info & Registered Events */}
          <div className="space-y-6">
            <section className="card p-6">
              <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-700">
                  <Shield size={18} />
                </span>
                <h2 className="text-base font-bold text-slate-900">{t.cabinet.accountInfo}</h2>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">{t.cabinet.accountId}</dt>
                  <dd className="font-mono font-semibold text-slate-900">#{user.id}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">{t.auth.username}</dt>
                  <dd className="font-semibold text-slate-900">@{user.username}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">{t.cabinet.roleLabel}</dt>
                  <dd>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-brand-50 text-brand-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">{t.cabinet.statusLabel}</dt>
                  <dd className="font-semibold text-emerald-700">
                    {user.active ? t.common.active : t.common.inactive}
                  </dd>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarDays size={13} /> {t.cabinet.registeredOn}
                  </dt>
                  <dd className="mt-0.5 font-medium text-slate-800">
                    {formatDateTime(user.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock size={13} /> {t.cabinet.lastLogin}
                  </dt>
                  <dd className="mt-0.5 font-medium text-slate-800">
                    {formatDateTime(user.lastLoginAt)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="card p-6">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">{t.cabinet.myCampusEvents}</h2>
                <Link href="/events" className="text-xs font-semibold text-brand-600 hover:underline">
                  {t.cabinet.browseAll}
                </Link>
              </div>

              {eventsLoading ? (
                <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
              ) : myEvents.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {t.cabinet.noEventsRegistered}{" "}
                  <Link href="/events" className="font-semibold text-brand-600 hover:underline">
                    {t.cabinet.exploreCampusEvents}
                  </Link>
                </p>
              ) : (
                <ul className="space-y-3">
                  {myEvents.map((ev) => (
                    <li
                      key={ev.id}
                      className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/events/${ev.id}`}
                          className="block truncate text-sm font-semibold text-slate-900 hover:text-brand-600"
                        >
                          {ev.title}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {ev.date} · {ev.location}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnregisterEvent(ev.id)}
                        className="shrink-0 text-xs font-medium text-rose-600 hover:underline"
                      >
                        {t.common.cancel}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
