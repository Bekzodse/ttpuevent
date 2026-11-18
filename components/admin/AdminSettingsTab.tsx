"use client";

import { useState } from "react";
import { Palette, Package, RotateCcw } from "lucide-react";
import AdminBrandingTab from "@/components/AdminBrandingTab";
import AdminEquipmentTab from "@/components/AdminEquipmentTab";
import AdminCancellationsTab from "@/components/AdminCancellationsTab";

export default function AdminSettingsTab({
  onBanner,
}: {
  onBanner: (b: { type: "ok" | "err"; text: string }) => void;
}) {
  const [section, setSection] = useState<"branding" | "cancellations" | "equipment">("branding");

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Platform Settings</h2>
          <p className="text-xs text-slate-500">
            Configure university branding, cancellation &amp; refund policies, and equipment catalog.
          </p>
        </div>

        <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 text-xs">
          <button
            type="button"
            onClick={() => setSection("branding")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition ${
              section === "branding" ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Palette size={14} /> University Branding
          </button>
          <button
            type="button"
            onClick={() => setSection("cancellations")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition ${
              section === "cancellations" ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <RotateCcw size={14} /> Policy &amp; Refunds
          </button>
          <button
            type="button"
            onClick={() => setSection("equipment")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition ${
              section === "equipment" ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Package size={14} /> Equipment Inventory
          </button>
        </div>
      </div>

      {section === "branding" && <AdminBrandingTab onBanner={onBanner} />}
      {section === "cancellations" && <AdminCancellationsTab onBanner={onBanner} />}
      {section === "equipment" && <AdminEquipmentTab onBanner={onBanner} />}
    </div>
  );
}
