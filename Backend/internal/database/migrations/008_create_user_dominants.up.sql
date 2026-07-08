CREATE TABLE IF NOT EXISTS user_dominants (
    id                 BIGSERIAL    PRIMARY KEY,
    bot_user_id        BIGINT       NOT NULL REFERENCES bot_users(id) ON DELETE CASCADE,
    title              VARCHAR(255) NOT NULL,
    type               VARCHAR(32)  NOT NULL DEFAULT 'fikrlash',
    cue                TEXT         NOT NULL DEFAULT '',
    reward             TEXT         NOT NULL DEFAULT '',
    pros               JSONB        NOT NULL DEFAULT '[]'::jsonb,
    cons               JSONB        NOT NULL DEFAULT '[]'::jsonb,
    notes              TEXT         NOT NULL DEFAULT '',
    sessions_completed INT          NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dominant_sessions (
    id           BIGSERIAL   PRIMARY KEY,
    dominant_id  BIGINT      NOT NULL REFERENCES user_dominants(id) ON DELETE CASCADE,
    bot_user_id  BIGINT      NOT NULL REFERENCES bot_users(id) ON DELETE CASCADE,
    type         VARCHAR(32) NOT NULL DEFAULT 'fikrlash',
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_dominants_bot_user_id ON user_dominants(bot_user_id);
CREATE INDEX IF NOT EXISTS idx_dominant_sessions_bot_user_date
    ON dominant_sessions(bot_user_id, completed_at DESC);
