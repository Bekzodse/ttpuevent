"use client";

import { useState, useEffect } from "react";
import { resolveAvatarUrl } from "@/lib/api";

interface UserAvatarProps {
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  online?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-2xl",
};

export default function UserAvatar({
  firstName = "",
  lastName = "",
  profilePictureUrl,
  size = "md",
  online,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const fullUrl = resolveAvatarUrl(profilePictureUrl);

  useEffect(() => {
    setImgError(false);
  }, [profilePictureUrl]);

  const initials =
    `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase() || "U";

  return (
    <div className="relative inline-flex shrink-0">
      {fullUrl && !imgError ? (
        <img
          src={fullUrl}
          alt={`${firstName} ${lastName}`}
          onError={() => setImgError(true)}
          className={`${sizeClasses[size]} rounded-full border border-slate-200 object-cover bg-slate-100`}
        />
      ) : (
        <span
          className={`${sizeClasses[size]} grid place-items-center rounded-full bg-gradient-to-br from-brand-600 to-indigo-700 font-bold text-white shadow-sm`}
        >
          {initials}
        </span>
      )}
      {online && (
        <span
          title="Currently active"
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"
        />
      )}
    </div>
  );
}
