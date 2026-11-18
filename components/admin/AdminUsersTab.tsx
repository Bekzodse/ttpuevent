"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Edit3,
  Eye,
  FileText,
  Filter,
  History,
  Power,
  Search,
  Trash2,
  X,
} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import BookingStatusBadge from "@/components/BookingStatusBadge";
import { adminApi, ApiError } from "@/lib/api";
import { LoginActivity, Role, User, UserApplicationHistory } from "@/lib/types";
import ConfirmDialog from "./ConfirmDialog";

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminUsersTab({
  currentUserId,
  onBanner,
  refreshTick,
}: {
  currentUserId: number;
  onBanner: (b: { type: "ok" | "err"; text: string }) => void;
  refreshTick: number;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");
  const [loggedInFilter, setLoggedInFilter] = useState<"" | "true" | "false">("");

  // View user + application history modal
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [viewTab, setViewTab] = useState<"profile" | "applications" | "events" | "logins">("profile");
  const [viewLoginHistory, setViewLoginHistory] = useState<LoginActivity[]>([]);
  const [appHistory, setAppHistory] = useState<UserApplicationHistory | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Edit user modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    username: "",
    email: "",
    role: "USER" as Role,
    active: true,
    department: "",
    bio: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers({
        search: search.trim() || undefined,
        role: roleFilter,
        active: statusFilter,
        loggedIn: loggedInFilter,
        page,
        size: 12,
      });
      setUsers(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to load users.",
      });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, loggedInFilter, page, onBanner]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, refreshTick]);

  const openViewModal = async (u: User) => {
    setViewUser(u);
    setViewTab("profile");
    setViewLoginHistory([]);
    setAppHistory(null);
    setLoadingDetails(true);
    try {
      const [history, appHist] = await Promise.all([
        adminApi.getUserLoginHistory(u.id),
        adminApi.getUserApplications(u.id),
      ]);
      setViewLoginHistory(history);
      setAppHistory(appHist);
    } catch {
      // ignore partial failure
    } finally {
      setLoadingDetails(false);
    }
  };

  const openEditModal = (u: User) => {
    setEditUser(u);
    setEditError(null);
    setEditForm({
      firstName: u.firstName,
      lastName: u.lastName,
      phoneNumber: u.phoneNumber,
      username: u.username,
      email: u.email || "",
      role: u.role,
      active: u.active,
      department: u.department || "",
      bio: u.bio || "",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditError(null);
    setEditSaving(true);
    try {
      await adminApi.updateUser(editUser.id, {
        ...editForm,
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phoneNumber: editForm.phoneNumber.trim(),
        username: editForm.username.trim(),
        email: editForm.email.trim() || undefined,
        department: editForm.department.trim(),
        bio: editForm.bio.trim(),
      });
      setEditUser(null);
      onBanner({ type: "ok", text: `Updated account @${editForm.username}.` });
      await loadUsers();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Failed to update user.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleStatus = async (u: User) => {
    try {
      await adminApi.updateUserStatus(u.id, !u.active);
      onBanner({
        type: "ok",
        text: `${u.firstName} ${u.lastName} has been ${!u.active ? "activated" : "deactivated"}.`,
      });
      await loadUsers();
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to update account status.",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteUser(deleteTarget.id);
      onBanner({
        type: "ok",
        text: `User @${deleteTarget.username} was permanently deleted.`,
      });
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to delete user.",
      });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            User Management ({totalElements})
          </h2>
          <p className="text-xs text-slate-500">
            Inspect user profiles, event &amp; hall application history, and manage account access.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search name, username, email, phone, faculty..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>

        <div className="relative">
          <Filter
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <select
            className="input pl-8"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as Role | "");
              setPage(0);
            }}
          >
            <option value="">All Roles</option>
            <option value="USER">USER (Student)</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <select
          className="input"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as "" | "true" | "false");
            setPage(0);
          }}
        >
          <option value="">All Statuses</option>
          <option value="true">Active Only</option>
          <option value="false">Deactivated Only</option>
        </select>

        <select
          className="input"
          value={loggedInFilter}
          onChange={(e) => {
            setLoggedInFilter(e.target.value as "" | "true" | "false");
            setPage(0);
          }}
        >
          <option value="">All Login History</option>
          <option value="true">Has Logged In</option>
          <option value="false">Never Logged In</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Registered</th>
                <th className="px-5 py-3.5">Last Login</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    No users match the selected filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            firstName={u.firstName}
                            lastName={u.lastName}
                            profilePictureUrl={u.profilePictureUrl}
                            size="md"
                            online={u.currentlyOnline}
                          />
                          <div>
                            <p className="font-semibold text-slate-900">
                              {u.firstName} {u.lastName}
                              {isSelf && (
                                <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                                  YOU
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">
                              @{u.username}
                              {u.department ? ` · ${u.department}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <p className="text-slate-700">{u.email || "—"}</p>
                        <p className="font-mono text-slate-500">{u.phoneNumber}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            u.role === "ADMIN"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-brand-50 text-brand-700"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          {u.currentlyOnline && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500" title="Online" />
                          )}
                          <span>{formatDate(u.lastLoginAt)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            u.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {u.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openViewModal(u)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600"
                            title="View profile & application history"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openEditModal(u)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                            title="Edit user"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            disabled={isSelf}
                            onClick={() => handleToggleStatus(u)}
                            className={`rounded-lg p-1.5 transition disabled:cursor-not-allowed disabled:opacity-35 ${
                              u.active
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={
                              isSelf
                                ? "Cannot deactivate your own account"
                                : u.active
                                ? "Deactivate account"
                                : "Activate account"
                            }
                          >
                            <Power size={16} />
                          </button>
                          <button
                            disabled={isSelf}
                            onClick={() => setDeleteTarget(u)}
                            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-35"
                            title={isSelf ? "Cannot delete your own account" : "Delete user"}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            <span>
              Page {page + 1} of {totalPages} ({totalElements} users)
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

      {/* View User Profile & History Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  firstName={viewUser.firstName}
                  lastName={viewUser.lastName}
                  profilePictureUrl={viewUser.profilePictureUrl}
                  size="lg"
                  online={viewUser.currentlyOnline}
                />
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {viewUser.firstName} {viewUser.lastName}
                  </h3>
                  <p className="text-sm text-slate-500">
                    @{viewUser.username} · {viewUser.role} ·{" "}
                    <span className={viewUser.active ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                      {viewUser.active ? "Active" : "Deactivated"}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="mt-4 flex flex-wrap gap-1 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setViewTab("profile")}
                className={`border-b-2 px-3 py-2 text-xs font-bold transition ${
                  viewTab === "profile"
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Profile Details
              </button>
              <button
                type="button"
                onClick={() => setViewTab("applications")}
                className={`inline-flex items-center gap-1 border-b-2 px-3 py-2 text-xs font-bold transition ${
                  viewTab === "applications"
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText size={13} /> Hall Applications ({appHistory?.hallApplications.length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setViewTab("events")}
                className={`inline-flex items-center gap-1 border-b-2 px-3 py-2 text-xs font-bold transition ${
                  viewTab === "events"
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <CalendarDays size={13} /> Event Registrations (
                {appHistory?.eventRegistrations.length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setViewTab("logins")}
                className={`inline-flex items-center gap-1 border-b-2 px-3 py-2 text-xs font-bold transition ${
                  viewTab === "logins"
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <History size={13} /> Login History ({viewLoginHistory.length})
              </button>
            </div>

            {viewTab === "profile" && (
              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">Email Address</dt>
                  <dd className="font-medium text-slate-900">{viewUser.email || "Not set"}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">Phone Number</dt>
                  <dd className="font-mono font-medium text-slate-900">{viewUser.phoneNumber}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">Faculty / Department</dt>
                  <dd className="font-medium text-slate-900">{viewUser.department || "Not set"}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">Registered On</dt>
                  <dd className="font-medium text-slate-900">{formatDate(viewUser.createdAt)}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
                  <dt className="text-xs text-slate-500">Last Login Time</dt>
                  <dd className="font-medium text-slate-900">{formatDate(viewUser.lastLoginAt)}</dd>
                </div>
                {viewUser.bio && (
                  <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
                    <dt className="text-xs text-slate-500">Bio</dt>
                    <dd className="mt-0.5 text-slate-700">{viewUser.bio}</dd>
                  </div>
                )}
              </dl>
            )}

            {viewTab === "applications" && (
              <div className="mt-4">
                {loadingDetails ? (
                  <p className="py-8 text-center text-xs text-slate-400">Loading applications...</p>
                ) : !appHistory || appHistory.hallApplications.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500">
                    This user has not submitted any hall applications.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {appHistory.hallApplications.map((app) => (
                      <div
                        key={app.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-white px-2 py-0.5 font-mono font-bold text-slate-800">
                              {app.applicationCode}
                            </span>
                            <span className="font-bold text-slate-900">{app.eventName}</span>
                          </div>
                          <p className="mt-1 text-slate-500">
                            {app.hall.name} · Event: {app.eventDate} ({app.startTime}–{app.endTime}) ·
                            Submitted: {formatDate(app.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">${app.requiredAmount ?? 0}</span>
                          <BookingStatusBadge status={app.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {viewTab === "events" && (
              <div className="mt-4">
                {loadingDetails ? (
                  <p className="py-8 text-center text-xs text-slate-400">Loading registrations...</p>
                ) : !appHistory || appHistory.eventRegistrations.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500">
                    This user has not registered for any campus events.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {appHistory.eventRegistrations.map((reg) => (
                      <div
                        key={reg.registrationId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{reg.event.title}</p>
                          <p className="mt-0.5 text-slate-500">
                            {reg.event.category} · {reg.event.date} {reg.event.time} ·{" "}
                            {reg.event.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-white px-2.5 py-0.5 font-semibold text-slate-700">
                            {reg.event.status}
                          </span>
                          <p className="mt-1 text-[10px] text-slate-400">
                            Joined {formatDate(reg.registeredAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {viewTab === "logins" && (
              <div className="mt-4">
                {viewLoginHistory.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">No login records found.</p>
                ) : (
                  <ul className="space-y-2">
                    {viewLoginHistory.map((h) => (
                      <li
                        key={h.id}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"
                      >
                        <span className="text-slate-700">{formatDate(h.loginTime)}</span>
                        <span
                          className={
                            h.successful
                              ? "font-semibold text-emerald-700"
                              : "font-semibold text-rose-600"
                          }
                        >
                          {h.successful ? "Success" : "Failed"} · {h.ipAddress || "local"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                Edit User @{editUser.username}
              </h3>
              <button
                onClick={() => setEditUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                <AlertCircle size={16} /> {editError}
              </div>
            )}

            <form className="mt-4 space-y-4" onSubmit={handleEditSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">First name</label>
                  <input
                    className="input"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Last name</label>
                  <input
                    className="input"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Username</label>
                  <input
                    className="input"
                    required
                    value={editForm.username}
                    onChange={(e) => setEditForm((p) => ({ ...p, username: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Phone number</label>
                  <input
                    className="input"
                    required
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="student@turin.uz"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Role</label>
                  <select
                    className="input"
                    disabled={editUser.id === currentUserId}
                    value={editForm.role}
                    onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value as Role }))}
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="label">Account Status</label>
                  <select
                    className="input"
                    disabled={editUser.id === currentUserId}
                    value={editForm.active ? "true" : "false"}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, active: e.target.value === "true" }))
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">Deactivated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Faculty / Department</label>
                <input
                  className="input"
                  value={editForm.department}
                  onChange={(e) => setEditForm((p) => ({ ...p, department: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditUser(null)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={editSaving} className="btn-primary">
                  {editSaving ? "Saving..." : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User Account?"
        description={
          deleteTarget
            ? `Are you sure you want to permanently delete ${deleteTarget.firstName} ${deleteTarget.lastName} (@${deleteTarget.username})? This will remove their profile, hall applications, login history, and event registrations.`
            : ""
        }
        confirmLabel="Delete Permanently"
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
