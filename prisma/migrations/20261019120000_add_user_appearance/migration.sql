-- Per-account appearance preferences.
--
-- Nullable on purpose: NULL means "never customised", which lets the first
-- sign-in adopt whatever the browser already had in localStorage instead of
-- overwriting it with defaults.
ALTER TABLE "User" ADD COLUMN "appearance" JSONB;