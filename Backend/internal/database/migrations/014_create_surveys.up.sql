CREATE TABLE IF NOT EXISTS surveys (
    id          BIGSERIAL    PRIMARY KEY,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    title       VARCHAR(255) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    settings    JSONB        NOT NULL DEFAULT '{}'::jsonb,
    questions   JSONB        NOT NULL DEFAULT '[]'::jsonb,
    status      VARCHAR(20)  NOT NULL DEFAULT 'draft',
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    closed_at   TIMESTAMPTZ,
    CONSTRAINT surveys_status_check CHECK (status IN ('draft', 'published', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_surveys_status_sort ON surveys(status, sort_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_surveys_slug ON surveys(slug);
