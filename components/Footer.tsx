"use client";

import Link from "next/link";
import { GraduationCap, Mail, MapPin, Phone } from "lucide-react";
import { useI18n } from "./I18nProvider";
import { useThemeAndBranding } from "./ThemeAndBrandingProvider";
import { resolveAvatarUrl } from "@/lib/api";

export default function Footer() {
  const { t } = useI18n();
  const { branding } = useThemeAndBranding();
  const logoSrc = resolveAvatarUrl(branding.logoUrl);

  return (
    <footer className="mt-16 border-t border-slate-200/70 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 py-8 text-sm text-slate-500 md:flex-row md:items-center sm:px-6 lg:px-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            {logoSrc ? (
              <img src={logoSrc} alt={branding.universityName} className="h-7 w-7 rounded-lg object-cover" />
            ) : (
              <GraduationCap size={18} style={{ color: "var(--brand-primary)" }} />
            )}
            <span className="font-bold text-slate-800">{branding.universityName}</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            {branding.contactEmail && (
              <span className="inline-flex items-center gap-1">
                <Mail size={13} /> {branding.contactEmail}
              </span>
            )}
            {branding.contactPhone && (
              <span className="inline-flex items-center gap-1">
                <Phone size={13} /> {branding.contactPhone}
              </span>
            )}
            {branding.contactAddress && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} /> {branding.contactAddress}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-slate-500">
          <Link href="/calendar" className="hover:text-brand-600">
            {t.nav.calendar}
          </Link>
          <Link href="/events" className="hover:text-brand-600">
            {t.nav.events}
          </Link>
          <Link href="/dashboard" className="hover:text-brand-600">
            {t.nav.cabinet}
          </Link>
          <Link href="/login" className="hover:text-brand-600">
            {t.nav.signIn}
          </Link>
        </div>
      </div>
    </footer>
  );
}
