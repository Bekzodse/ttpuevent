"use client";

import { useState } from "react";
import { CheckCircle2, Ticket } from "lucide-react";

export default function RegisterButton({
  disabled,
  disabledText,
}: {
  disabled?: boolean;
  disabledText?: string;
}) {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
        <CheckCircle2 size={18} /> Siz muvaffaqiyatli ro'yxatdan o'tdingiz!
      </div>
    );
  }

  return (
    <button
      className="btn-primary w-full"
      disabled={disabled}
      onClick={() => setDone(true)}
    >
      <Ticket size={18} />
      {disabled ? disabledText ?? "Ro'yxatdan o'tish yopiq" : "Ro'yxatdan o'tish"}
    </button>
  );
}
