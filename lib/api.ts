import {
  AdminActivityLog,
  AdminAnalytics,
  AdminStats,
  ApiErrorPayload,
  ApplicationStats,
  AppNotification,
  AuthResponse,
  BookingStatus,
  CalendarResponse,
  CancellationPolicy,
  CancellationRequest,
  CancellationStatus,
  Equipment,
  EquipmentHistoryItem,
  EquipmentReservation,
  EventHall,
  EventRegistrant,
  FinancialAuditLog,
  HallApplication,
  HallScheduleBlock,
  LoginActivity,
  PageResponse,
  RefundStatus,
  Role,
  TimeSlotAvailability,
  UniversityBranding,
  UniversityEvent,
  User,
  UserApplicationHistory,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8080";

const TOKEN_KEY = "uems_jwt_token";
const USER_KEY = "uems_user_data";

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function storeSession(token: string, user: User) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function storeUser(user: User) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function resolveAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function resolveEventImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/api/")) return `${API_BASE_URL}${path}`;
  return path.startsWith("/") ? path : `/${path}`;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth = false
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getStoredToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else if (requireAuth) {
    throw new ApiError("Authentication required. Please sign in.", 401);
  }

  if (!(options.body instanceof FormData) && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "Unable to connect to the university server. Please ensure the backend service is running.",
      503
    );
  }

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      // Non-JSON error body
    }
    const message =
      payload?.message ||
      (response.status === 401
        ? "Your session has expired. Please log in again."
        : response.status === 403
        ? "You do not have permission to perform this action."
        : `Request failed with status ${response.status}.`);

    throw new ApiError(message, response.status, payload?.fieldErrors);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function fetchAuthenticatedBlob(endpoint: string): Promise<Blob> {
  const token = getStoredToken();
  if (!token) {
    throw new ApiError("Authentication required. Please sign in.", 401);
  }
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    let msg = `Failed to download file (${response.status})`;
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      if (payload?.message) msg = payload.message;
    } catch {
      // ignore
    }
    throw new ApiError(msg, response.status);
  }
  return response.blob();
}

export const authApi = {
  login: (data: { username: string; password: string }) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    username: string;
    password: string;
    department?: string;
    email?: string;
  }) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<User>("/api/auth/me", { method: "GET" }, true),
};

export const userApi = {
  getProfile: () => request<User>("/api/users/me", { method: "GET" }, true),

  updateProfile: (data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    department?: string;
    bio?: string;
    email?: string;
  }) =>
    request<User>(
      "/api/users/me",
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      true
    ),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) =>
    request<{ message: string }>(
      "/api/users/me/password",
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      true
    ),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<User>(
      "/api/users/me/avatar",
      {
        method: "POST",
        body: formData,
      },
      true
    );
  },

  deleteAvatar: () =>
    request<User>("/api/users/me/avatar", { method: "DELETE" }, true),
};

export const hallsApi = {
  list: () => request<EventHall[]>("/api/halls", { method: "GET" }),
};

export const calendarApi = {
  getCalendar: (startDate: string, endDate: string, hallId?: string | number) => {
    const qs = new URLSearchParams({ startDate, endDate });
    if (hallId) qs.set("hallId", String(hallId));
    return request<CalendarResponse>(`/api/calendar?${qs.toString()}`, { method: "GET" });
  },

  getDailyAvailability: (hallId: string | number, date: string) =>
    request<TimeSlotAvailability[]>(
      `/api/calendar/availability?hallId=${hallId}&date=${date}`,
      { method: "GET" }
    ),

  createBlock: (data: {
    hallId: number;
    blockDate: string;
    startTime: string;
    endTime: string;
    blockType: string;
    reason: string;
  }) =>
    request<HallScheduleBlock>(
      "/api/admin/calendar/blocks",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true
    ),

  deleteBlock: (id: number) =>
    request<{ message: string }>(`/api/admin/calendar/blocks/${id}`, { method: "DELETE" }, true),
};

export const equipmentApi = {
  listAvailable: (date?: string, startTime?: string, endTime?: string) => {
    const qs = new URLSearchParams();
    if (date && startTime && endTime && endTime > startTime) {
      qs.set("date", date);
      qs.set("startTime", startTime);
      qs.set("endTime", endTime);
    }
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<Equipment[]>(`/api/equipment${suffix}`, { method: "GET" });
  },

  listAllAdmin: () => request<Equipment[]>("/api/admin/equipment", { method: "GET" }, true),

  create: (data: {
    name: string;
    category: string;
    description?: string;
    totalQuantity: number;
    unitFee: number;
    active: boolean;
  }) =>
    request<Equipment>(
      "/api/admin/equipment",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true
    ),

  update: (
    id: number,
    data: {
      name: string;
      category: string;
      description?: string;
      totalQuantity: number;
      unitFee: number;
      active: boolean;
    }
  ) =>
    request<Equipment>(
      `/api/admin/equipment/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      true
    ),

  toggleStatus: (id: number, active: boolean) =>
    request<Equipment>(
      `/api/admin/equipment/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ active }),
      },
      true
    ),

  delete: (id: number) =>
    request<{ message: string }>(`/api/admin/equipment/${id}`, { method: "DELETE" }, true),

  history: (id: number) =>
    request<EquipmentHistoryItem[]>(`/api/admin/equipment/${id}/history`, { method: "GET" }, true),

  approveReservation: (appId: number, resId: number, comment?: string) =>
    request<EquipmentReservation>(
      `/api/admin/applications/${appId}/equipment/${resId}/approve`,
      {
        method: "POST",
        body: JSON.stringify({ comment: comment || "" }),
      },
      true
    ),

  rejectReservation: (appId: number, resId: number, comment: string) =>
    request<EquipmentReservation>(
      `/api/admin/applications/${appId}/equipment/${resId}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ comment }),
      },
      true
    ),
};

export const applicationsApi = {
  submit: (data: {
    eventName: string;
    eventType: string;
    hallId: number;
    eventDate: string;
    startTime: string;
    endTime: string;
    expectedParticipants: number;
    description?: string;
    equipmentItems?: { equipmentId: number; quantity: number }[];
  }) =>
    request<HallApplication>(
      "/api/applications",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true
    ),

  myApplications: () =>
    request<HallApplication[]>("/api/applications/my", { method: "GET" }, true),

  get: (id: number) =>
    request<HallApplication>(`/api/applications/${id}`, { method: "GET" }, true),

  reply: (id: number, reply: string) =>
    request<HallApplication>(
      `/api/applications/${id}/reply`,
      {
        method: "POST",
        body: JSON.stringify({ reply }),
      },
      true
    ),

  uploadReceipt: (id: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<HallApplication>(
      `/api/applications/${id}/receipt`,
      {
        method: "POST",
        body: formData,
      },
      true
    );
  },

  cancel: (id: number) =>
    request<HallApplication>(`/api/applications/${id}/cancel`, { method: "POST" }, true),

  requestCancellation: (id: number, reason: string) =>
    request<CancellationRequest>(
      `/api/applications/${id}/cancellation-request`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      },
      true
    ),

  downloadConfirmationPdf: async (id: number, applicationCode: string) => {
    const blob = await fetchAuthenticatedBlob(`/api/applications/${id}/confirmation-pdf`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booking-confirmation-${applicationCode}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  fetchReceiptBlobUrl: async (receiptUrl: string) => {
    const blob = await fetchAuthenticatedBlob(receiptUrl);
    return { url: URL.createObjectURL(blob), type: blob.type };
  },
};

export const cancellationsApi = {
  getPolicy: () => request<CancellationPolicy>("/api/cancellation-policy", { method: "GET" }),
  myRequests: () => request<CancellationRequest[]>("/api/cancellations/my", { method: "GET" }, true),

  listAllAdmin: (params: {
    status?: CancellationStatus | "";
    refundStatus?: RefundStatus | "";
    search?: string;
    page?: number;
    size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.refundStatus) qs.set("refundStatus", params.refundStatus);
    if (params.search) qs.set("search", params.search);
    qs.set("page", String(params.page ?? 0));
    qs.set("size", String(params.size ?? 15));
    return request<PageResponse<CancellationRequest>>(
      `/api/admin/cancellations?${qs.toString()}`,
      { method: "GET" },
      true
    );
  },

  approve: (id: number, comment?: string) =>
    request<CancellationRequest>(
      `/api/admin/cancellations/${id}/approve`,
      { method: "POST", body: JSON.stringify({ comment: comment || "" }) },
      true
    ),

  reject: (id: number, comment: string) =>
    request<CancellationRequest>(
      `/api/admin/cancellations/${id}/reject`,
      { method: "POST", body: JSON.stringify({ comment }) },
      true
    ),

  completeRefund: (id: number, data: { refundAmount: number; transactionRef: string; adminComment?: string }) =>
    request<CancellationRequest>(
      `/api/admin/cancellations/${id}/complete-refund`,
      { method: "POST", body: JSON.stringify(data) },
      true
    ),

  rejectRefund: (id: number, comment: string) =>
    request<CancellationRequest>(
      `/api/admin/cancellations/${id}/reject-refund`,
      { method: "POST", body: JSON.stringify({ comment }) },
      true
    ),

  updatePolicy: (data: {
    name: string;
    fullRefundHoursBefore: number;
    partialRefundHoursBefore: number;
    partialRefundPercent: number;
    releaseHallOnApproval: boolean;
    description?: string;
  }) =>
    request<CancellationPolicy>(
      "/api/admin/cancellation-policy",
      { method: "PUT", body: JSON.stringify(data) },
      true
    ),

  financialAudit: (page = 0, size = 20) =>
    request<PageResponse<FinancialAuditLog>>(
      `/api/admin/financial-audit?page=${page}&size=${size}`,
      { method: "GET" },
      true
    ),
};

export const brandingApi = {
  get: () => request<UniversityBranding>("/api/branding", { method: "GET" }),

  update: (data: {
    universityName: string;
    universitySubtitle: string;
    loginHeadline: string;
    loginDescription: string;
    primaryColor: string;
    secondaryColor: string;
    contactEmail?: string;
    contactPhone?: string;
    contactAddress?: string;
    websiteUrl?: string;
  }) =>
    request<UniversityBranding>(
      "/api/admin/branding",
      { method: "PUT", body: JSON.stringify(data) },
      true
    ),

  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<UniversityBranding>(
      "/api/admin/branding/logo",
      { method: "POST", body: formData },
      true
    );
  },

  deleteLogo: () =>
    request<UniversityBranding>("/api/admin/branding/logo", { method: "DELETE" }, true),
};

export const adminApplicationsApi = {
  getStats: () =>
    request<ApplicationStats>("/api/admin/applications/stats", { method: "GET" }, true),

  list: (params: {
    search?: string;
    status?: BookingStatus | "";
    hallId?: string;
    eventType?: string;
    eventDate?: string;
    submittedDate?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    page?: number;
    size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.status) qs.set("status", params.status);
    if (params.hallId) qs.set("hallId", params.hallId);
    if (params.eventType) qs.set("eventType", params.eventType);
    if (params.eventDate) qs.set("eventDate", params.eventDate);
    if (params.submittedDate) qs.set("submittedDate", params.submittedDate);
    if (params.sortBy) qs.set("sortBy", params.sortBy);
    if (params.sortDir) qs.set("sortDir", params.sortDir);
    qs.set("page", String(params.page ?? 0));
    qs.set("size", String(params.size ?? 15));
    return request<PageResponse<HallApplication>>(
      `/api/admin/applications?${qs.toString()}`,
      { method: "GET" },
      true
    );
  },

  get: (id: number) =>
    request<HallApplication>(`/api/admin/applications/${id}`, { method: "GET" }, true),

  approve: (id: number, comment?: string) =>
    request<HallApplication>(
      `/api/admin/applications/${id}/approve`,
      {
        method: "POST",
        body: JSON.stringify({ comment: comment || "" }),
      },
      true
    ),

  reject: (id: number, comment: string) =>
    request<HallApplication>(
      `/api/admin/applications/${id}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ comment }),
      },
      true
    ),

  requestInfo: (id: number, comment: string) =>
    request<HallApplication>(
      `/api/admin/applications/${id}/request-info`,
      {
        method: "POST",
        body: JSON.stringify({ comment }),
      },
      true
    ),

  approvePayment: (id: number, comment?: string) =>
    request<HallApplication>(
      `/api/admin/applications/${id}/approve-payment`,
      {
        method: "POST",
        body: JSON.stringify({ comment: comment || "" }),
      },
      true
    ),

  rejectPayment: (id: number, comment: string) =>
    request<HallApplication>(
      `/api/admin/applications/${id}/reject-payment`,
      {
        method: "POST",
        body: JSON.stringify({ comment }),
      },
      true
    ),

  changeStatus: (id: number, status: BookingStatus, comment?: string) =>
    request<HallApplication>(
      `/api/admin/applications/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status, comment: comment || "" }),
      },
      true
    ),

  delete: (id: number) =>
    request<{ message: string }>(`/api/admin/applications/${id}`, { method: "DELETE" }, true),
};

export const notificationsApi = {
  list: () => request<AppNotification[]>("/api/notifications", { method: "GET" }, true),
  unreadCount: () =>
    request<{ unreadCount: number }>("/api/notifications/unread-count", { method: "GET" }, true),
  markRead: (id: number) =>
    request<AppNotification>(`/api/notifications/${id}/read`, { method: "PATCH" }, true),
  markAllRead: () =>
    request<{ message: string }>("/api/notifications/read-all", { method: "PATCH" }, true),
};

export const adminApi = {
  getStats: () => request<AdminStats>("/api/admin/stats", { method: "GET" }, true),

  getAnalytics: () => request<AdminAnalytics>("/api/admin/analytics", { method: "GET" }, true),

  getActivityLogs: (params: {
    search?: string;
    actionType?: string;
    targetType?: string;
    page?: number;
    size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.actionType) qs.set("actionType", params.actionType);
    if (params.targetType) qs.set("targetType", params.targetType);
    qs.set("page", String(params.page ?? 0));
    qs.set("size", String(params.size ?? 25));
    return request<PageResponse<AdminActivityLog>>(
      `/api/admin/activity-logs?${qs.toString()}`,
      { method: "GET" },
      true
    );
  },

  listUsers: (params: {
    search?: string;
    role?: Role | "";
    active?: "" | "true" | "false";
    loggedIn?: "" | "true" | "false";
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
  }) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.role) qs.set("role", params.role);
    if (params.active) qs.set("active", params.active);
    if (params.loggedIn) qs.set("loggedIn", params.loggedIn);
    qs.set("page", String(params.page ?? 0));
    qs.set("size", String(params.size ?? 15));
    if (params.sortBy) qs.set("sortBy", params.sortBy);
    if (params.sortDir) qs.set("sortDir", params.sortDir);
    return request<PageResponse<User>>(`/api/admin/users?${qs.toString()}`, { method: "GET" }, true);
  },

  getUser: (id: number) => request<User>(`/api/admin/users/${id}`, { method: "GET" }, true),

  getUserApplications: (id: number) =>
    request<UserApplicationHistory>(`/api/admin/users/${id}/applications`, { method: "GET" }, true),

  updateUser: (
    id: number,
    data: {
      firstName: string;
      lastName: string;
      phoneNumber: string;
      username: string;
      email?: string;
      role: Role;
      active: boolean;
      department?: string;
      bio?: string;
    }
  ) =>
    request<User>(
      `/api/admin/users/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      true
    ),

  updateUserStatus: (id: number, active: boolean) =>
    request<User>(
      `/api/admin/users/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ active }),
      },
      true
    ),

  deleteUser: (id: number) =>
    request<{ message: string }>(`/api/admin/users/${id}`, { method: "DELETE" }, true),

  getLoginActivity: (page = 0, size = 25) =>
    request<PageResponse<LoginActivity>>(
      `/api/admin/login-activity?page=${page}&size=${size}`,
      { method: "GET" },
      true
    ),

  getUserLoginHistory: (id: number) =>
    request<LoginActivity[]>(`/api/admin/users/${id}/login-history`, { method: "GET" }, true),
};

export const adminEventsApi = {
  list: (params: {
    search?: string;
    category?: string;
    status?: string;
    published?: "" | "true" | "false";
    sortBy?: string;
    sortDir?: "asc" | "desc";
    page?: number;
    size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.category) qs.set("category", params.category);
    if (params.status) qs.set("status", params.status);
    if (params.published) qs.set("published", params.published);
    if (params.sortBy) qs.set("sortBy", params.sortBy);
    if (params.sortDir) qs.set("sortDir", params.sortDir);
    qs.set("page", String(params.page ?? 0));
    qs.set("size", String(params.size ?? 15));
    return request<PageResponse<UniversityEvent>>(
      `/api/admin/events?${qs.toString()}`,
      { method: "GET" },
      true
    );
  },

  get: (id: number) => request<UniversityEvent>(`/api/admin/events/${id}`, { method: "GET" }, true),

  create: (data: {
    title: string;
    description: string;
    category: string;
    date: string;
    time: string;
    location: string;
    organizer: string;
    capacity: number;
    imageUrl?: string;
    status?: string;
    published?: boolean;
  }) =>
    request<UniversityEvent>(
      "/api/admin/events",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true
    ),

  update: (
    id: number,
    data: {
      title: string;
      description: string;
      category: string;
      date: string;
      time: string;
      location: string;
      organizer: string;
      capacity: number;
      imageUrl?: string;
      status?: string;
      published?: boolean;
    }
  ) =>
    request<UniversityEvent>(
      `/api/admin/events/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      true
    ),

  uploadImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<UniversityEvent>(
      `/api/admin/events/${id}/image`,
      {
        method: "POST",
        body: formData,
      },
      true
    );
  },

  deleteImage: (id: number) =>
    request<UniversityEvent>(`/api/admin/events/${id}/image`, { method: "DELETE" }, true),

  publish: (id: number) =>
    request<UniversityEvent>(`/api/admin/events/${id}/publish`, { method: "PATCH" }, true),

  unpublish: (id: number) =>
    request<UniversityEvent>(`/api/admin/events/${id}/unpublish`, { method: "PATCH" }, true),

  cancel: (id: number) =>
    request<UniversityEvent>(`/api/admin/events/${id}/cancel`, { method: "PATCH" }, true),

  updateStatus: (id: number, status: string, published?: boolean) =>
    request<UniversityEvent>(
      `/api/admin/events/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status, published }),
      },
      true
    ),

  delete: (id: number) =>
    request<{ message: string }>(`/api/admin/events/${id}`, { method: "DELETE" }, true),

  getRegistrations: (id: number) =>
    request<EventRegistrant[]>(`/api/admin/events/${id}/registrations`, { method: "GET" }, true),
};

export const eventsApi = {
  list: () => request<UniversityEvent[]>("/api/events", { method: "GET" }),
  get: (id: string | number) => request<UniversityEvent>(`/api/events/${id}`, { method: "GET" }),
  myEvents: () => request<UniversityEvent[]>("/api/events/my", { method: "GET" }, true),
  create: (data: {
    title: string;
    description: string;
    category: string;
    date: string;
    time: string;
    location: string;
    organizer: string;
    capacity: number;
  }) =>
    request<UniversityEvent>(
      "/api/events",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true
    ),
  register: (id: string | number) =>
    request<UniversityEvent>(`/api/events/${id}/register`, { method: "POST" }, true),
  unregister: (id: string | number) =>
    request<UniversityEvent>(`/api/events/${id}/register`, { method: "DELETE" }, true),
};
