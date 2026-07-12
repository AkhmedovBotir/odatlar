package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/odatlar-bot/backend/internal/domain"
)

var ErrGuideVideoNotFound = errors.New("guide video not found")

type GuideVideoRepository struct {
	pool *pgxpool.Pool
}

func NewGuideVideoRepository(pool *pgxpool.Pool) *GuideVideoRepository {
	return &GuideVideoRepository{pool: pool}
}

func (r *GuideVideoRepository) ListAll(ctx context.Context) ([]domain.GuideVideo, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, title, description, src, poster, duration_min, sort_order, is_published, created_at, updated_at
		FROM guide_videos
		ORDER BY sort_order ASC, created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("list guide videos: %w", err)
	}
	defer rows.Close()
	return scanGuideVideos(rows)
}

func (r *GuideVideoRepository) ListPublished(ctx context.Context) ([]domain.GuideVideo, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, title, description, src, poster, duration_min, sort_order, is_published, created_at, updated_at
		FROM guide_videos
		WHERE is_published = true
		ORDER BY sort_order ASC, created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("list published guide videos: %w", err)
	}
	defer rows.Close()
	return scanGuideVideos(rows)
}

func (r *GuideVideoRepository) GetByID(ctx context.Context, id int64) (*domain.GuideVideo, error) {
	return r.getByID(ctx, id, false)
}

func (r *GuideVideoRepository) GetPublishedByID(ctx context.Context, id int64) (*domain.GuideVideo, error) {
	return r.getByID(ctx, id, true)
}

func (r *GuideVideoRepository) getByID(ctx context.Context, id int64, publishedOnly bool) (*domain.GuideVideo, error) {
	query := `
		SELECT id, title, description, src, poster, duration_min, sort_order, is_published, created_at, updated_at
		FROM guide_videos
		WHERE id = $1`
	if publishedOnly {
		query += ` AND is_published = true`
	}

	row := r.pool.QueryRow(ctx, query, id)
	v, err := scanGuideVideo(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrGuideVideoNotFound
		}
		return nil, err
	}
	return v, nil
}

func (r *GuideVideoRepository) Create(ctx context.Context, v *domain.GuideVideo) (*domain.GuideVideo, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO guide_videos (title, description, src, poster, duration_min, sort_order, is_published)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, title, description, src, poster, duration_min, sort_order, is_published, created_at, updated_at`,
		v.Title, v.Description, v.Src, v.Poster, v.DurationMin, v.SortOrder, v.IsPublished,
	)
	return scanGuideVideo(row)
}

func (r *GuideVideoRepository) Update(ctx context.Context, v *domain.GuideVideo) (*domain.GuideVideo, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE guide_videos
		SET title = $1, description = $2, src = $3, poster = $4, duration_min = $5,
			sort_order = $6, is_published = $7, updated_at = NOW()
		WHERE id = $8
		RETURNING id, title, description, src, poster, duration_min, sort_order, is_published, created_at, updated_at`,
		v.Title, v.Description, v.Src, v.Poster, v.DurationMin, v.SortOrder, v.IsPublished, v.ID,
	)
	item, err := scanGuideVideo(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrGuideVideoNotFound
		}
		return nil, err
	}
	return item, nil
}

func (r *GuideVideoRepository) Delete(ctx context.Context, id int64) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM guide_videos WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete guide video: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrGuideVideoNotFound
	}
	return nil
}

func (r *GuideVideoRepository) CountLikes(ctx context.Context, videoID int64) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM guide_video_likes WHERE video_id = $1`, videoID).Scan(&count)
	return count, err
}

func (r *GuideVideoRepository) CountComments(ctx context.Context, videoID int64) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM guide_video_comments WHERE video_id = $1`, videoID).Scan(&count)
	return count, err
}

func (r *GuideVideoRepository) IsLikedByUser(ctx context.Context, videoID, botUserID int64) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM guide_video_likes WHERE video_id = $1 AND bot_user_id = $2)`,
		videoID, botUserID,
	).Scan(&exists)
	return exists, err
}

func (r *GuideVideoRepository) ToggleLike(ctx context.Context, videoID, botUserID int64) (bool, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var exists bool
	if err := tx.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM guide_video_likes WHERE video_id = $1 AND bot_user_id = $2)`,
		videoID, botUserID,
	).Scan(&exists); err != nil {
		return false, err
	}

	liked := !exists
	if exists {
		if _, err := tx.Exec(ctx, `DELETE FROM guide_video_likes WHERE video_id = $1 AND bot_user_id = $2`, videoID, botUserID); err != nil {
			return false, err
		}
	} else {
		if _, err := tx.Exec(ctx, `
			INSERT INTO guide_video_likes (video_id, bot_user_id) VALUES ($1, $2)`,
			videoID, botUserID,
		); err != nil {
			return false, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return false, err
	}
	return liked, nil
}

func (r *GuideVideoRepository) ListComments(ctx context.Context, videoID int64) ([]domain.GuideVideoComment, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT c.id, c.video_id, c.bot_user_id, c.text, c.created_at,
			u.first_name, u.last_name, u.username, COALESCE(u.avatar_url, '')
		FROM guide_video_comments c
		JOIN bot_users u ON u.id = c.bot_user_id
		WHERE c.video_id = $1
		ORDER BY c.created_at DESC`, videoID)
	if err != nil {
		return nil, fmt.Errorf("list guide video comments: %w", err)
	}
	defer rows.Close()

	items := make([]domain.GuideVideoComment, 0)
	for rows.Next() {
		var c domain.GuideVideoComment
		if err := rows.Scan(
			&c.ID, &c.VideoID, &c.BotUserID, &c.Text, &c.CreatedAt,
			&c.FirstName, &c.LastName, &c.Username, &c.AvatarURL,
		); err != nil {
			return nil, fmt.Errorf("scan guide video comment: %w", err)
		}
		items = append(items, c)
	}
	return items, nil
}

func (r *GuideVideoRepository) AddComment(ctx context.Context, videoID, botUserID int64, text string) (*domain.GuideVideoComment, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO guide_video_comments (video_id, bot_user_id, text)
		VALUES ($1, $2, $3)
		RETURNING id, video_id, bot_user_id, text, created_at`,
		videoID, botUserID, text,
	)

	var c domain.GuideVideoComment
	if err := row.Scan(&c.ID, &c.VideoID, &c.BotUserID, &c.Text, &c.CreatedAt); err != nil {
		return nil, fmt.Errorf("add guide video comment: %w", err)
	}

	err := r.pool.QueryRow(ctx, `
		SELECT first_name, last_name, username, COALESCE(avatar_url, '')
		FROM bot_users WHERE id = $1`, botUserID,
	).Scan(&c.FirstName, &c.LastName, &c.Username, &c.AvatarURL)
	if err != nil {
		return nil, fmt.Errorf("load comment author: %w", err)
	}
	return &c, nil
}

func scanGuideVideos(rows interface {
	Next() bool
	Scan(dest ...any) error
}) ([]domain.GuideVideo, error) {
	items := make([]domain.GuideVideo, 0)
	for rows.Next() {
		var v domain.GuideVideo
		if err := rows.Scan(
			&v.ID, &v.Title, &v.Description, &v.Src, &v.Poster, &v.DurationMin,
			&v.SortOrder, &v.IsPublished, &v.CreatedAt, &v.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan guide video: %w", err)
		}
		items = append(items, v)
	}
	return items, nil
}

func scanGuideVideo(row pgx.Row) (*domain.GuideVideo, error) {
	var v domain.GuideVideo
	if err := row.Scan(
		&v.ID, &v.Title, &v.Description, &v.Src, &v.Poster, &v.DurationMin,
		&v.SortOrder, &v.IsPublished, &v.CreatedAt, &v.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return &v, nil
}
