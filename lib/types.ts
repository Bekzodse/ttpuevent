export type Role = "USER" | "ADMIN";

export type Locale = "en" | "uz" | "ru";
export type ThemeMode = "light" | "dark";

export type BookingStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PAYMENT_PENDING"
  | "PAYMENT_UNDER_REVIEW"
  | "PAYMENT_APPROVED"
  | "PAYMENT_REJECTED"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED";

export type EquipmentRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "RELEASED";
export type CancellationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type RefundStatus =
  | "NOT_APPLICABLE"
  | "PENDING_VERIFICATION"
  | "APPROVED"
  | "COMPLETED"
  | "REJECTED";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  username: string;
  email?: string | null;
  role: Role;
  profilePictureUrl: string | null;
  department: string | null;
  bio: string | null;
  active: boolean;
  currentlyOnline: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface AdminStats {
  totalUsers: number;
  activeAccounts: number;
  inactiveAccounts: number;
  currentlyActiveUsers: number;
  usersWhoLoggedIn: number;
  totalAdmins: number;
  totalRegularUsers: number;
  totalEvents: number;
  upcomingEvents?: number;
  completedEvents?: number;
  totalEventRegistrations: number;
  totalApplications?: number;
  pendingApplications?: number;
  approvedApplications?: number;
  rejectedApplications?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface LoginActivity {
  id: number;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profilePictureUrl: string | null;
  role: Role;
  loginTime: string;
  ipAddress: string | null;
  userAgent: string | null;
  successful: boolean;
}

export interface UniversityEvent {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  capacity: number;
  registered: number;
  gradient: string;
  status: string;
  imageUrl?: string | null;
  published?: boolean;
  createdAt?: string;
  userRegistered: boolean;
}

export interface EventHall {
  id: number;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  hourlyRate: number;
  amenities: string | null;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
}

export interface Equipment {
  id: number;
  name: string;
  category: string;
  description: string | null;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  unitFee: number;
  active: boolean;
  createdAt: string;
}

export interface EquipmentReservation {
  id: number;
  equipmentId: number;
  equipmentName: string;
  category: string;
  quantityRequested: number;
  unitFee: number;
  status: EquipmentRequestStatus;
  adminComment: string | null;
}

export interface EquipmentHistoryItem {
  id: number;
  applicationId: number;
  applicationCode: string;
  eventName: string;
  hallName: string;
  applicantName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  quantityRequested: number;
  status: EquipmentRequestStatus;
  bookingStatus: BookingStatus;
  createdAt: string;
}

export interface CancellationPolicy {
  id: number;
  name: string;
  fullRefundHoursBefore: number;
  partialRefundHoursBefore: number;
  partialRefundPercent: number;
  releaseHallOnApproval: boolean;
  description: string | null;
  updatedAt: string;
}

export interface CancellationRequest {
  id: number;
  applicationId: number;
  applicationCode: string;
  eventName: string;
  hallName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  bookingStatus: BookingStatus;
  requestedById: number;
  requestedByUsername: string;
  requestedByFullName: string;
  requestedByPhone: string;
  reason: string;
  status: CancellationStatus;
  refundStatus: RefundStatus;
  paidAmount: number;
  eligibleRefundPercent: number;
  eligibleRefundAmount: number;
  approvedRefundAmount: number | null;
  refundTransactionRef: string | null;
  adminComment: string | null;
  processedBy: string | null;
  requestedAt: string;
  processedAt: string | null;
  refundCompletedAt: string | null;
}

export interface FinancialAuditLog {
  id: number;
  applicationId: number | null;
  applicationCode: string | null;
  cancellationRequestId: number | null;
  actorUsername: string;
  actorRole: string;
  actionType: string;
  amount: number | null;
  transactionReference: string | null;
  details: string | null;
  createdAt: string;
}

export interface ApplicationHistoryItem {
  id: number;
  actorUsername: string;
  actorFullName: string;
  actorRole: string;
  action: string;
  previousStatus: BookingStatus | null;
  newStatus: BookingStatus;
  comment: string | null;
  createdAt: string;
}

export interface HallApplication {
  id: number;
  applicationCode: string;
  applicantId: number;
  applicantUsername: string;
  applicantFirstName: string;
  applicantLastName: string;
  applicantPhoneNumber: string;
  applicantEmail?: string | null;
  hall: EventHall;
  eventName: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  expectedParticipants: number;
  description: string | null;
  status: BookingStatus;
  paymentStatus: BookingStatus | null;
  adminComment: string | null;
  userReply: string | null;
  requiredAmount: number | null;
  bankCardNumber: string | null;
  bankCardHolder: string | null;
  bankName: string | null;
  receiptUrl: string | null;
  receiptFilename: string | null;
  receiptUploadedAt: string | null;
  approvedAt: string | null;
  paymentDeadline: string | null;
  paymentVerifiedAt: string | null;
  verifiedByAdmin: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  history: ApplicationHistoryItem[];
  equipmentReservations: EquipmentReservation[];
  cancellationRequest: CancellationRequest | null;
}

export interface CalendarEvent {
  id: number;
  itemType: "BOOKING" | "SCHEDULE_BLOCK";
  applicationCode: string | null;
  hallId: number;
  hallName: string;
  eventName: string;
  eventType: string;
  date: string;
  startTime: string;
  endTime: string;
  bookingStatus: BookingStatus | null;
  slotState: "AVAILABLE" | "RESERVED" | "CONFIRMED" | "PENDING" | "BLOCKED";
  reason: string | null;
}

export interface HallScheduleBlock {
  id: number;
  hallId: number;
  hallName: string;
  blockDate: string;
  startTime: string;
  endTime: string;
  blockType: string;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface CalendarResponse {
  halls: EventHall[];
  events: CalendarEvent[];
  blocks: HallScheduleBlock[];
}

export interface TimeSlotAvailability {
  startTime: string;
  endTime: string;
  slotState: "AVAILABLE" | "RESERVED" | "CONFIRMED" | "PENDING" | "BLOCKED";
  eventName: string | null;
  bookingCode: string | null;
}

export interface UniversityBranding {
  id: number;
  universityName: string;
  universitySubtitle: string;
  loginHeadline: string;
  loginDescription: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  websiteUrl: string | null;
  updatedAt: string;
}

export interface ApplicationStats {
  totalApplications: number;
  pendingCount: number;
  underReviewCount: number;
  paymentPendingCount: number;
  paymentUnderReviewCount: number;
  confirmedCount: number;
  rejectedCount: number;
  expiredCount: number;
  cancelledCount: number;
}

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  applicationId: number | null;
  applicationCode: string | null;
  bookingStatus: BookingStatus | null;
  read: boolean;
  createdAt: string;
}

export interface ApiErrorPayload {
  status: number;
  error: string;
  message: string;
  path?: string;
  fieldErrors?: Record<string, string>;
}

export interface AdminActivityLog {
  id: number;
  actorId: number | null;
  actorUsername: string;
  actorFullName: string;
  actionType: string;
  targetType: string;
  targetId: number | null;
  targetLabel: string | null;
  details: string | null;
  createdAt: string;
}

export interface EventRegistrant {
  registrationId: number;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string;
  department: string | null;
  registeredAt: string;
}

export interface UserApplicationHistory {
  user: User;
  hallApplications: HallApplication[];
  eventRegistrations: {
    registrationId: number;
    event: UniversityEvent;
    registeredAt: string;
  }[];
}

export interface AdminAnalytics {
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  draftEvents: number;
  publishedEvents: number;

  totalUsers: number;
  activeAccounts: number;
  inactiveAccounts: number;
  currentlyActiveUsers: number;
  usersWhoLoggedIn: number;
  totalAdmins: number;
  totalRegularUsers: number;

  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  cancelledApplications: number;
  expiredApplications: number;
  confirmedApplications: number;

  totalEventRegistrations: number;
  totalEventCapacity: number;
  eventFillRatePercent: number;

  approvalRatePercent: number;
  rejectionRatePercent: number;
  cancellationRatePercent: number;
  totalConfirmedRevenue: number;

  applicationStatusBreakdown: {
    status: string;
    label: string;
    count: number;
  }[];

  monthlyApplicationTrends: {
    month: string;
    label: string;
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    cancelled: number;
  }[];

  eventParticipationByCategory: {
    category: string;
    eventCount: number;
    totalCapacity: number;
    totalRegistered: number;
    fillRatePercent: number;
  }[];

  popularEvents: {
    id: number;
    title: string;
    category: string;
    date: string;
    location: string;
    capacity: number;
    registered: number;
    fillRatePercent: number;
    status: string;
    published: boolean;
  }[];

  hallUtilization: {
    hallId: number;
    hallName: string;
    totalApplications: number;
    confirmedCount: number;
    confirmedRevenue: number;
  }[];
}
