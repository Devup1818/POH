-- Add username column to users table for username/email login
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE;

-- Set username from email prefix for existing users
UPDATE users SET username = SPLIT_PART(email, '@', 1) WHERE username IS NULL;

-- Make username NOT NULL after backfill
ALTER TABLE users ALTER COLUMN username SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
