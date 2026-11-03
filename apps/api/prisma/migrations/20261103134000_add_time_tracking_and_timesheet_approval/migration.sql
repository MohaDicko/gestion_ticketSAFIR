CREATE TYPE "WorkSessionStatus" AS ENUM ('RUNNING', 'PAUSED');

CREATE TYPE "TimesheetStatus" AS ENUM ('SUBMITTED', 'APPROVED');

ALTER TABLE "TimeEntry"
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "endedAt" TIMESTAMP(3),
ADD COLUMN "durationSeconds" INTEGER NOT NULL DEFAULT 0;

UPDATE "TimeEntry"
SET "startedAt" = "createdAt"
WHERE "startedAt" IS NULL;

ALTER TABLE "TimeEntry"
ALTER COLUMN "startedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "startedAt" SET NOT NULL;

CREATE TABLE "WorkSession" (
    "id" UUID NOT NULL,
    "assignmentId" UUID NOT NULL,
    "developerId" UUID NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" TIMESTAMP(3),
    "pausedDurationSeconds" INTEGER NOT NULL DEFAULT 0,
    "status" "WorkSessionStatus" NOT NULL DEFAULT 'RUNNING',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkSession_developerId_status_idx"
ON "WorkSession"("developerId", "status");

CREATE INDEX "WorkSession_assignmentId_idx"
ON "WorkSession"("assignmentId");

CREATE UNIQUE INDEX "WorkSession_one_active_per_developer"
ON "WorkSession"("developerId");

ALTER TABLE "WorkSession"
ADD CONSTRAINT "WorkSession_assignmentId_fkey"
FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkSession"
ADD CONSTRAINT "WorkSession_developerId_fkey"
FOREIGN KEY ("developerId") REFERENCES "DeveloperProfile"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Timesheet" (
    "id" UUID NOT NULL,
    "developerId" UUID NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "status" "TimesheetStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Timesheet_developerId_periodStart_periodEnd_key"
ON "Timesheet"("developerId", "periodStart", "periodEnd");

CREATE INDEX "Timesheet_developerId_status_idx"
ON "Timesheet"("developerId", "status");

ALTER TABLE "Timesheet"
ADD CONSTRAINT "Timesheet_developerId_fkey"
FOREIGN KEY ("developerId") REFERENCES "DeveloperProfile"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Timesheet"
ADD CONSTRAINT "Timesheet_approvedById_fkey"
FOREIGN KEY ("approvedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
