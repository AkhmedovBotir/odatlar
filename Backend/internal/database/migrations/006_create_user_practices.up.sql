CREATE TABLE IF NOT EXISTS user_practices (
    id           BIGSERIAL PRIMARY KEY,
    bot_user_id  BIGINT       NOT NULL REFERENCES bot_users(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    benefits     JSONB        NOT NULL DEFAULT '[]'::jsonb,
    streak       INT          NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS practice_completions (
    id           BIGSERIAL PRIMARY KEY,
    practice_id  BIGINT       NOT NULL REFERENCES user_practices(id) ON DELETE CASCADE,
    bot_user_id  BIGINT       NOT NULL REFERENCES bot_users(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    date         DATE         NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_practices_bot_user_id ON user_practices(bot_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_practice_completions_unique_day
    ON practice_completions(practice_id, date);
CREATE INDEX IF NOT EXISTS idx_practice_completions_bot_user_date
    ON practice_completions(bot_user_id, date DESC);
