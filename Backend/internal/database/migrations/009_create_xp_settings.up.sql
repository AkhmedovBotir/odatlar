CREATE TABLE IF NOT EXISTS xp_settings (
    id                   INTEGER     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    practice_complete_xp INT         NOT NULL DEFAULT 50,
    indicator_log_xp     INT         NOT NULL DEFAULT 30,
    dominant_create_xp   INT         NOT NULL DEFAULT 100,
    dominant_session_xp  INT         NOT NULL DEFAULT 100,
    level_up_xp          INT         NOT NULL DEFAULT 1000,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO xp_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE bot_users
    ADD COLUMN IF NOT EXISTS xp    INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS level INT NOT NULL DEFAULT 1;
