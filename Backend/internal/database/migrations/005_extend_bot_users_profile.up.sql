ALTER TABLE bot_users
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_bot_users_is_premium ON bot_users(is_premium);
