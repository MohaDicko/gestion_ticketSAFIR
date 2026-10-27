export enum Role {
  HEAD = "HEAD",
  DEVELOPER = "DEVELOPER",
  CONSULTANT = "CONSULTANT",
  ADMIN = "ADMIN",
}

export enum RecordStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum TicketStatus {
  RECEIVED = "RECEIVED",
  TO_QUALIFY = "TO_QUALIFY",
  READY = "READY",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  BLOCKED = "BLOCKED",
  IN_REVIEW = "IN_REVIEW",
  IN_TESTING = "IN_TESTING",
  DELIVERED = "DELIVERED",
  CLOSED = "CLOSED",
  REJECTED = "REJECTED",
}

export enum TicketSource {
  EMAIL = "EMAIL",
  FORM = "FORM",
  MANUAL = "MANUAL",
}

export enum AssignmentStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  RELEASED = "RELEASED",
}

export enum AvailabilityType {
  LEAVE = "LEAVE",
  SICK_LEAVE = "SICK_LEAVE",
  TRAINING = "TRAINING",
  RESERVED_ACTIVITY = "RESERVED_ACTIVITY",
  OTHER = "OTHER",
}

export enum ApprovalStatus {
  REQUESTED = "REQUESTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum CommentVisibility {
  INTERNAL = "INTERNAL",
  CONSULTANT = "CONSULTANT",
}

export enum CommentSource {
  APP = "APP",
  EMAIL = "EMAIL",
}

export enum ScanStatus {
  PENDING = "PENDING",
  CLEAN = "CLEAN",
  INFECTED = "INFECTED",
  SKIPPED = "SKIPPED",
}

export enum OutboxJobStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  DEAD_LETTER = "DEAD_LETTER",
}
