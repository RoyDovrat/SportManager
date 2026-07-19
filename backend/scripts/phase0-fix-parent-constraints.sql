-- Phase 0: fix Parent uniqueness (run once against local Postgres if needed).
-- Hibernate ddl-auto=update often ADDS new unique constraints but does not DROP old ones.

-- 1) Inspect existing constraints on parents (optional):
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'parents'::regclass;

-- 2) Drop the incorrect unique constraint on is_kibbutz_member
--    (name may vary; common Hibernate names shown — keep the one that matches your DB):
ALTER TABLE parents DROP CONSTRAINT IF EXISTS parents_is_kibbutz_member_key;
ALTER TABLE parents DROP CONSTRAINT IF EXISTS uk_parents_is_kibbutz_member;

-- 3) Ensure phone_number is unique:
ALTER TABLE parents DROP CONSTRAINT IF EXISTS uk_parents_phone_number;
ALTER TABLE parents ADD CONSTRAINT uk_parents_phone_number UNIQUE (phone_number);
