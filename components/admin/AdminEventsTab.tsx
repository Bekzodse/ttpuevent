"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Ban,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Globe,
  ImagePlus,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { adminEventsApi, ApiError, resolveEventImageUrl } from "@/lib/api";
import { EventRegistrant, UniversityEvent } from "@/lib/types";
import ConfirmDialog from "./ConfirmDialog";

const CATEGORIES = ["Academic", "Technology", "Career", "Sports", "Cultural", "Arts & Media"];
const EVENT_STATUSES = ["Upcoming", "Completed", "Cancelled", "Draft"];

function statusBadgeClass(status: string, published?: boolean) {
  if (status === "Cancelled") return "bg-rose-50 text-rose-700 border-rose-200";
  if (status === "Completed") return "bg-slate-100 text-slate-700 border-slate-200";
  if (status === "Draft" || published === false) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

export default function AdminEventsTab({
  onBanner,
  refreshTick,
}: {
  onBanner: (b: { type: "ok" | "err"; text: string }) => void;
  refreshTick: number;
}) {
  const [events, setEvents] = useState<UniversityEvent[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<"" | "true" | "false">("");
  const [sortBy, setSortBy] = useState("eventDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UniversityEvent | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Academic",
    date: "",
    time: "10:00",
    location: "",
    organizer: "",
    capacity: "100",
    status: "Upcoming",
    published: true,
    imageUrl: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<UniversityEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Registrants drawer/modal
  const [registrantsEvent, setRegistrantsEvent] = useState<UniversityEvent | null>(null);
  const [registrants, setRegistrants] = useState<EventRegistrant[]>([]);
  const [loadingRegistrants, setLoadingRegistrants] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminEventsApi.list({
        search: search.trim() || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        published: publishedFilter,
        sortBy,
        sortDir,
        page,
        size: 12,
      });
      setEvents(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to load events.",
      });
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter, publishedFilter, sortBy, sortDir, page, onBanner]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents, refreshTick]);

  const openCreateModal = () => {
    setEditing(null);
    setModalError(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setForm({
      title: "",
      description: "",
      category: "Academic",
      date: new Date().toISOString().slice(0, 10),
      time: "10:00",
      location: "The Annual Conference Hall",
      organizer: "",
      capacity: "120",
      status: "Upcoming",
      published: true,
      imageUrl: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (ev: UniversityEvent) => {
    setEditing(ev);
    setModalError(null);
    setSelectedFile(null);
    setPreviewUrl(resolveEventImageUrl(ev.imageUrl));
    setForm({
      title: ev.title,
      description: ev.description,
      category: ev.category,
      date: ev.date,
      time: ev.time,
      location: ev.location,
      organizer: ev.organizer,
      capacity: String(ev.capacity),
      status: ev.status,
      published: ev.published !== false,
      imageUrl: ev.imageUrl || "",
    });
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setModalError("Image must be 5 MB or smaller.");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        date: form.date,
        time: form.time.trim(),
        location: form.location.trim(),
        organizer: form.organizer.trim(),
        capacity: Number(form.capacity),
        imageUrl: form.imageUrl.trim() || undefined,
        status: form.status,
        published: form.published,
      };

      let saved: UniversityEvent;
      if (editing) {
        saved = await adminEventsApi.update(editing.id, payload);
        if (selectedFile) {
          saved = await adminEventsApi.uploadImage(saved.id, selectedFile);
        }
        onBanner({ type: "ok", text: `Updated event '${saved.title}'.` });
      } else {
        saved = await adminEventsApi.create(payload);
        if (selectedFile) {
          saved = await adminEventsApi.uploadImage(saved.id, selectedFile);
        }
        onBanner({ type: "ok", text: `Created event '${saved.title}'.` });
      }
      setModalOpen(false);
      await loadEvents();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : "Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!editing) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setForm((p) => ({ ...p, imageUrl: "" }));
      return;
    }
    setSaving(true);
    try {
      await adminEventsApi.deleteImage(editing.id);
      setSelectedFile(null);
      setPreviewUrl(null);
      setForm((p) => ({ ...p, imageUrl: "" }));
      await loadEvents();
      onBanner({ type: "ok", text: "Removed event cover image." });
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : "Failed to remove image.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async (ev: UniversityEvent) => {
    try {
      if (ev.published === false) {
        await adminEventsApi.publish(ev.id);
        onBanner({ type: "ok", text: `Published '${ev.title}'.` });
      } else {
        await adminEventsApi.unpublish(ev.id);
        onBanner({ type: "ok", text: `Unpublished '${ev.title}'.` });
      }
      await loadEvents();
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to update visibility.",
      });
    }
  };

  const handleCancelEvent = async (ev: UniversityEvent) => {
    try {
      await adminEventsApi.cancel(ev.id);
      onBanner({ type: "ok", text: `Cancelled event '${ev.title}'.` });
      await loadEvents();
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to cancel event.",
      });
    }
  };

  const handleMarkCompleted = async (ev: UniversityEvent) => {
    try {
      await adminEventsApi.updateStatus(ev.id, "Completed", ev.published);
      onBanner({ type: "ok", text: `Marked '${ev.title}' as Completed.` });
      await loadEvents();
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to update status.",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminEventsApi.delete(deleteTarget.id);
      onBanner({ type: "ok", text: `Deleted event '${deleteTarget.title}'.` });
      setDeleteTarget(null);
      await loadEvents();
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to delete event.",
      });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const openRegistrants = async (ev: UniversityEvent) => {
    setRegistrantsEvent(ev);
    setRegistrants([]);
    setLoadingRegistrants(true);
    try {
      setRegistrants(await adminEventsApi.getRegistrations(ev.id));
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to load event registrants.",
      });
    } finally {
      setLoadingRegistrants(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Events Management ({totalElements})
          </h2>
          <p className="text-xs text-slate-500">
            Create, edit, publish, unpublish, cancel, or remove campus events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded-lg p-1.5 text-xs transition ${
                viewMode === "table" ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Table view"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`rounded-lg p-1.5 text-xs transition ${
                viewMode === "cards" ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Card view"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <button type="button" onClick={openCreateModal} className="btn-primary text-xs">
            <Plus size={16} /> Create Event
          </button>
        </div>
      </div>

      {/* Search, Filters & Sorting */}
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search title, location, organizer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>

        <select
          className="input"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All Statuses</option>
          {EVENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={publishedFilter}
          onChange={(e) => {
            setPublishedFilter(e.target.value as "" | "true" | "false");
            setPage(0);
          }}
        >
          <option value="">All Visibility</option>
          <option value="true">Published Only</option>
          <option value="false">Unpublished Only</option>
        </select>

        <div className="flex gap-1.5">
          <select
            className="input"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(0);
            }}
          >
            <option value="eventDate">Sort: Event Date</option>
            <option value="title">Sort: Title</option>
            <option value="registeredCount">Sort: Participants</option>
            <option value="capacity">Sort: Capacity</option>
            <option value="createdAt">Sort: Created</option>
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

      {/* Loading / Empty / Data */}
      {loading ? (
        <div className="card h-64 animate-pulse bg-white" />
      ) : events.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarDays size={36} className="mx-auto text-slate-300" />
          <p className="mt-3 font-bold text-slate-800">No events found</p>
          <p className="mt-1 text-xs text-slate-500">
            Try clearing filters or create a new university event.
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Event</th>
                  <th className="px-5 py-3.5">Schedule &amp; Venue</th>
                  <th className="px-5 py-3.5">Capacity</th>
                  <th className="px-5 py-3.5">Visibility &amp; Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((ev) => {
                  const img = resolveEventImageUrl(ev.imageUrl);
                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-11 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${ev.gradient}`}
                          >
                            {img && (
                              <img src={img} alt={ev.title} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900">{ev.title}</p>
                            <p className="truncate text-xs text-slate-500">
                              {ev.category} · {ev.organizer}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-600">
                        <p className="font-semibold text-slate-800">
                          {ev.date} · {ev.time}
                        </p>
                        <p className="text-slate-500">{ev.location}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs">
                        <button
                          type="button"
                          onClick={() => openRegistrants(ev)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-800 hover:bg-brand-50 hover:text-brand-700"
                          title="View registered participants"
                        >
                          <Users size={13} />
                          {ev.registered}/{ev.capacity}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusBadgeClass(
                              ev.status,
                              ev.published
                            )}`}
                          >
                            {ev.status}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              ev.published !== false
                                ? "bg-sky-50 text-sky-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {ev.published !== false ? "Published" : "Hidden"}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handlePublishToggle(ev)}
                            className={`rounded-lg p-1.5 transition ${
                              ev.published !== false
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={ev.published !== false ? "Unpublish event" : "Publish event"}
                          >
                            {ev.published !== false ? <EyeOff size={16} /> : <Globe size={16} />}
                          </button>
                          {ev.status !== "Cancelled" && (
                            <button
                              type="button"
                              onClick={() => handleCancelEvent(ev)}
                              className="rounded-lg p-1.5 text-orange-600 hover:bg-orange-50"
                              title="Cancel event"
                            >
                              <Ban size={16} />
                            </button>
                          )}
                          {ev.status !== "Completed" && ev.status !== "Cancelled" && (
                            <button
                              type="button"
                              onClick={() => handleMarkCompleted(ev)}
                              className="rounded-lg p-1.5 text-teal-600 hover:bg-teal-50"
                              title="Mark as Completed"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditModal(ev)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                            title="Edit event"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(ev)}
                            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                            title="Delete event"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => {
            const img = resolveEventImageUrl(ev.imageUrl);
            const fillPct = ev.capacity > 0 ? Math.min(100, Math.round((ev.registered / ev.capacity) * 100)) : 0;
            return (
              <div key={ev.id} className="card flex flex-col overflow-hidden">
                <div className={`relative h-36 bg-gradient-to-br ${ev.gradient}`}>
                  {img && <img src={img} alt={ev.title} className="h-full w-full object-cover" />}
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                    {ev.category}
                  </span>
                  <span
                    className={`absolute right-3 top-3 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusBadgeClass(
                      ev.status,
                      ev.published
                    )}`}
                  >
                    {ev.status}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-base font-extrabold text-slate-900">
                      {ev.title}
                    </h3>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        ev.published !== false
                          ? "bg-sky-50 text-sky-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {ev.published !== false ? "Live" : "Hidden"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{ev.description}</p>

                  <ul className="mt-3 space-y-1 text-xs text-slate-600">
                    <li className="flex items-center gap-1.5">
                      <CalendarDays size={13} className="text-brand-600" /> {ev.date} · {ev.time}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-brand-600" /> {ev.location}
                    </li>
                  </ul>

                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>{ev.registered}/{ev.capacity} participants</span>
                      <span>{fillPct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-600" style={{ width: `${fillPct}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-100 pt-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openRegistrants(ev)}
                        className="btn-outline px-2.5 py-1 text-[11px]"
                      >
                        <Eye size={13} /> Registrants
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePublishToggle(ev)}
                        className="btn-outline px-2.5 py-1 text-[11px]"
                      >
                        {ev.published !== false ? "Unpublish" : "Publish"}
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(ev)}
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                        title="Edit"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(ev)}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card flex items-center justify-between px-5 py-3 text-xs text-slate-500">
          <span>
            Page {page + 1} of {totalPages} ({totalElements} events)
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

      {/* Create / Edit Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <div className="card max-h-[92vh] w-full max-w-2xl overflow-y-auto p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                {editing ? `Edit Event: ${editing.title}` : "Create New Campus Event"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                <AlertCircle size={16} /> {modalError}
              </div>
            )}

            <form className="mt-4 space-y-4" onSubmit={handleSave}>
              {/* Image Upload / Preview */}
              <div>
                <label className="label">Event Cover Image (Optional)</label>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-24 w-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400">Gradient fallback</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-outline px-3 py-1.5 text-xs"
                      >
                        <ImagePlus size={14} /> Upload Image
                      </button>
                      {(previewUrl || form.imageUrl) && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="btn-outline px-3 py-1.5 text-xs text-rose-600"
                        >
                          <Trash2 size={14} /> Remove Image
                        </button>
                      )}
                    </div>
                    <input
                      className="input text-xs"
                      placeholder="Or paste an image URL / path (e.g. /halls/green-hall.jpg)"
                      value={form.imageUrl}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, imageUrl: e.target.value }));
                        if (!selectedFile) {
                          setPreviewUrl(resolveEventImageUrl(e.target.value));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Event Title</label>
                <input
                  className="input"
                  required
                  minLength={3}
                  maxLength={150}
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input min-h-24"
                  required
                  minLength={10}
                  maxLength={2000}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Category</label>
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
                  <label className="label">Location / Hall</label>
                  <input
                    className="input"
                    required
                    maxLength={150}
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Event Date</label>
                  <input
                    type="date"
                    className="input"
                    required
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Event Time</label>
                  <input
                    type="time"
                    className="input"
                    required
                    value={form.time}
                    onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Organizer</label>
                  <input
                    className="input"
                    required
                    maxLength={150}
                    value={form.organizer}
                    onChange={(e) => setForm((p) => ({ ...p, organizer: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Capacity</label>
                  <input
                    type="number"
                    min={editing ? Math.max(1, editing.registered) : 1}
                    className="input"
                    required
                    value={form.capacity}
                    onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Event Status</label>
                  <select
                    className="input"
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    {EVENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.published}
                      onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    />
                    Published (visible on public Campus Events)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Saving..." : editing ? "Save Event Changes" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Registrants Modal */}
      {registrantsEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <div className="card max-h-[88vh] w-full max-w-2xl overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Registered Participants ({registrants.length})
                </h3>
                <p className="text-xs text-slate-500">
                  {registrantsEvent.title} · {registrantsEvent.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRegistrantsEvent(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {loadingRegistrants ? (
              <p className="py-10 text-center text-sm text-slate-400">Loading participants...</p>
            ) : registrants.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                No users have registered for this event yet.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">Participant</th>
                      <th className="px-3 py-2.5">Contact</th>
                      <th className="px-3 py-2.5">Department</th>
                      <th className="px-3 py-2.5">Registered At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {registrants.map((r) => (
                      <tr key={r.registrationId}>
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-slate-900">
                            {r.fullName || `${r.firstName} ${r.lastName}`}
                          </p>
                          <p className="text-slate-500">
                            @{r.username}
                            {r.studentCode ? ` · ${r.studentCode}` : ""}
                          </p>
                          {r.notes && (
                            <p className="mt-0.5 text-[11px] italic text-slate-500">
                              &ldquo;{r.notes}&rdquo;
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="text-slate-700">{r.email || "—"}</p>
                          <p className="font-mono text-slate-500">{r.phoneNumber}</p>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{r.department || "—"}</td>
                        <td className="px-3 py-2.5 text-slate-500">
                          {new Date(r.registeredAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Event?"
        description={
          deleteTarget
            ? `Are you sure you want to permanently delete "${deleteTarget.title}"? All ${deleteTarget.registered} participant registration record(s) for this event will also be removed.`
            : ""
        }
        confirmLabel="Delete Event"
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
