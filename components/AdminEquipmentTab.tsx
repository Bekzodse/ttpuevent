"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Edit3,
  History,
  Package,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";
import { useI18n } from "./I18nProvider";
import { ApiError, equipmentApi } from "@/lib/api";
import { Equipment, EquipmentHistoryItem } from "@/lib/types";

const CATEGORIES = ["Visual", "Audio", "Computing", "Streaming", "Furniture", "Other"];

export default function AdminEquipmentTab({
  onBanner,
}: {
  onBanner: (b: { type: "ok" | "err"; text: string }) => void;
}) {
  const { t } = useI18n();
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "Visual",
    description: "",
    totalQuantity: "1",
    unitFee: "0.00",
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [historyEq, setHistoryEq] = useState<Equipment | null>(null);
  const [historyRows, setHistoryRows] = useState<EquipmentHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadEquipment = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await equipmentApi.listAllAdmin());
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to load equipment.",
      });
    } finally {
      setLoading(false);
    }
  }, [onBanner]);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const openCreate = () => {
    setEditing(null);
    setModalError(null);
    setForm({
      name: "",
      category: "Visual",
      description: "",
      totalQuantity: "1",
      unitFee: "0.00",
      active: true,
    });
    setModalOpen(true);
  };

  const openEdit = (eq: Equipment) => {
    setEditing(eq);
    setModalError(null);
    setForm({
      name: eq.name,
      category: eq.category,
      description: eq.description || "",
      totalQuantity: String(eq.totalQuantity),
      unitFee: String(eq.unitFee),
      active: eq.active,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim() || undefined,
        totalQuantity: Number(form.totalQuantity),
        unitFee: Number(form.unitFee),
        active: form.active,
      };
      if (editing) {
        await equipmentApi.update(editing.id, payload);
        onBanner({ type: "ok", text: `Updated equipment '${payload.name}'.` });
      } else {
        await equipmentApi.create(payload);
        onBanner({ type: "ok", text: `Added equipment '${payload.name}'.` });
      }
      setModalOpen(false);
      await loadEquipment();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : "Failed to save equipment.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (eq: Equipment) => {
    try {
      await equipmentApi.toggleStatus(eq.id, !eq.active);
      onBanner({
        type: "ok",
        text: `${eq.name} ${!eq.active ? "activated" : "deactivated"}.`,
      });
      await loadEquipment();
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to toggle status.",
      });
    }
  };

  const handleDelete = async (eq: Equipment) => {
    try {
      await equipmentApi.delete(eq.id);
      onBanner({ type: "ok", text: `Deleted equipment '${eq.name}'.` });
      await loadEquipment();
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to delete equipment.",
      });
    }
  };

  const openHistory = async (eq: Equipment) => {
    setHistoryEq(eq);
    setHistoryLoading(true);
    try {
      setHistoryRows(await equipmentApi.history(eq.id));
    } catch {
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <Package size={20} style={{ color: "var(--brand-primary)" }} />
            {t.admin.tabEquipment}
          </h2>
          <p className="text-xs text-slate-500">
            Manage projectors, microphones, speakers, laptops, LED screens, cameras, and whiteboards.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary text-xs">
          <Plus size={15} /> {t.admin.addEquipment}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">{t.admin.equipmentName}</th>
                <th className="px-5 py-3.5">{t.admin.category}</th>
                <th className="px-5 py-3.5">{t.admin.totalQty}</th>
                <th className="px-5 py-3.5">{t.admin.reservedQty}</th>
                <th className="px-5 py-3.5">{t.admin.availableQty}</th>
                <th className="px-5 py-3.5">{t.admin.unitFee}</th>
                <th className="px-5 py-3.5">{t.common.status}</th>
                <th className="px-5 py-3.5 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    {t.common.loading}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                    No equipment configured.
                  </td>
                </tr>
              ) : (
                items.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{eq.name}</p>
                      {eq.description && (
                        <p className="max-w-xs truncate text-xs text-slate-500">{eq.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium text-slate-700">{eq.category}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{eq.totalQuantity}</td>
                    <td className="px-5 py-3.5 font-semibold text-amber-700">
                      {eq.reservedQuantity}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-emerald-700">
                      {eq.availableQuantity}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">
                      ${eq.unitFee}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          eq.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {eq.active ? t.common.active : t.common.inactive}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openHistory(eq)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600"
                          title={t.admin.usageHistory}
                        >
                          <History size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(eq)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                          title={t.common.edit}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggle(eq)}
                          className={`rounded-lg p-1.5 ${
                            eq.active
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title="Toggle active status"
                        >
                          <Power size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(eq)}
                          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                          title={t.common.delete}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Equipment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                {editing ? t.admin.editEquipment : t.admin.addEquipment}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                <AlertCircle size={15} /> {modalError}
              </div>
            )}

            <form className="mt-4 space-y-4" onSubmit={handleSave}>
              <div>
                <label className="label">{t.admin.equipmentName}</label>
                <input
                  className="input"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">{t.admin.category}</label>
                  <select
                    className="input"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t.admin.totalQty}</label>
                  <input
                    type="number"
                    min={0}
                    required
                    className="input"
                    value={form.totalQuantity}
                    onChange={(e) => setForm((p) => ({ ...p, totalQuantity: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">{t.admin.unitFee}</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    className="input"
                    value={form.unitFee}
                    onChange={(e) => setForm((p) => ({ ...p, unitFee: e.target.value }))}
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                    />
                    {t.common.active}
                  </label>
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  rows={2}
                  className="input"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-outline"
                >
                  {t.common.cancel}
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? t.common.loading : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Equipment Reservation History Modal */}
      {historyEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="card max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                {historyEq.name} — {t.admin.usageHistory}
              </h3>
              <button
                onClick={() => setHistoryEq(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {historyLoading ? (
              <p className="py-8 text-center text-sm text-slate-400">{t.common.loading}</p>
            ) : historyRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No reservation history for this item yet.
              </p>
            ) : (
              <div className="mt-4 space-y-2.5">
                {historyRows.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">
                        {r.quantityRequested}x · {r.eventName} ({r.applicationCode})
                      </p>
                      <p className="text-slate-500">
                        {r.hallName} · {r.eventDate} ({r.startTime}–{r.endTime}) · {r.applicantName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-white px-2 py-0.5 font-bold text-slate-700">
                        Eq: {r.status}
                      </span>
                      <span className="rounded bg-slate-200 px-2 py-0.5 font-semibold text-slate-700">
                        Booking: {r.bookingStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
