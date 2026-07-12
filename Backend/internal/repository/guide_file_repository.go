package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/odatlar-bot/backend/internal/domain"
)

var ErrGuideFileNotFound = errors.New("guide file not found")

type GuideFileRepository struct {
	pool *pgxpool.Pool
}

func NewGuideFileRepository(pool *pgxpool.Pool) *GuideFileRepository {
	return &GuideFileRepository{pool: pool}
}

func (r *GuideFileRepository) ListAll(ctx context.Context) ([]domain.GuideFile, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, title, description, url, ext, size_bytes, sort_order, is_published, created_at, updated_at
		FROM guide_files
		ORDER BY sort_order ASC, created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("list guide files: %w", err)
	}
	return scanGuideFiles(rows)
}

func (r *GuideFileRepository) ListPublished(ctx context.Context) ([]domain.GuideFile, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, title, description, url, ext, size_bytes, sort_order, is_published, created_at, updated_at
		FROM guide_files
		WHERE is_published = true
		ORDER BY sort_order ASC, created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("list published guide files: %w", err)
	}
	return scanGuideFiles(rows)
}

func (r *GuideFileRepository) GetByID(ctx context.Context, id int64) (*domain.GuideFile, error) {
	return r.getOne(ctx, `id = $1`, id, false)
}

func (r *GuideFileRepository) GetBySlug(ctx context.Context, slug string) (*domain.GuideFile, error) {
	return r.getOne(ctx, `slug = $1`, slug, false)
}

func (r *GuideFileRepository) GetPublishedByID(ctx context.Context, id int64) (*domain.GuideFile, error) {
	return r.getOne(ctx, `id = $1`, id, true)
}

func (r *GuideFileRepository) GetPublishedBySlug(ctx context.Context, slug string) (*domain.GuideFile, error) {
	return r.getOne(ctx, `slug = $1`, slug, true)
}

func (r *GuideFileRepository) getOne(ctx context.Context, where string, arg any, publishedOnly bool) (*domain.GuideFile, error) {
	query := `
		SELECT id, slug, title, description, url, ext, size_bytes, sort_order, is_published, created_at, updated_at
		FROM guide_files
		WHERE ` + where
	if publishedOnly {
		query += ` AND is_published = true`
	}

	row := r.pool.QueryRow(ctx, query, arg)
	f, err := scanGuideFile(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrGuideFileNotFound
		}
		return nil, err
	}
	return f, nil
}

func (r *GuideFileRepository) Create(ctx context.Context, f *domain.GuideFile) (*domain.GuideFile, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO guide_files (slug, title, description, url, ext, size_bytes, sort_order, is_published)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, slug, title, description, url, ext, size_bytes, sort_order, is_published, created_at, updated_at`,
		f.Slug, f.Title, f.Description, f.URL, f.Ext, f.SizeBytes, f.SortOrder, f.IsPublished,
	)
	return scanGuideFile(row)
}

func (r *GuideFileRepository) Update(ctx context.Context, f *domain.GuideFile) (*domain.GuideFile, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE guide_files
		SET slug = $1, title = $2, description = $3, url = $4, ext = $5, size_bytes = $6,
			sort_order = $7, is_published = $8, updated_at = NOW()
		WHERE id = $9
		RETURNING id, slug, title, description, url, ext, size_bytes, sort_order, is_published, created_at, updated_at`,
		f.Slug, f.Title, f.Description, f.URL, f.Ext, f.SizeBytes, f.SortOrder, f.IsPublished, f.ID,
	)
	item, err := scanGuideFile(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrGuideFileNotFound
		}
		return nil, err
	}
	return item, nil
}

func (r *GuideFileRepository) Delete(ctx context.Context, id int64) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM guide_files WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete guide file: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrGuideFileNotFound
	}
	return nil
}

func (r *GuideFileRepository) SlugExists(ctx context.Context, slug string, excludeID int64) (bool, error) {
	var id int64
	err := r.pool.QueryRow(ctx, `
		SELECT id FROM guide_files WHERE slug = $1 AND ($2 = 0 OR id <> $2) LIMIT 1`,
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

func scanGuideFiles(rows pgx.Rows) ([]domain.GuideFile, error) {
	defer rows.Close()
	items := make([]domain.GuideFile, 0)
	for rows.Next() {
		var f domain.GuideFile
		if err := rows.Scan(
			&f.ID, &f.Slug, &f.Title, &f.Description, &f.URL, &f.Ext, &f.SizeBytes,
			&f.SortOrder, &f.IsPublished, &f.CreatedAt, &f.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, f)
	}
	return items, rows.Err()
}

func scanGuideFile(row pgx.Row) (*domain.GuideFile, error) {
	var f domain.GuideFile
	if err := row.Scan(
		&f.ID, &f.Slug, &f.Title, &f.Description, &f.URL, &f.Ext, &f.SizeBytes,
		&f.SortOrder, &f.IsPublished, &f.CreatedAt, &f.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return &f, nil
}
