"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Clock, Search } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { adminApi, ApiError } from "@/lib/api";
import { AdminActivityLog, LoginActivity } from "@/lib/types";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function actionBadgeTone(actionType: string) {
  if (actionType.includes("DELETE") || actionType.includes("REJECT") || actionType.includes("CANCEL")) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (actionType.includes("APPROVE") || actionType.includes("PUBLISH") || actionType.includes("CREATE")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (actionType.includes("UNPUBLISH") || actionType.includes("INFO") || actionType.includes("STATUS")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-brand-50 text-brand-700 border-brand-200";
}

export default function AdminActivityLogsTab({
  onBanner,
  refreshTick,
}: {
  onBanner: (b: { type: "ok" | "err"; text: string }) => void;
  refreshTick: number;
}) {
  const [subTab, setSubTab] = useState<"admin" | "login">("admin");

  // Admin activity logs
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [logsPage, setLogsPage] = useState(0);
  const [logsTotalPages, setLogsTotalPages] = useState(0);
  const [logsTotalElements, setLogsTotalElements] = useState(0);
  const [search, setSearch] = useState("");
  const [targetType, setTargetType] = useState("");
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Login activity logs
  const [logins, setLogins] = useState<LoginActivity[]>([]);
  const [loginPage, setLoginPage] = useState(0);
  const [loginTotalPages, setLoginTotalPages] = useState(0);
  const [loadingLogins, setLoadingLogins] = useState(false);

  const loadAdminLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await adminApi.getActivityLogs({
        search: search.trim() || undefined,
        targetType: targetType || undefined,
        page: logsPage,
        size: 20,
      });
      setLogs(res.content);
      setLogsTotalPages(res.totalPages);
      setLogsTotalElements(res.totalElements);
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to load admin activity logs.",
      });
    } finally {
      setLoadingLogs(false);
    }
  }, [search, targetType, logsPage, onBanner]);

  const loadLogins = useCallback(async () => {
    setLoadingLogins(true);
    try {
      const res = await adminApi.getLoginActivity(loginPage, 20);
      setLogins(res.content);
      setLoginTotalPages(res.totalPages);
    } catch (err) {
      onBanner({
        type: "err",
        text: err instanceof ApiError ? err.message : "Failed to load login activity.",
      });
    } finally {
      setLoadingLogins(false);
    }
  }, [loginPage, onBanner]);

  useEffect(() => {
    if (subTab === "admin") loadAdminLogs();
    else loadLogins();
  }, [subTab, loadAdminLogs, loadLogins, refreshTick]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Activity Logs</h2>
          <p className="text-xs text-slate-500">
            Audit trail of administrative actions and user authentication events.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setSubTab("admin")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-bold transition ${
              subTab === "admin" ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Activity size={14} /> Admin Actions ({logsTotalElements})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("login")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-bold transition ${
              subTab === "login" ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock size={14} /> Login Activity
          </button>
        </div>
      </div>

      {subTab === "admin" ? (
        <>
          <div className="card grid gap-3 p-4 sm:grid-cols-3">
            <div className="relative sm:col-span-2">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                className="input pl-10"
                placeholder="Search actor, action, target, or details..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setLogsPage(0);
                }}
              />
            </div>

            <select
              className="input"
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value);
                setLogsPage(0);
              }}
            >
              <option value="">All Resource Types</option>
              <option value="EVENT">Events</option>
              <option value="APPLICATION">Applications</option>
              <option value="USER">Users</option>
            </select>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Date &amp; Time</th>
                    <th className="px-5 py-3.5">Administrator</th>
                    <th className="px-5 py-3.5">Action</th>
                    <th className="px-5 py-3.5">Target</th>
                    <th className="px-5 py-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                        Loading administrative activity...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                        No administrative actions recorded yet. Actions such as creating/updating events or approving/rejecting applications will appear here.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs">
                          <p className="font-bold text-slate-900">{log.actorFullName}</p>
                          <p className="text-slate-500">@{log.actorUsername}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${actionBadgeTone(
                              log.actionType
                            )}`}
                          >
                            {log.actionType.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {log.targetType}
                          </span>{" "}
                          <span className="font-semibold text-slate-800">{log.targetLabel || "—"}</span>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600">{log.details || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {logsTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                <span>
                  Page {logsPage + 1} of {logsTotalPages} ({logsTotalElements} records)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={logsPage === 0}
                    onClick={() => setLogsPage((p) => p - 1)}
                    className="btn-outline px-3 py-1.5 text-xs"
                  >
                    Previous
                  </button>
                  <button
                    disabled={logsPage + 1 >= logsTotalPages}
                    onClick={() => setLogsPage((p) => p + 1)}
                    className="btn-outline px-3 py-1.5 text-xs"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
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
                {loadingLogins ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                      Loading login history...
                    </td>
                  </tr>
                ) : logins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                      No login activity recorded yet.
                    </td>
                  </tr>
                ) : (
                  logins.map((a) => (
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
                            a.successful ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
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

          {loginTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              <span>
                Page {loginPage + 1} of {loginTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={loginPage === 0}
                  onClick={() => setLoginPage((p) => p - 1)}
                  className="btn-outline px-3 py-1.5 text-xs"
                >
                  Previous
                </button>
                <button
                  disabled={loginPage + 1 >= loginTotalPages}
                  onClick={() => setLoginPage((p) => p + 1)}
                  className="btn-outline px-3 py-1.5 text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
