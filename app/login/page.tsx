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
  LogIn,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import { useThemeAndBranding } from "@/components/ThemeAndBrandingProvider";
import { ApiError, resolveAvatarUrl } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, sessionNotice, clearSessionNotice } = useAuth();
  const { t } = useI18n();
  const { branding } = useThemeAndBranding();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      if (user.role === "ADMIN") {
        router.replace("/admin");
        return;
      }
      const nextParam =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;
      const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("/admin") ? nextParam : "/dashboard";
      router.replace(safeNext);
    }
  }, [user, router]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!username.trim()) errs.username = t.auth.valUsernameReq;
    else if (username.trim().length < 3) errs.username = t.auth.valUsernameLen;
    if (!password) errs.password = t.auth.valPasswordReq;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    clearSessionNotice();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const loggedIn = await login(username.trim(), password);
      if (loggedIn.role === "ADMIN") {
        router.push("/admin");
      } else {
        const nextParam =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("next")
            : null;
        const safeNext =
          nextParam && nextParam.startsWith("/") && !nextParam.startsWith("/admin")
            ? nextParam
            : "/dashboard";
        router.push(safeNext);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const logoSrc = resolveAvatarUrl(branding.logoUrl);

  return (
    <div className="mx-auto grid max-w-5xl items-center gap-8 py-4 lg:grid-cols-2">
      <div className="brand-gradient hidden space-y-6 rounded-3xl p-10 text-white shadow-xl lg:block">
        <div className="flex items-center gap-3">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={branding.universityName}
              className="h-12 w-12 rounded-2xl border border-white/30 bg-white object-cover"
            />
          ) : (
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <GraduationCap size={26} />
            </span>
          )}
          <div>
            <p className="font-extrabold">{branding.universityName}</p>
            <p className="text-xs text-white/80">{branding.universitySubtitle}</p>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold leading-tight">{branding.loginHeadline}</h1>
        <p className="text-sm leading-relaxed text-white/85">{branding.loginDescription}</p>
      </div>

      <div className="card p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={branding.universityName}
              className="h-12 w-12 rounded-2xl border border-slate-200 object-cover"
            />
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <ShieldCheck size={24} />
            </span>
          )}
          <h2 className="mt-3 text-2xl font-extrabold text-slate-900">{t.auth.signInTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">{t.auth.signInSubtitle}</p>
        </div>

        {(error || sessionNotice) && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error || sessionNotice}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="label" htmlFor="login-username">
              {t.auth.username}
            </label>
            <div className="relative">
              <UserIcon
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                className={`input pl-10 ${fieldErrors.username ? "border-rose-400" : ""}`}
                placeholder={t.auth.username}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setFieldErrors((p) => ({ ...p, username: "" }));
                }}
              />
            </div>
            {fieldErrors.username && (
              <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.username}</p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="login-password">
              {t.auth.password}
            </label>
            <div className="relative">
              <KeyRound
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className={`input pl-10 pr-10 ${fieldErrors.password ? "border-rose-400" : ""}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((p) => ({ ...p, password: "" }));
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.password}</p>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
            <LogIn size={18} />
            {submitting ? t.auth.signingIn : t.auth.signInTitle}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          {t.auth.noAccount}{" "}
          <Link href="/register" className="font-semibold text-brand-600 hover:underline">
            {t.auth.registerHere}
          </Link>
        </p>
      </div>
    </div>
  );
}
