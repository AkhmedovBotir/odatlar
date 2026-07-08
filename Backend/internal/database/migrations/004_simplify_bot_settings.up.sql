-- Soddalashtirilgan bot sozlamalari
ALTER TABLE bot_settings ADD COLUMN IF NOT EXISTS start_button_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE bot_settings ADD COLUMN IF NOT EXISTS start_button_text VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE bot_settings ADD COLUMN IF NOT EXISTS start_button_web_app_url TEXT;

ALTER TABLE bot_settings DROP COLUMN IF EXISTS start_enabled;
ALTER TABLE bot_settings DROP COLUMN IF EXISTS start_parse_mode;
ALTER TABLE bot_settings DROP COLUMN IF EXISTS start_photo_url;
ALTER TABLE bot_settings DROP COLUMN IF EXISTS start_video_url;
ALTER TABLE bot_settings DROP COLUMN IF EXISTS start_disable_notification;
ALTER TABLE bot_settings DROP COLUMN IF EXISTS mini_app_enabled;
ALTER TABLE bot_settings DROP COLUMN IF EXISTS mini_app_url;
ALTER TABLE bot_settings DROP COLUMN IF EXISTS mini_app_button_text;
ALTER TABLE bot_settings DROP COLUMN IF EXISTS mini_app_short_name;
ALTER TABLE bot_settings DROP COLUMN IF EXISTS menu_button_type;
ALTER TABLE bot_settings DROP COLUMN IF EXISTS menu_button_text;
ALTER TABLE bot_settings DROP COLUMN IF EXISTS menu_button_url;
ALTER TABLE bot_settings DROP COLUMN IF EXISTS inline_buttons;
ALTER TABLE bot_settings DROP COLUMN IF EXISTS reply_keyboard_enabled;
ALTER TABLE bot_settings DROP COLUMN IF EXISTS reply_keyboard;
ALTER TABLE bot_settings DROP COLUMN IF EXISTS resize_keyboard;
ALTER TABLE bot_settings DROP COLUMN IF EXISTS one_time_keyboard;

CREATE TABLE IF NOT EXISTS bot_users (
    id             BIGSERIAL PRIMARY KEY,
    telegram_id    BIGINT       NOT NULL UNIQUE,
    first_name     VARCHAR(100) NOT NULL DEFAULT '',
    last_name      VARCHAR(100) NOT NULL DEFAULT '',
    username       VARCHAR(100),
    phone          VARCHAR(20),
    language_code  VARCHAR(10),
    started_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_start_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_users_started_at ON bot_users(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_users_last_start_at ON bot_users(last_start_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_users_username ON bot_users(username);
