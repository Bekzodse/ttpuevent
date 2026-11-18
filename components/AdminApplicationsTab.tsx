"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileCheck2,
  History,
  Mail,
  MessageSquare,
  Search,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import BookingStatusBadge from "./BookingStatusBadge";
import SecureReceiptViewer from "./SecureReceiptViewer";
import { useNotifications } from "./NotificationProvider";
import ConfirmDialog from "./admin/ConfirmDialog";
import { adminApplicationsApi, ApiError, applicationsApi, equipmentApi, hallsApi } from "@/lib/api";
import { ApplicationStats, BookingStatus, EventHall, HallApplication } from "@/lib/types";

const ALL_STATUSES: BookingStatus[] = [
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "PAYMENT_PENDING",
  "PAYMENT_UNDER_REVIEW",
  "PAYMENT_APPROVED",
  "PAYMENT_REJECTED",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
];

const DIRECT_STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "UNDER_REVIEW", label: "Under Review" },
];

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

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminApplicationsTab({
  onBanner,
  refreshTick = 0,
}: {
  onBanner: (b: { type: "ok" | "err"; text: string }) => void;
  refreshTick?: number;
}) {
  const { lastEventTick } = useNotifications();

  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [halls, setHalls] = useState<EventHall[]>([]);
  const [applications, setApplications] = useState<HallApplication[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [hallFilter, setHallFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [submittedDateFilter, setSubmittedDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [selected, setSelected] = useState<HallApplication | null>(null);
  const [actionType, setActionType] = useState<
    "approve" | "reject" | "info" | "approvePayment" | "rejectPayment" | null
  >(null);
  const [comment, setComment] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Direct status override state inside modal
  const [directStatus, setDirectStatus] = useState<BookingStatus>("PENDING");
  const [directStatusNote, setDirectStatusNote] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<HallApplication | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, hallsRes, appsRes] = await Promise.all([
        adminApplicationsApi.getStats(),
        hallsApi.list(),
        adminApplicationsApi.list({
          search: search.trim() || undefined,
          status: statusFilter,
          hallId: hallFilter || undefined,
          eventType: eventTypeFilter || undefined,
          eventDate: dateFilter || undefined,
          submittedDate: submittedDateFilter || undefined,
          sortBy,
          sortDir,
          page,
          size: 12,
        }),
      ]);
      setStats(statsRes);
      setHalls(hallsRes);
      setApplications(appsRes.content);
      setTotalElements(appsRes.totalElements);
      setTotalPages(appsRes.totalPages);
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to load applications.",
      });
    } finally {
      setLoading(false);
    }
  }, [
    search,
    statusFilter,
    hallFilter,
    eventTypeFilter,
    dateFilter,
    submittedDateFilter,
    sortBy,
    sortDir,
    page,
    onBanner,
  ]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications, lastEventTick, refreshTick]);

  const openModal = (app: HallApplication) => {
    setSelected(app);
    setActionType(null);
    setComment("");
    setActionError(null);
    setDirectStatus(app.status);
    setDirectStatusNote("");
  };

  const handleEquipmentDecision = async (resId: number, approve: boolean) => {
    if (!selected) return;
    setActionError(null);
    setBusy(true);
    try {
      if (approve) {
        await equipmentApi.approveReservation(selected.id, resId);
        onBanner({ type: "ok", text: "Equipment request approved." });
      } else {
        await equipmentApi.rejectReservation(selected.id, resId, "Rejected by administrator.");
        onBanner({ type: "ok", text: "Equipment request rejected and stock released." });
      }
      const refreshed = await adminApplicationsApi.get(selected.id);
      setSelected(refreshed);
      await loadApplications();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to update equipment request.");
    } finally {
      setBusy(false);
    }
  };

  const executeAdminAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !actionType) return;
    setActionError(null);

    const requiresComment =
      actionType === "reject" || actionType === "info" || actionType === "rejectPayment";
    if (requiresComment && comment.trim().length < 3) {
      setActionError("Please enter a clear reason or message (at least 3 characters).");
      return;
    }

    setBusy(true);
    try {
      let updated: HallApplication;
      if (actionType === "approve") {
        updated = await adminApplicationsApi.approve(selected.id, comment.trim());
        onBanner({
          type: "ok",
          text: `Approved ${updated.applicationCode}. Hall reserved for 24h (PAYMENT_PENDING).`,
        });
      } else if (actionType === "reject") {
        updated = await adminApplicationsApi.reject(selected.id, comment.trim());
        onBanner({ type: "ok", text: `Rejected application ${updated.applicationCode}.` });
      } else if (actionType === "info") {
        updated = await adminApplicationsApi.requestInfo(selected.id, comment.trim());
        onBanner({
          type: "ok",
          text: `Requested additional info for ${updated.applicationCode}.`,
        });
      } else if (actionType === "approvePayment") {
        updated = await adminApplicationsApi.approvePayment(selected.id, comment.trim());
        onBanner({
          type: "ok",
          text: `Payment verified! Booking ${updated.applicationCode} is now CONFIRMED.`,
        });
      } else {
        updated = await adminApplicationsApi.rejectPayment(selected.id, comment.trim());
        onBanner({
          type: "ok",
          text: `Payment rejected for ${updated.applicationCode}. User notified to re-upload.`,
        });
      }

      setSelected(updated);
      setDirectStatus(updated.status);
      setActionType(null);
      setComment("");
      await loadApplications();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDirectStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setActionError(null);
    setBusy(true);
    try {
      const updated = await adminApplicationsApi.changeStatus(
        selected.id,
        directStatus,
        directStatusNote.trim()
      );
      setSelected(updated);
      setDirectStatusNote("");
      onBanner({
        type: "ok",
        text: `Updated status of ${updated.applicationCode} to ${updated.status}.`,
      });
      await loadApplications();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to update application status.");
    } finally {
      setBusy(false);
    }
  };

  const handleQuickRowStatus = async (app: HallApplication, nextStatus: BookingStatus) => {
    try {
      const updated = await adminApplicationsApi.changeStatus(app.id, nextStatus);
      onBanner({
        type: "ok",
        text: `Application ${updated.applicationCode} changed to ${updated.status}.`,
      });
      await loadApplications();
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to change application status.",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApplicationsApi.delete(deleteTarget.id);
      onBanner({
        type: "ok",
        text: `Deleted application ${deleteTarget.applicationCode}.`,
      });
      if (selected?.id === deleteTarget.id) {
        setSelected(null);
      }
      setDeleteTarget(null);
      await loadApplications();
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to delete application.",
      });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const kpis = [
    { label: "Total Applications", value: stats?.totalApplications ?? 0, tone: "text-brand-700 bg-brand-50" },
    { label: "Pending Review", value: stats?.pendingCount ?? 0, tone: "text-amber-700 bg-amber-50" },
    { label: "Info Requested", value: stats?.underReviewCount ?? 0, tone: "text-indigo-700 bg-indigo-50" },
    { label: "Awaiting Payment", value: stats?.paymentPendingCount ?? 0, tone: "text-orange-700 bg-orange-50" },
    { label: "Receipts to Verify", value: stats?.paymentUnderReviewCount ?? 0, tone: "text-purple-700 bg-purple-50" },
    { label: "Confirmed Bookings", value: stats?.confirmedCount ?? 0, tone: "text-emerald-700 bg-emerald-50" },
    {
      label: "Rejected / Expired",
      value: (stats?.rejectedCount ?? 0) + (stats?.expiredCount ?? 0),
      tone: "text-rose-700 bg-rose-50",
    },
  ];

  return (
    <div className="space-y-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {kpis.map((k) => (
          <div key={k.label} className="card p-3.5">
            <span className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold ${k.tone}`}>
              {k.label}
            </span>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search ID, event, applicant name, email, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>

        <select
          className="input"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as BookingStatus | "");
            setPage(0);
          }}
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={eventTypeFilter}
          onChange={(e) => {
            setEventTypeFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All Event Types</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={hallFilter}
          onChange={(e) => {
            setHallFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All Event Halls</option>
          {halls.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>

        <div>
          <input
            type="date"
            className="input"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(0);
            }}
            title="Filter by Event Date"
            aria-label="Filter by Event Date"
          />
        </div>

        <div>
          <input
            type="date"
            className="input"
            value={submittedDateFilter}
            onChange={(e) => {
              setSubmittedDateFilter(e.target.value);
              setPage(0);
            }}
            title="Filter by Submission Date"
            aria-label="Filter by Submission Date"
          />
        </div>

        <div className="flex gap-1.5">
          <select
            className="input"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(0);
            }}
          >
            <option value="createdAt">Sort: Submission Date</option>
            <option value="eventDate">Sort: Event Date</option>
            <option value="eventName">Sort: Event Name</option>
            <option value="applicantFirstName">Sort: Applicant</option>
            <option value="status">Sort: Status</option>
          </select>
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="btn-outline shrink-0 px-2.5 text-xs"
            title="Toggle sort direction"
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Application</th>
                <th className="px-4 py-3.5">Applicant (Name, Email, Phone)</th>
                <th className="px-4 py-3.5">Selected Event &amp; Hall</th>
                <th className="px-4 py-3.5">Submitted</th>
                <th className="px-4 py-3.5">Fee</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    No applications found matching the filters.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-800">
                        {app.applicationCode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900">
                        {app.applicantFirstName} {app.applicantLastName}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <Mail size={11} className="shrink-0" />
                        <span>{app.applicantEmail || `${app.applicantUsername}@turin.uz`}</span>
                      </p>
                      <p className="font-mono text-[11px] text-slate-500">
                        @{app.applicantUsername} · {app.applicantPhoneNumber}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900">{app.eventName}</p>
                      <p className="text-xs text-slate-500">
                        {app.eventType} · {app.hall.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {app.eventDate} ({app.startTime}–{app.endTime}) · {app.expectedParticipants} guests
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">
                      {formatDate(app.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-bold text-slate-900">
                      ${app.requiredAmount ?? "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <BookingStatusBadge status={app.status} />
                        {app.receiptUrl && app.status === "PAYMENT_UNDER_REVIEW" && (
                          <span className="text-[11px] font-semibold text-purple-700">
                            Receipt uploaded
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        {(app.status === "PENDING" || app.status === "UNDER_REVIEW") && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleQuickRowStatus(app, "APPROVED")}
                              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                              title="Quick Approve"
                            >
                              <ThumbsUp size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickRowStatus(app, "REJECTED")}
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                              title="Quick Reject"
                            >
                              <ThumbsDown size={15} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => openModal(app)}
                          className="btn-outline px-2.5 py-1.5 text-xs"
                        >
                          <Eye size={14} /> Details
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(app)}
                          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                          title="Delete application"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            <span>
              Page {page + 1} of {totalPages} ({totalElements} applications)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="btn-outline px-3 py-1.5 text-xs"
              >
                Previous
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-outline px-3 py-1.5 text-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Application Detail & Admin Action Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="card max-h-[92vh] w-full max-w-3xl overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-800">
                    {selected.applicationCode}
                  </span>
                  <BookingStatusBadge status={selected.status} />
                  {selected.paymentStatus && (
                    <BookingStatusBadge status={selected.paymentStatus} />
                  )}
                </div>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">
                  {selected.eventName}
                </h3>
                <p className="text-xs text-slate-500">
                  Submitted on {formatDate(selected.createdAt)} by{" "}
                  <strong>
                    {selected.applicantFirstName} {selected.applicantLastName}
                  </strong>{" "}
                  (@{selected.applicantUsername} · {selected.applicantEmail || "no email"} ·{" "}
                  {selected.applicantPhoneNumber})
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 rounded-2xl bg-slate-50 p-4 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <span className="text-slate-500">Event Hall</span>
                <p className="font-bold text-slate-900">{selected.hall.name}</p>
                <p className="text-slate-500">
                  {selected.hall.building} (Cap: {selected.hall.capacity})
                </p>
              </div>
              <div>
                <span className="text-slate-500">Date &amp; Time</span>
                <p className="font-bold text-slate-900">{selected.eventDate}</p>
                <p className="text-slate-500">
                  {selected.startTime} – {selected.endTime}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Type, Participants &amp; Fee</span>
                <p className="font-bold text-slate-900">
                  {selected.eventType} · {selected.expectedParticipants} guests
                </p>
                <p className="font-bold text-brand-700">${selected.requiredAmount}</p>
              </div>
              {selected.description && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <span className="text-slate-500">Event Description / Comments</span>
                  <p className="mt-0.5 text-slate-800">{selected.description}</p>
                </div>
              )}
              {selected.userReply && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 sm:col-span-2 lg:col-span-3">
                  <span className="font-bold text-indigo-900">Applicant&apos;s Reply to Info Request: </span>
                  <span className="text-indigo-800">{selected.userReply}</span>
                </div>
              )}
            </div>

            {/* Equipment Requests Review */}
            {selected.equipmentReservations && selected.equipmentReservations.length > 0 && (
              <div className="mt-5 space-y-2.5 rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Requested Equipment ({selected.equipmentReservations.length})
                </p>
                {selected.equipmentReservations.map((eq) => (
                  <div
                    key={eq.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">
                        {eq.quantityRequested}x {eq.equipmentName}
                      </span>{" "}
                      <span className="text-slate-500">
                        ({eq.category} · ${eq.unitFee}/unit)
                      </span>
                      <span className="ml-2 rounded bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {eq.status}
                      </span>
                    </div>
                    {eq.status === "PENDING" && (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleEquipmentDecision(eq.id, true)}
                          className="btn-primary px-2.5 py-1 text-[11px]"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleEquipmentDecision(eq.id, false)}
                          className="btn-danger px-2.5 py-1 text-[11px]"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Payment & Receipt Display */}
            {(selected.bankCardNumber || selected.receiptUrl) && (
              <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                    <CreditCard size={15} className="text-brand-600" />
                    Payment Details — ${selected.requiredAmount} ({selected.bankCardNumber})
                  </span>
                  {selected.paymentDeadline && (
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Clock size={13} /> Deadline: {formatDate(selected.paymentDeadline)}
                    </span>
                  )}
                </div>

                {selected.receiptUrl && (
                  <SecureReceiptViewer
                    receiptUrl={selected.receiptUrl}
                    filename={selected.receiptFilename}
                  />
                )}
              </div>
            )}

            {/* Workflow Decisions */}
            {(selected.status === "PENDING" ||
              selected.status === "UNDER_REVIEW" ||
              selected.status === "PAYMENT_UNDER_REVIEW" ||
              selected.status === "CONFIRMED") && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Administrator Workflow Decisions
                </p>

                {actionError && (
                  <div className="mb-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                    <AlertCircle size={15} /> {actionError}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {(selected.status === "PENDING" || selected.status === "UNDER_REVIEW") && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setActionType("approve");
                          setActionError(null);
                        }}
                        className="btn-primary text-xs"
                      >
                        <ThumbsUp size={15} /> Approve (24h Hold)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionType("info");
                          setActionError(null);
                        }}
                        className="btn-outline text-xs text-indigo-700 hover:bg-indigo-50"
                      >
                        <MessageSquare size={15} /> Request Additional Info
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionType("reject");
                          setActionError(null);
                        }}
                        className="btn-danger text-xs"
                      >
                        <ThumbsDown size={15} /> Reject Application
                      </button>
                    </>
                  )}

                  {selected.status === "PAYMENT_UNDER_REVIEW" && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setActionType("approvePayment");
                          setActionError(null);
                        }}
                        className="btn-primary bg-emerald-600 text-xs hover:bg-emerald-700"
                      >
                        <FileCheck2 size={15} /> Approve Payment &amp; Confirm Booking
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionType("rejectPayment");
                          setActionError(null);
                        }}
                        className="btn-danger text-xs"
                      >
                        <ThumbsDown size={15} /> Reject Payment
                      </button>
                    </>
                  )}

                  {selected.status === "CONFIRMED" && (
                    <button
                      type="button"
                      onClick={() =>
                        applicationsApi.downloadConfirmationPdf(
                          selected.id,
                          selected.applicationCode
                        )
                      }
                      className="btn-primary text-xs"
                    >
                      <Download size={15} /> Download Official Confirmation PDF
                    </button>
                  )}
                </div>

                {actionType && (
                  <form className="mt-4 space-y-3 border-t border-slate-100 pt-4" onSubmit={executeAdminAction}>
                    <label className="label">
                      {actionType === "approve"
                        ? "Approval Note (optional)"
                        : actionType === "approvePayment"
                        ? "Bank Transaction Verification Note (optional)"
                        : actionType === "info"
                        ? "Message to Applicant (required)"
                        : "Rejection Reason (required)"}
                    </label>
                    <textarea
                      rows={2}
                      className="input"
                      placeholder={
                        actionType === "approvePayment"
                          ? "e.g. Verified bank transfer reference #12345"
                          : "Enter your note or reason..."
                      }
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActionType(null)}
                        className="btn-outline px-3 py-1.5 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={busy}
                        className="btn-primary px-4 py-1.5 text-xs"
                      >
                        <CheckCircle2 size={14} />
                        {busy ? "Processing..." : "Confirm Decision"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Direct Status Management & Delete */}
            <form
              onSubmit={handleDirectStatusUpdate}
              className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Change Application Status Directly
                </p>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(selected)}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 size={13} /> Delete Application
                </button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <select
                  className="input text-xs"
                  value={directStatus}
                  onChange={(e) => setDirectStatus(e.target.value as BookingStatus)}
                >
                  {DIRECT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.value})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  className="input text-xs sm:col-span-2"
                  placeholder="Optional admin note for status change..."
                  value={directStatusNote}
                  onChange={(e) => setDirectStatusNote(e.target.value)}
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button type="submit" disabled={busy} className="btn-outline px-3.5 py-1.5 text-xs">
                  {busy ? "Updating..." : "Update Status"}
                </button>
              </div>
            </form>

            {/* Complete Admin Action History */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <History size={14} /> Complete Action &amp; Audit History ({selected.history.length})
              </h4>
              <ul className="mt-3 space-y-2.5 border-l-2 border-slate-200 pl-4">
                {selected.history.map((h) => (
                  <li key={h.id} className="text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900">{h.action}</span>
                      <BookingStatusBadge status={h.newStatus} />
                      <span className="text-slate-400">
                        {h.actorFullName} ({h.actorRole}) · {formatDate(h.createdAt)}
                      </span>
                    </div>
                    {h.comment && <p className="mt-0.5 text-slate-600">{h.comment}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Application?"
        description={
          deleteTarget
            ? `Are you sure you want to permanently delete application ${deleteTarget.applicationCode} ("${deleteTarget.eventName}")? Equipment reservations, action history, and receipt files linked to this application will be removed.`
            : ""
        }
        confirmLabel="Delete Application"
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
