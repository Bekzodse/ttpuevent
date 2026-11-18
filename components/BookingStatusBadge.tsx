"use client";

import { useI18n } from "./I18nProvider";
import { BookingStatus } from "@/lib/types";

const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  UNDER_REVIEW: "bg-indigo-50 text-indigo-700 border-indigo-200",
  APPROVED: "bg-sky-50 text-sky-700 border-sky-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  PAYMENT_PENDING: "bg-orange-50 text-orange-700 border-orange-200",
  PAYMENT_UNDER_REVIEW: "bg-purple-50 text-purple-700 border-purple-200",
  PAYMENT_APPROVED: "bg-teal-50 text-teal-700 border-teal-200",
  PAYMENT_REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
  EXPIRED: "bg-slate-200 text-slate-700 border-slate-300",
};

export default function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useI18n();
  const label = t.status[status] || status;
  const classes = STATUS_COLORS[status] || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}
