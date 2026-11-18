"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileText, ImageIcon, Loader2 } from "lucide-react";
import { applicationsApi } from "@/lib/api";

export default function SecureReceiptViewer({
  receiptUrl,
  filename,
}: {
  receiptUrl: string;
  filename?: string | null;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;
    setLoading(true);
    setError(null);

    applicationsApi
      .fetchReceiptBlobUrl(receiptUrl)
      .then((res) => {
        if (!active) {
          URL.revokeObjectURL(res.url);
          return;
        }
        createdUrl = res.url;
        setBlobUrl(res.url);
        setMimeType(res.type);
      })
      .catch((err) => {
        if (active) setError(err?.message || "Unable to load receipt.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [receiptUrl]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <Loader2 size={15} className="animate-spin" /> Loading payment receipt...
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
        {error || "Receipt unavailable."}
      </div>
    );
  }

  const isPdf = mimeType.includes("pdf") || filename?.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5">
        <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
          <FileText size={18} className="text-rose-600" />
          <span>PDF Payment Receipt ({filename || "receipt.pdf"})</span>
        </div>
        <a
          href={blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline px-3 py-1.5 text-xs"
        >
          <ExternalLink size={14} /> Open PDF
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <ImageIcon size={14} /> Uploaded Payment Receipt
        </span>
        <a
          href={blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"
        >
          <ExternalLink size={13} /> Full size
        </a>
      </div>
      <img
        src={blobUrl}
        alt="Payment receipt"
        className="max-h-64 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain"
      />
    </div>
  );
}
