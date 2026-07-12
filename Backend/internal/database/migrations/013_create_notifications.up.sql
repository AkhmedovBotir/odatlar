CREATE TABLE IF NOT EXISTS notifications (
    id           BIGSERIAL    PRIMARY KEY,
    type         VARCHAR(32)  NOT NULL,
    title        VARCHAR(255) NOT NULL,
    preview      TEXT         NOT NULL DEFAULT '',
    payload      JSONB        NOT NULL DEFAULT '{}'::jsonb,
    target       VARCHAR(16)  NOT NULL DEFAULT 'all',
    target_ids   BIGINT[]     NOT NULL DEFAULT '{}',
    status       VARCHAR(16)  NOT NULL DEFAULT 'draft',
    sent_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
    id              BIGSERIAL   PRIMARY KEY,
    notification_id BIGINT      NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    bot_user_id     BIGINT      NOT NULL REFERENCES bot_users(id) ON DELETE CASCADE,
    is_read         BOOLEAN     NOT NULL DEFAULT false,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (notification_id, bot_user_id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user ON notification_deliveries(bot_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification ON notification_deliveries(notification_id);
