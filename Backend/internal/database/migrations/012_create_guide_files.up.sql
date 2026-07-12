CREATE TABLE IF NOT EXISTS guide_files (
    id           BIGSERIAL    PRIMARY KEY,
    slug         VARCHAR(100) NOT NULL UNIQUE,
    title        VARCHAR(255) NOT NULL,
    description  TEXT         NOT NULL DEFAULT '',
    url          TEXT         NOT NULL,
    ext          VARCHAR(20)  NOT NULL DEFAULT '',
    size_bytes   BIGINT       NOT NULL DEFAULT 0,
    sort_order   INT          NOT NULL DEFAULT 0,
    is_published BOOLEAN      NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guide_files_published_sort ON guide_files(is_published, sort_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guide_files_slug ON guide_files(slug);
