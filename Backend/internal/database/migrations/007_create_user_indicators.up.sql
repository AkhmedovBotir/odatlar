CREATE TABLE IF NOT EXISTS user_indicators (
    id                    BIGSERIAL PRIMARY KEY,
    bot_user_id           BIGINT       NOT NULL REFERENCES bot_users(id) ON DELETE CASCADE,
    name                  VARCHAR(255) NOT NULL,
    benefits              JSONB        NOT NULL DEFAULT '[]'::jsonb,
    today_indicator_value TEXT,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS indicator_logs (
    id            BIGSERIAL PRIMARY KEY,
    indicator_id  BIGINT       NOT NULL REFERENCES user_indicators(id) ON DELETE CASCADE,
    bot_user_id   BIGINT       NOT NULL REFERENCES bot_users(id) ON DELETE CASCADE,
    completed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    date          DATE         NOT NULL,
    value_id      TEXT         NOT NULL DEFAULT '',
    value_label   TEXT         NOT NULL DEFAULT '',
    numeric_value NUMERIC,
    is_empty      BOOLEAN      NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_user_indicators_bot_user_id ON user_indicators(bot_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_indicator_logs_unique_day
    ON indicator_logs(indicator_id, date);
CREATE INDEX IF NOT EXISTS idx_indicator_logs_bot_user_date
    ON indicator_logs(bot_user_id, date DESC);
