"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Palette, Save, Trash2 } from "lucide-react";
import { useI18n } from "./I18nProvider";
import { useThemeAndBranding } from "./ThemeAndBrandingProvider";
import { ApiError, brandingApi, resolveAvatarUrl } from "@/lib/api";

export default function AdminBrandingTab({
  onBanner,
}: {
  onBanner: (b: { type: "ok" | "err"; text: string }) => void;
}) {
  const { t } = useI18n();
  const { branding, refreshBranding } = useThemeAndBranding();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    universityName: "",
    universitySubtitle: "",
    loginHeadline: "",
    loginDescription: "",
    primaryColor: "#4f46e5",
    secondaryColor: "#7c3aed",
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    websiteUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm({
      universityName: branding.universityName,
      universitySubtitle: branding.universitySubtitle,
      loginHeadline: branding.loginHeadline,
      loginDescription: branding.loginDescription,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      contactEmail: branding.contactEmail || "",
      contactPhone: branding.contactPhone || "",
      contactAddress: branding.contactAddress || "",
      websiteUrl: branding.websiteUrl || "",
    });
  }, [branding]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await brandingApi.update(form);
      await refreshBranding();
      onBanner({ type: "ok", text: "University branding updated across the portal." });
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to save branding.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      await brandingApi.uploadLogo(file);
      await refreshBranding();
      onBanner({ type: "ok", text: "University logo updated." });
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to upload logo.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    setUploading(true);
    try {
      await brandingApi.deleteLogo();
      await refreshBranding();
      onBanner({ type: "ok", text: "University logo removed." });
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to remove logo.",
      });
    } finally {
      setUploading(false);
    }
  };

  const logoSrc = resolveAvatarUrl(branding.logoUrl);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card p-6 lg:col-span-2">
        <h2 className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3 text-lg font-extrabold text-slate-900">
          <Palette size={20} style={{ color: "var(--brand-primary)" }} />
          {t.admin.brandingSettings}
        </h2>

        <form className="space-y-4" onSubmit={handleSave}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">{t.admin.universityName}</label>
              <input
                className="input"
                required
                value={form.universityName}
                onChange={(e) => setForm((p) => ({ ...p, universityName: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">{t.admin.universitySubtitle}</label>
              <input
                className="input"
                required
                value={form.universitySubtitle}
                onChange={(e) => setForm((p) => ({ ...p, universitySubtitle: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="label">{t.admin.loginHeadline}</label>
            <input
              className="input"
              required
              value={form.loginHeadline}
              onChange={(e) => setForm((p) => ({ ...p, loginHeadline: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">{t.admin.loginDescription}</label>
            <textarea
              rows={2}
              className="input"
              required
              value={form.loginDescription}
              onChange={(e) => setForm((p) => ({ ...p, loginDescription: e.target.value }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">{t.admin.primaryColor}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 p-1"
                  value={form.primaryColor}
                  onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))}
                />
                <input
                  className="input font-mono"
                  pattern="^#[0-9a-fA-F]{6}$"
                  value={form.primaryColor}
                  onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="label">{t.admin.secondaryColor}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 p-1"
                  value={form.secondaryColor}
                  onChange={(e) => setForm((p) => ({ ...p, secondaryColor: e.target.value }))}
                />
                <input
                  className="input font-mono"
                  pattern="^#[0-9a-fA-F]{6}$"
                  value={form.secondaryColor}
                  onChange={(e) => setForm((p) => ({ ...p, secondaryColor: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Contact Email</label>
              <input
                type="email"
                className="input"
                value={form.contactEmail}
                onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Contact Phone</label>
              <input
                className="input"
                value={form.contactPhone}
                onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">University Address</label>
              <input
                className="input"
                value={form.contactAddress}
                onChange={(e) => setForm((p) => ({ ...p, contactAddress: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Website URL</label>
              <input
                className="input"
                value={form.websiteUrl}
                onChange={(e) => setForm((p) => ({ ...p, websiteUrl: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={16} /> {saving ? t.common.loading : t.admin.saveBranding}
            </button>
          </div>
        </form>
      </div>

      {/* Logo & Live Preview */}
      <div className="space-y-6">
        <div className="card p-6 text-center">
          <h3 className="text-base font-extrabold text-slate-900">University Logo</h3>
          <div className="my-5 flex justify-center">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={branding.universityName}
                className="h-24 w-24 rounded-2xl border border-slate-200 object-cover shadow-sm"
              />
            ) : (
              <div
                className="grid h-24 w-24 place-items-center rounded-2xl text-2xl font-extrabold text-white"
                style={{
                  background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})`,
                }}
              >
                {form.universityName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleLogoUpload}
          />
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => logoInputRef.current?.click()}
              className="btn-primary text-xs"
            >
              <Camera size={14} /> {t.admin.uploadLogo}
            </button>
            {logoSrc && (
              <button
                type="button"
                disabled={uploading}
                onClick={handleDeleteLogo}
                className="btn-outline text-xs text-rose-600"
              >
                <Trash2 size={14} /> {t.admin.removeLogo}
              </button>
            )}
          </div>
        </div>

        <div
          className="rounded-2xl p-6 text-white shadow-md"
          style={{
            background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})`,
          }}
        >
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase opacity-85">
            <CheckCircle2 size={14} /> Live Theme Preview
          </p>
          <h4 className="mt-2 text-lg font-extrabold">{form.universityName}</h4>
          <p className="mt-1 text-xs opacity-90">{form.loginHeadline}</p>
        </div>
      </div>
    </div>
  );
}
