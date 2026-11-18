"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  FileSpreadsheet,
  Search,
  Settings,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { useI18n } from "./I18nProvider";
import { useNotifications } from "./NotificationProvider";
import { ApiError, cancellationsApi } from "@/lib/api";
import {
  CancellationPolicy,
  CancellationRequest,
  CancellationStatus,
  FinancialAuditLog,
  RefundStatus,
} from "@/lib/types";

export default function AdminCancellationsTab({
  onBanner,
}: {
  onBanner: (b: { type: "ok" | "err"; text: string }) => void;
}) {
  const { t } = useI18n();
  const { lastEventTick } = useNotifications();

  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<FinancialAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CancellationStatus | "">("");
  const [refundFilter, setRefundFilter] = useState<RefundStatus | "">("");

  const [policyForm, setPolicyForm] = useState({
    name: "",
    fullRefundHoursBefore: "48",
    partialRefundHoursBefore: "24",
    partialRefundPercent: "50",
    releaseHallOnApproval: true,
    description: "",
  });
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Action modal
  const [selected, setSelected] = useState<CancellationRequest | null>(null);
  const [modalMode, setModalMode] = useState<
    "approve" | "reject" | "completeRefund" | "rejectRefund" | null
  >(null);
  const [comment, setComment] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [reqPage, policyRes, auditPage] = await Promise.all([
        cancellationsApi.listAllAdmin({
          status: statusFilter,
          refundStatus: refundFilter,
          search: search.trim() || undefined,
          page: 0,
          size: 25,
        }),
        cancellationsApi.getPolicy(),
        cancellationsApi.financialAudit(0, 20),
      ]);
      setRequests(reqPage.content);
      setAuditLogs(auditPage.content);
      setPolicyForm({
        name: policyRes.name,
        fullRefundHoursBefore: String(policyRes.fullRefundHoursBefore),
        partialRefundHoursBefore: String(policyRes.partialRefundHoursBefore),
        partialRefundPercent: String(policyRes.partialRefundPercent),
        releaseHallOnApproval: policyRes.releaseHallOnApproval,
        description: policyRes.description || "",
      });
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to load cancellations.",
      });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, refundFilter, onBanner]);

  useEffect(() => {
    loadAll();
  }, [loadAll, lastEventTick]);

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPolicy(true);
    try {
      const updated: CancellationPolicy = await cancellationsApi.updatePolicy({
        name: policyForm.name.trim(),
        fullRefundHoursBefore: Number(policyForm.fullRefundHoursBefore),
        partialRefundHoursBefore: Number(policyForm.partialRefundHoursBefore),
        partialRefundPercent: Number(policyForm.partialRefundPercent),
        releaseHallOnApproval: policyForm.releaseHallOnApproval,
        description: policyForm.description.trim() || undefined,
      });
      onBanner({ type: "ok", text: `Saved cancellation policy '${updated.name}'.` });
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to update policy.",
      });
    } finally {
      setSavingPolicy(false);
    }
  };

  const openActionModal = (
    req: CancellationRequest,
    mode: "approve" | "reject" | "completeRefund" | "rejectRefund"
  ) => {
    setSelected(req);
    setModalMode(mode);
    setComment("");
    setRefundAmount(String(req.eligibleRefundAmount || req.paidAmount || "0"));
    setTransactionRef("");
    setModalError(null);
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !modalMode) return;
    setModalError(null);
    setBusy(true);
    try {
      if (modalMode === "approve") {
        await cancellationsApi.approve(selected.id, comment.trim());
        onBanner({ type: "ok", text: `Approved cancellation for ${selected.applicationCode}.` });
      } else if (modalMode === "reject") {
        await cancellationsApi.reject(selected.id, comment.trim());
        onBanner({ type: "ok", text: `Rejected cancellation for ${selected.applicationCode}.` });
      } else if (modalMode === "completeRefund") {
        await cancellationsApi.completeRefund(selected.id, {
          refundAmount: Number(refundAmount),
          transactionRef: transactionRef.trim(),
          adminComment: comment.trim() || undefined,
        });
        onBanner({
          type: "ok",
          text: `Refund completed for ${selected.applicationCode} (Ref: ${transactionRef.trim()}).`,
        });
      } else {
        await cancellationsApi.rejectRefund(selected.id, comment.trim());
        onBanner({ type: "ok", text: `Refund declined for ${selected.applicationCode}.` });
      }
      setSelected(null);
      setModalMode(null);
      await loadAll();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : "Operation failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card grid gap-3 p-4 sm:grid-cols-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            className="input pl-10"
            placeholder={t.common.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CancellationStatus | "")}
        >
          <option value="">All Cancellation Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
        <select
          className="input"
          value={refundFilter}
          onChange={(e) => setRefundFilter(e.target.value as RefundStatus | "")}
        >
          <option value="">All Refund Statuses</option>
          <option value="NOT_APPLICABLE">NOT_APPLICABLE</option>
          <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      {/* Cancellation Requests Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Application</th>
                <th className="px-5 py-3.5">Requester</th>
                <th className="px-5 py-3.5">Reason</th>
                <th className="px-5 py-3.5">Paid / Eligible</th>
                <th className="px-5 py-3.5">Cancel / Refund Status</th>
                <th className="px-5 py-3.5 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    {t.common.loading}
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    No cancellation requests submitted yet.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800">
                        {r.applicationCode}
                      </span>
                      <p className="mt-1 text-xs font-semibold text-slate-900">{r.eventName}</p>
                      <p className="text-[11px] text-slate-500">
                        {r.hallName} · {r.eventDate}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <p className="font-semibold text-slate-900">{r.requestedByFullName}</p>
                      <p className="text-slate-500">
                        @{r.requestedByUsername} · {r.requestedByPhone}
                      </p>
                    </td>
                    <td className="max-w-xs px-5 py-3.5 text-xs text-slate-600">{r.reason}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs">
                      <p className="font-semibold text-slate-900">Paid: ${r.paidAmount}</p>
                      <p className="text-brand-700">
                        Eligible: {r.eligibleRefundPercent}% (${r.eligibleRefundAmount})
                      </p>
                      {r.refundTransactionRef && (
                        <p className="font-mono text-[10px] text-emerald-700">
                          Ref: {r.refundTransactionRef}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 font-bold ${
                          r.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700"
                            : r.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        Cancel: {r.status}
                      </span>
                      <span className="mt-1 block text-[11px] font-semibold text-slate-600">
                        Refund: {r.refundStatus}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1.5">
                        {r.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              onClick={() => openActionModal(r, "approve")}
                              className="btn-primary px-2.5 py-1.5 text-xs"
                            >
                              <ThumbsUp size={13} /> {t.admin.approveCancel}
                            </button>
                            <button
                              type="button"
                              onClick={() => openActionModal(r, "reject")}
                              className="btn-danger px-2.5 py-1.5 text-xs"
                            >
                              <ThumbsDown size={13} /> {t.admin.rejectCancel}
                            </button>
                          </>
                        )}
                        {r.status === "APPROVED" &&
                          r.refundStatus === "PENDING_VERIFICATION" && (
                            <>
                              <button
                                type="button"
                                onClick={() => openActionModal(r, "completeRefund")}
                                className="btn-primary bg-emerald-600 px-2.5 py-1.5 text-xs hover:bg-emerald-700"
                              >
                                <DollarSign size={13} /> {t.admin.completeRefund}
                              </button>
                              <button
                                type="button"
                                onClick={() => openActionModal(r, "rejectRefund")}
                                className="btn-outline px-2.5 py-1.5 text-xs text-rose-600"
                              >
                                {t.admin.rejectRefund}
                              </button>
                            </>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configurable Cancellation Policy & Financial Audit Log */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-base font-extrabold text-slate-900">
            <Settings size={18} style={{ color: "var(--brand-primary)" }} />
            {t.admin.policySettings}
          </h3>
          <form className="space-y-4" onSubmit={handleSavePolicy}>
            <div>
              <label className="label">Policy Name</label>
              <input
                className="input"
                required
                value={policyForm.name}
                onChange={(e) => setPolicyForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">100% Refund (hrs before)</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={policyForm.fullRefundHoursBefore}
                  onChange={(e) =>
                    setPolicyForm((p) => ({ ...p, fullRefundHoursBefore: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label">Partial Refund (hrs before)</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={policyForm.partialRefundHoursBefore}
                  onChange={(e) =>
                    setPolicyForm((p) => ({ ...p, partialRefundHoursBefore: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label">Partial Refund %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="input"
                  value={policyForm.partialRefundPercent}
                  onChange={(e) =>
                    setPolicyForm((p) => ({ ...p, partialRefundPercent: e.target.value }))
                  }
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={policyForm.releaseHallOnApproval}
                onChange={(e) =>
                  setPolicyForm((p) => ({ ...p, releaseHallOnApproval: e.target.checked }))
                }
              />
              Automatically release hall &amp; equipment slots when cancellation is approved
            </label>

            <div>
              <label className="label">Policy Description</label>
              <textarea
                rows={2}
                className="input"
                value={policyForm.description}
                onChange={(e) => setPolicyForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={savingPolicy} className="btn-primary text-xs">
                {savingPolicy ? t.common.loading : t.admin.savePolicy}
              </button>
            </div>
          </form>
        </section>

        <section className="card p-6">
          <h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-base font-extrabold text-slate-900">
            <FileSpreadsheet size={18} style={{ color: "var(--brand-primary)" }} />
            {t.admin.financialAudit}
          </h3>
          <div className="max-h-80 space-y-2.5 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                No financial transactions recorded yet.
              </p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">
                      {log.actionType}{" "}
                      {log.applicationCode ? `(${log.applicationCode})` : ""}
                    </span>
                    {log.amount != null && (
                      <span className="font-extrabold text-brand-700">${log.amount}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-slate-600">{log.details}</p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    @{log.actorUsername} ({log.actorRole})
                    {log.transactionReference ? ` · Ref: ${log.transactionReference}` : ""} ·{" "}
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Action Modal */}
      {selected && modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                {modalMode === "approve"
                  ? t.admin.approveCancel
                  : modalMode === "reject"
                  ? t.admin.rejectCancel
                  : modalMode === "completeRefund"
                  ? t.admin.completeRefund
                  : t.admin.rejectRefund}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                <AlertCircle size={15} /> {modalError}
              </div>
            )}

            <form className="mt-4 space-y-4" onSubmit={handleExecute}>
              {modalMode === "completeRefund" && (
                <>
                  <div>
                    <label className="label">{t.admin.refundAmount}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={selected.paidAmount}
                      required
                      className="input"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">{t.admin.transactionRef}</label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      className="input"
                      placeholder="e.g. TXN-2026-88412"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="label">
                  Admin Comment{" "}
                  {modalMode === "reject" || modalMode === "rejectRefund"
                    ? "(required)"
                    : "(optional)"}
                </label>
                <textarea
                  rows={3}
                  required={modalMode === "reject" || modalMode === "rejectRefund"}
                  className="input"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="btn-outline"
                >
                  {t.common.cancel}
                </button>
                <button type="submit" disabled={busy} className="btn-primary">
                  <CheckCircle2 size={15} /> {busy ? t.common.loading : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
