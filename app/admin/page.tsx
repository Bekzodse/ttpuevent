"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  Filter,
  Lock,
  Package,
  Palette,
  Power,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import AdminApplicationsTab from "@/components/AdminApplicationsTab";
import AdminBrandingTab from "@/components/AdminBrandingTab";
import AdminCancellationsTab from "@/components/AdminCancellationsTab";
import AdminEquipmentTab from "@/components/AdminEquipmentTab";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";
import UserAvatar from "@/components/UserAvatar";
import { adminApi, ApiError } from "@/lib/api";
import { AdminStats, LoginActivity, Role, User } from "@/lib/types";

function formatDate(iso: string | null) {
  if (!iso) return "Never logged in";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { t } = useI18n();

  const [tab, setTab] = useState<
    "applications" | "equipment" | "cancellations" | "branding" | "users" | "activity"
  >("applications");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");
  const [loggedInFilter, setLoggedInFilter] = useState<"" | "true" | "false">("");

  const [activities, setActivities] = useState<LoginActivity[]>([]);
  const [activityPage, setActivityPage] = useState(0);
  const [activityTotalPages, setActivityTotalPages] = useState(0);

  const [loadingData, setLoadingData] = useState(true);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Modals
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [viewHistory, setViewHistory] = useState<LoginActivity[]>([]);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    username: "",
    role: "USER" as Role,
    active: true,
    department: "",
    bio: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const qTab = new URLSearchParams(window.location.search).get("tab");
      if (
        qTab === "users" ||
        qTab === "activity" ||
        qTab === "applications" ||
        qTab === "equipment" ||
        qTab === "cancellations" ||
        qTab === "branding"
      ) {
        setTab(qTab);
      }
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== "ADMIN")) {
      router.replace(currentUser ? "/dashboard" : "/login");
    }
  }, [authLoading, currentUser, router]);

  const loadStatsAndUsers = useCallback(async () => {
    if (!currentUser || currentUser.role !== "ADMIN") return;
    setLoadingData(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.listUsers({
          search: search.trim() || undefined,
          role: roleFilter,
          active: statusFilter,
          loggedIn: loggedInFilter,
          page,
          size: 12,
        }),
      ]);
      setStats(statsRes);
      setUsers(usersRes.content);
      setTotalElements(usersRes.totalElements);
      setTotalPages(usersRes.totalPages);
    } catch (err) {
      setBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to load admin data.",
      });
    } finally {
      setLoadingData(false);
    }
  }, [currentUser, search, roleFilter, statusFilter, loggedInFilter, page]);

  const loadActivities = useCallback(async () => {
    if (!currentUser || currentUser.role !== "ADMIN") return;
    try {
      const res = await adminApi.getLoginActivity(activityPage, 20);
      setActivities(res.content);
      setActivityTotalPages(res.totalPages);
    } catch (err) {
      setBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to load login activity.",
      });
    }
  }, [currentUser, activityPage]);

  useEffect(() => {
    loadStatsAndUsers();
  }, [loadStatsAndUsers]);

  useEffect(() => {
    if (tab === "activity") {
      loadActivities();
    }
  }, [tab, loadActivities]);

  if (authLoading || !currentUser || currentUser.role !== "ADMIN") {
    return <div className="card h-96 animate-pulse bg-white" />;
  }

  const openViewModal = async (u: User) => {
    setViewUser(u);
    setViewHistory([]);
    try {
      const history = await adminApi.getUserLoginHistory(u.id);
      setViewHistory(history);
    } catch {
      setViewHistory([]);
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
        department: editForm.department.trim(),
        bio: editForm.bio.trim(),
      });
      setEditUser(null);
      setBanner({ type: "ok", text: `Updated account @${editForm.username}.` });
      await loadStatsAndUsers();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Failed to update user.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleStatus = async (u: User) => {
    setBanner(null);
    try {
      await adminApi.updateUserStatus(u.id, !u.active);
      setBanner({
        type: "ok",
        text: `${u.firstName} ${u.lastName} has been ${!u.active ? "activated" : "deactivated"}.`,
      });
      await loadStatsAndUsers();
    } catch (err) {
      setBanner({
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
      setBanner({
        type: "ok",
        text: `User @${deleteTarget.username} was permanently deleted.`,
      });
      setDeleteTarget(null);
      await loadStatsAndUsers();
    } catch (err) {
      setBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to delete user.",
      });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const statCards = [
    {
      label: "Total Registered Users",
      value: stats?.totalUsers ?? "—",
      sub: `${stats?.totalAdmins ?? 0} Admins · ${stats?.totalRegularUsers ?? 0} Students`,
      icon: Users,
      tone: "bg-brand-50 text-brand-600",
    },
    {
      label: "Currently Active Users",
      value: stats?.currentlyActiveUsers ?? "—",
      sub: "Online in last 15 minutes",
      icon: Activity,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Active Accounts",
      value: stats?.activeAccounts ?? "—",
      sub: `${stats?.inactiveAccounts ?? 0} deactivated accounts`,
      icon: UserCheck,
      tone: "bg-sky-50 text-sky-600",
    },
    {
      label: "Users Logged In",
      value: stats?.usersWhoLoggedIn ?? "—",
      sub: "Have signed in at least once",
      icon: ShieldCheck,
      tone: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
            <ShieldCheck size={14} /> {t.admin.badge}
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">{t.admin.title}</h1>
          <p className="text-sm text-slate-500">{t.admin.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              loadStatsAndUsers();
              if (tab === "activity") loadActivities();
            }}
            className="btn-outline text-xs"
          >
            <RefreshCw size={15} /> {t.admin.refresh}
          </button>
        </div>
      </div>

      {banner && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
            banner.type === "ok"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === "ok" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
            <span>{banner.text}</span>
          </div>
          <button onClick={() => setBanner(null)} className="text-current opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, sub, icon: Icon, tone }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}>
                <Icon size={21} />
              </span>
              <span className="text-3xl font-extrabold text-slate-900">{value}</span>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-800">{label}</p>
            <p className="text-xs text-slate-500">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        <button
          onClick={() => setTab("applications")}
          className={`inline-flex items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-semibold transition ${
            tab === "applications"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 size={15} /> {t.admin.tabApplications}
        </button>
        <button
          onClick={() => setTab("equipment")}
          className={`inline-flex items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-semibold transition ${
            tab === "equipment"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Package size={15} /> {t.admin.tabEquipment}
        </button>
        <button
          onClick={() => setTab("cancellations")}
          className={`inline-flex items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-semibold transition ${
            tab === "cancellations"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <RotateCcw size={15} /> {t.admin.tabCancellations}
        </button>
        <button
          onClick={() => setTab("branding")}
          className={`inline-flex items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-semibold transition ${
            tab === "branding"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Palette size={15} /> {t.admin.tabBranding}
        </button>
        <button
          onClick={() => setTab("users")}
          className={`inline-flex items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-semibold transition ${
            tab === "users"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users size={15} /> {t.admin.tabUsers} ({totalElements})
        </button>
        <button
          onClick={() => setTab("activity")}
          className={`inline-flex items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-semibold transition ${
            tab === "activity"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock size={15} /> {t.admin.tabActivity}
        </button>
      </div>

      {tab === "applications" && <AdminApplicationsTab onBanner={setBanner} />}
      {tab === "equipment" && <AdminEquipmentTab onBanner={setBanner} />}
      {tab === "cancellations" && <AdminCancellationsTab onBanner={setBanner} />}
      {tab === "branding" && <AdminBrandingTab onBanner={setBanner} />}

      {tab === "users" && (
        <div className="space-y-4">
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
                placeholder="Search name, username, phone, faculty..."
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
                    <th className="px-5 py-3.5">Phone</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Registered</th>
                    <th className="px-5 py-3.5">Last Login</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingData ? (
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
                      const isSelf = u.id === currentUser.id;
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
                          <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-slate-600">
                            {u.phoneNumber}
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
                                title="View details & login history"
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
        </div>
      )}

      {tab === "activity" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Login Time</th>
                  <th className="px-5 py-3.5">IP Address</th>
                  <th className="px-5 py-3.5">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                      No login activity recorded yet.
                    </td>
                  </tr>
                ) : (
                  activities.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            firstName={a.firstName}
                            lastName={a.lastName}
                            profilePictureUrl={a.profilePictureUrl}
                            size="sm"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">
                              {a.firstName} {a.lastName}
                            </p>
                            <p className="text-xs text-slate-500">@{a.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {a.role}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600">
                        {formatDate(a.loginTime)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-500">
                        {a.ipAddress || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            a.successful
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {a.successful ? "Success" : "Failed"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {activityTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              <span>
                Page {activityPage + 1} of {activityTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={activityPage === 0}
                  onClick={() => setActivityPage((p) => p - 1)}
                  className="btn-outline px-3 py-1.5 text-xs"
                >
                  Previous
                </button>
                <button
                  disabled={activityPage + 1 >= activityTotalPages}
                  onClick={() => setActivityPage((p) => p + 1)}
                  className="btn-outline px-3 py-1.5 text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View User Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
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
                    @{viewUser.username} · {viewUser.role}
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

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Phone Number</dt>
                <dd className="font-medium text-slate-900">{viewUser.phoneNumber}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Status</dt>
                <dd className="font-semibold text-slate-900">
                  {viewUser.active ? "Active" : "Deactivated"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Faculty / Department</dt>
                <dd className="font-medium text-slate-900">{viewUser.department || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Registered On</dt>
                <dd className="font-medium text-slate-900">{formatDate(viewUser.createdAt)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-500">Last Login Time</dt>
                <dd className="font-medium text-slate-900">{formatDate(viewUser.lastLoginAt)}</dd>
              </div>
              {viewUser.bio && (
                <div className="col-span-2">
                  <dt className="text-xs text-slate-500">Bio</dt>
                  <dd className="mt-0.5 text-slate-700">{viewUser.bio}</dd>
                </div>
              )}
            </dl>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recent Login History
              </h4>
              {viewHistory.length === 0 ? (
                <p className="mt-2 text-xs text-slate-400">No login records found.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {viewHistory.map((h) => (
                    <li
                      key={h.id}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"
                    >
                      <span className="text-slate-700">{formatDate(h.loginTime)}</span>
                      <span
                        className={
                          h.successful ? "font-semibold text-emerald-700" : "font-semibold text-rose-600"
                        }
                      >
                        {h.successful ? "Success" : "Failed"} · {h.ipAddress || "local"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Role</label>
                  <select
                    className="input"
                    disabled={editUser.id === currentUser.id}
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
                    disabled={editUser.id === currentUser.id}
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
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert size={24} />
              <h3 className="text-lg font-extrabold text-slate-900">Delete User Account?</h3>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Are you sure you want to permanently delete{" "}
              <span className="font-bold text-slate-900">
                {deleteTarget.firstName} {deleteTarget.lastName}
              </span>{" "}
              (@{deleteTarget.username})? This will remove their profile, hall applications, login
              history, and event registrations.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="btn-danger"
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
