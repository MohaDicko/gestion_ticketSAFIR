DO $$
DECLARE
  melissa_user_id uuid;
BEGIN
  INSERT INTO "User" (
    "id",
    "email",
    "firstName",
    "lastName",
    "roles",
    "isActive",
    "mustChangePassword",
    "passwordHash",
    "timezone",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    gen_random_uuid(),
    'melissa.diakite@safirconsulting.net',
    'Mélissa',
    'Diakité',
    ARRAY['CONSULTANT']::"Role"[],
    true,
    true,
    '$argon2id$v=19$m=65536,t=3,p=4$Hsujg2n0RKQ+e0L3KcNxhw$nUmhzzG15fFC5/Oa6SqfHCFylxKAWc2/NNjJpPl9I7Y',
    'Europe/Paris',
    NOW(),
    NOW()
  )
  ON CONFLICT ("email") DO UPDATE SET
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    "roles" = EXCLUDED."roles",
    "isActive" = true,
    "mustChangePassword" = true,
    "passwordHash" = EXCLUDED."passwordHash",
    "timezone" = EXCLUDED."timezone",
    "updatedAt" = NOW()
  RETURNING "id" INTO melissa_user_id;

  IF melissa_user_id IS NULL THEN
    SELECT "id" INTO melissa_user_id
    FROM "User"
    WHERE "email" = 'melissa.diakite@safirconsulting.net';
  END IF;

  INSERT INTO "Consultant" (
    "id",
    "userId",
    "email",
    "name",
    "organization",
    "isInternal",
    "status",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    gen_random_uuid(),
    melissa_user_id,
    'melissa.diakite@safirconsulting.net',
    'Mélissa Diakité',
    'Safir Consulting',
    true,
    'ACTIVE'::"RecordStatus",
    NOW(),
    NOW()
  )
  ON CONFLICT ("email") DO UPDATE SET
    "userId" = EXCLUDED."userId",
    "name" = EXCLUDED."name",
    "organization" = EXCLUDED."organization",
    "isInternal" = true,
    "status" = 'ACTIVE'::"RecordStatus",
    "updatedAt" = NOW();
END $$;
