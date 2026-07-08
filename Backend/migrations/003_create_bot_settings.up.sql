CREATE TABLE IF NOT EXISTS bot_settings (
    id                       INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    bot_token                TEXT,
    bot_username             VARCHAR(100),
    is_active                BOOLEAN      NOT NULL DEFAULT false,
    start_message            TEXT         NOT NULL DEFAULT 'Assalomu alaykum! Botga xush kelibsiz.',
    start_button_enabled     BOOLEAN      NOT NULL DEFAULT false,
    start_button_text        VARCHAR(100) NOT NULL DEFAULT '',
    start_button_web_app_url TEXT,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO bot_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
