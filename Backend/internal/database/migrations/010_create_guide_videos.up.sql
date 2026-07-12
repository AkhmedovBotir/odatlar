CREATE TABLE IF NOT EXISTS guide_videos (
    id           BIGSERIAL    PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    description  TEXT         NOT NULL DEFAULT '',
    src          TEXT         NOT NULL,
    poster       TEXT         NOT NULL DEFAULT '',
    duration_min INT          NOT NULL DEFAULT 0,
    sort_order   INT          NOT NULL DEFAULT 0,
    is_published BOOLEAN      NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guide_video_likes (
    id          BIGSERIAL   PRIMARY KEY,
    video_id    BIGINT      NOT NULL REFERENCES guide_videos(id) ON DELETE CASCADE,
    bot_user_id BIGINT      NOT NULL REFERENCES bot_users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (video_id, bot_user_id)
);

CREATE TABLE IF NOT EXISTS guide_video_comments (
    id          BIGSERIAL   PRIMARY KEY,
    video_id    BIGINT      NOT NULL REFERENCES guide_videos(id) ON DELETE CASCADE,
    bot_user_id BIGINT      NOT NULL REFERENCES bot_users(id) ON DELETE CASCADE,
    text        TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guide_videos_published_sort ON guide_videos(is_published, sort_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guide_video_likes_video_id ON guide_video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_guide_video_comments_video_id ON guide_video_comments(video_id, created_at DESC);
