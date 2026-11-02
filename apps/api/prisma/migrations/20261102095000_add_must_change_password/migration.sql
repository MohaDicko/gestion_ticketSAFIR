ALTER TABLE "User"
ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "mustChangePassword" = true
WHERE "lastLoginAt" IS NULL
  AND 'DEVELOPER' = ANY("roles");
