"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Phone,
  UserPlus,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import { useThemeAndBranding } from "@/components/ThemeAndBrandingProvider";
import { ApiError, resolveAvatarUrl } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { user, register } = useAuth();
  const { t } = useI18n();
  const { branding } = useThemeAndBranding();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      router.replace(user.role === "ADMIN" ? "/admin" : "/dashboard");
    }
  }, [user, router]);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (form.firstName.trim().length < 2) errs.firstName = t.auth.valFirstName;
    if (form.lastName.trim().length < 2) errs.lastName = t.auth.valLastName;
    const digits = form.phoneNumber.replace(/[^0-9]/g, "");
    if (!/^\+?[0-9\s\-()]{7,20}$/.test(form.phoneNumber.trim()) || digits.length < 7) {
      errs.phoneNumber = t.auth.valPhone;
    }
    if (!/^[a-zA-Z0-9._-]{3,50}$/.test(form.username.trim())) {
      errs.username = t.auth.valUsernameLen;
    }
    if (form.password.length < 6) errs.password = t.auth.valPasswordLen;
    if (form.password !== form.confirmPassword) errs.confirmPassword = t.auth.valPasswordMatch;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        username: form.username.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
      });
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fieldErrors) setFieldErrors((p) => ({ ...p, ...err.fieldErrors }));
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const logoSrc = resolveAvatarUrl(branding.logoUrl);

  return (
    <div className="mx-auto max-w-xl py-2">
      <div className="card p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={branding.universityName}
              className="h-12 w-12 rounded-2xl border border-slate-200 object-cover"
            />
          ) : (
            <span className="brand-gradient grid h-12 w-12 place-items-center rounded-2xl text-white shadow-sm">
              <GraduationCap size={24} />
            </span>
          )}
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">{t.auth.createTitle}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.auth.createSubtitle}</p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="reg-firstName">
                {t.auth.firstName} <span className="text-rose-500">*</span>
              </label>
              <input
                id="reg-firstName"
                type="text"
                className={`input ${fieldErrors.firstName ? "border-rose-400" : ""}`}
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
              />
              {fieldErrors.firstName && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.firstName}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="reg-lastName">
                {t.auth.lastName} <span className="text-rose-500">*</span>
              </label>
              <input
                id="reg-lastName"
                type="text"
                className={`input ${fieldErrors.lastName ? "border-rose-400" : ""}`}
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
              />
              {fieldErrors.lastName && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="reg-phone">
                {t.auth.phoneNumber} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="reg-phone"
                  type="tel"
                  className={`input pl-10 ${fieldErrors.phoneNumber ? "border-rose-400" : ""}`}
                  placeholder="+998901234567"
                  value={form.phoneNumber}
                  onChange={(e) => setField("phoneNumber", e.target.value)}
                />
              </div>
              {fieldErrors.phoneNumber && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.phoneNumber}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="reg-username">
                {t.auth.username} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserIcon
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="reg-username"
                  type="text"
                  autoComplete="username"
                  className={`input pl-10 ${fieldErrors.username ? "border-rose-400" : ""}`}
                  value={form.username}
                  onChange={(e) => setField("username", e.target.value)}
                />
              </div>
              {fieldErrors.username && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.username}</p>
              )}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="reg-email">
              Email <span className="text-xs font-normal text-slate-400">{t.auth.optional}</span>
            </label>
            <input
              id="reg-email"
              type="email"
              className={`input ${fieldErrors.email ? "border-rose-400" : ""}`}
              placeholder="student@turin.uz"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.email}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="reg-password">
                {t.auth.password} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <KeyRound
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={`input pl-10 pr-10 ${fieldErrors.password ? "border-rose-400" : ""}`}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="reg-confirm">
                {t.auth.confirmPassword} <span className="text-rose-500">*</span>
              </label>
              <input
                id="reg-confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className={`input ${fieldErrors.confirmPassword ? "border-rose-400" : ""}`}
                value={form.confirmPassword}
                onChange={(e) => setField("confirmPassword", e.target.value)}
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs font-medium text-rose-600">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
            <UserPlus size={18} />
            {submitting ? t.auth.creatingAccount : t.auth.createBtn}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          {t.auth.alreadyRegistered}{" "}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            {t.auth.signInInstead}
          </Link>
        </p>
      </div>
    </div>
  );
}
