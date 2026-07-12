CREATE TABLE IF NOT EXISTS guide_courses (
    id           BIGSERIAL    PRIMARY KEY,
    slug         VARCHAR(100) NOT NULL UNIQUE,
    title        VARCHAR(255) NOT NULL,
    description  TEXT         NOT NULL DEFAULT '',
    content      JSONB        NOT NULL DEFAULT '[]'::jsonb,
    sort_order   INT          NOT NULL DEFAULT 0,
    is_published BOOLEAN      NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guide_courses_published_sort ON guide_courses(is_published, sort_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guide_courses_slug ON guide_courses(slug);
