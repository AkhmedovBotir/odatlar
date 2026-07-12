package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/odatlar-bot/backend/internal/domain"
)

var ErrGuideCourseNotFound = errors.New("guide course not found")

type GuideCourseRepository struct {
	pool *pgxpool.Pool
}

func NewGuideCourseRepository(pool *pgxpool.Pool) *GuideCourseRepository {
	return &GuideCourseRepository{pool: pool}
}

func (r *GuideCourseRepository) ListAll(ctx context.Context) ([]domain.GuideCourse, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, title, description, content, sort_order, is_published, created_at, updated_at
		FROM guide_courses
		ORDER BY sort_order ASC, created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("list guide courses: %w", err)
	}
	return scanGuideCourses(rows)
}

func (r *GuideCourseRepository) ListPublished(ctx context.Context) ([]domain.GuideCourse, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, title, description, content, sort_order, is_published, created_at, updated_at
		FROM guide_courses
		WHERE is_published = true
		ORDER BY sort_order ASC, created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("list published guide courses: %w", err)
	}
	return scanGuideCourses(rows)
}

func (r *GuideCourseRepository) GetByID(ctx context.Context, id int64) (*domain.GuideCourse, error) {
	return r.getOne(ctx, `id = $1`, id, false)
}

func (r *GuideCourseRepository) GetBySlug(ctx context.Context, slug string) (*domain.GuideCourse, error) {
	return r.getOne(ctx, `slug = $1`, slug, false)
}

func (r *GuideCourseRepository) GetPublishedByID(ctx context.Context, id int64) (*domain.GuideCourse, error) {
	return r.getOne(ctx, `id = $1`, id, true)
}

func (r *GuideCourseRepository) GetPublishedBySlug(ctx context.Context, slug string) (*domain.GuideCourse, error) {
	return r.getOne(ctx, `slug = $1`, slug, true)
}

func (r *GuideCourseRepository) getOne(ctx context.Context, where string, arg any, publishedOnly bool) (*domain.GuideCourse, error) {
	query := `
		SELECT id, slug, title, description, content, sort_order, is_published, created_at, updated_at
		FROM guide_courses
		WHERE ` + where
	if publishedOnly {
		query += ` AND is_published = true`
	}

	row := r.pool.QueryRow(ctx, query, arg)
	c, err := scanGuideCourse(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrGuideCourseNotFound
		}
		return nil, err
	}
	return c, nil
}

func (r *GuideCourseRepository) Create(ctx context.Context, c *domain.GuideCourse) (*domain.GuideCourse, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO guide_courses (slug, title, description, content, sort_order, is_published)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, slug, title, description, content, sort_order, is_published, created_at, updated_at`,
		c.Slug, c.Title, c.Description, c.Content, c.SortOrder, c.IsPublished,
	)
	return scanGuideCourse(row)
}

func (r *GuideCourseRepository) Update(ctx context.Context, c *domain.GuideCourse) (*domain.GuideCourse, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE guide_courses
		SET slug = $1, title = $2, description = $3, content = $4,
			sort_order = $5, is_published = $6, updated_at = NOW()
		WHERE id = $7
		RETURNING id, slug, title, description, content, sort_order, is_published, created_at, updated_at`,
		c.Slug, c.Title, c.Description, c.Content, c.SortOrder, c.IsPublished, c.ID,
	)
	item, err := scanGuideCourse(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrGuideCourseNotFound
		}
		return nil, err
	}
	return item, nil
}

func (r *GuideCourseRepository) Delete(ctx context.Context, id int64) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM guide_courses WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete guide course: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrGuideCourseNotFound
	}
	return nil
}

func (r *GuideCourseRepository) SlugExists(ctx context.Context, slug string, excludeID int64) (bool, error) {
	var id int64
	err := r.pool.QueryRow(ctx, `
		SELECT id FROM guide_courses WHERE slug = $1 AND ($2 = 0 OR id <> $2) LIMIT 1`,
		slug, excludeID,
	).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func scanGuideCourses(rows pgx.Rows) ([]domain.GuideCourse, error) {
	defer rows.Close()
	items := make([]domain.GuideCourse, 0)
	for rows.Next() {
		var c domain.GuideCourse
		if err := rows.Scan(
			&c.ID, &c.Slug, &c.Title, &c.Description, &c.Content,
			&c.SortOrder, &c.IsPublished, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, c)
	}
	return items, rows.Err()
}

func scanGuideCourse(row pgx.Row) (*domain.GuideCourse, error) {
	var c domain.GuideCourse
	if err := row.Scan(
		&c.ID, &c.Slug, &c.Title, &c.Description, &c.Content,
		&c.SortOrder, &c.IsPublished, &c.CreatedAt, &c.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return &c, nil
}
