package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/odatlar-bot/backend/internal/domain"
)

var ErrSurveyNotFound = errors.New("survey not found")
var ErrSurveyResponseNotFound = errors.New("survey response not found")

type SurveyResponseListRow struct {
	ID          int64
	SurveyID    int64
	SurveySlug  string
	SurveyTitle string
	Answers     json.RawMessage
	CreatedAt   time.Time
}

type SurveyResponseListFilter struct {
	SurveyID   int64
	From       *time.Time
	To         *time.Time
	Search     string
	QuestionID string
	Page       int
	Limit      int
	SortDesc   bool
}

type SurveyRepository struct {
	pool *pgxpool.Pool
}

func NewSurveyRepository(pool *pgxpool.Pool) *SurveyRepository {
	return &SurveyRepository{pool: pool}
}

func (r *SurveyRepository) ListAll(ctx context.Context) ([]domain.Survey, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, title, description, settings, questions, status, sort_order,
			created_at, updated_at, published_at, closed_at
		FROM surveys
		ORDER BY sort_order ASC, created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("list surveys: %w", err)
	}
	return scanSurveys(rows)
}

func (r *SurveyRepository) GetByID(ctx context.Context, id int64) (*domain.Survey, error) {
	return r.getOne(ctx, `id = $1`, id)
}

func (r *SurveyRepository) GetBySlug(ctx context.Context, slug string) (*domain.Survey, error) {
	return r.getOne(ctx, `slug = $1`, slug)
}

func (r *SurveyRepository) getOne(ctx context.Context, where string, arg any) (*domain.Survey, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, slug, title, description, settings, questions, status, sort_order,
			created_at, updated_at, published_at, closed_at
		FROM surveys WHERE `+where, arg)
	s, err := scanSurvey(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrSurveyNotFound
		}
		return nil, err
	}
	return s, nil
}

func (r *SurveyRepository) SlugExists(ctx context.Context, slug string, excludeID int64) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM surveys WHERE slug = $1 AND id <> $2)`, slug, excludeID,
	).Scan(&exists)
	return exists, err
}

func (r *SurveyRepository) Create(ctx context.Context, s *domain.Survey) (*domain.Survey, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO surveys (slug, title, description, settings, questions, status, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, slug, title, description, settings, questions, status, sort_order,
			created_at, updated_at, published_at, closed_at`,
		s.Slug, s.Title, s.Description, s.Settings, s.Questions, s.Status, s.SortOrder,
	)
	return scanSurvey(row)
}

func (r *SurveyRepository) Update(ctx context.Context, s *domain.Survey) (*domain.Survey, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE surveys
		SET slug = $1, title = $2, description = $3, settings = $4, questions = $5,
			sort_order = $6, updated_at = NOW()
		WHERE id = $7 AND status <> 'closed'
		RETURNING id, slug, title, description, settings, questions, status, sort_order,
			created_at, updated_at, published_at, closed_at`,
		s.Slug, s.Title, s.Description, s.Settings, s.Questions, s.SortOrder, s.ID,
	)
	item, err := scanSurvey(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrSurveyNotFound
		}
		return nil, err
	}
	return item, nil
}

func (r *SurveyRepository) Publish(ctx context.Context, id int64) (*domain.Survey, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE surveys
		SET status = 'published', published_at = COALESCE(published_at, NOW()), updated_at = NOW()
		WHERE id = $1 AND status = 'draft'
		RETURNING id, slug, title, description, settings, questions, status, sort_order,
			created_at, updated_at, published_at, closed_at`, id)
	item, err := scanSurvey(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrSurveyNotFound
		}
		return nil, err
	}
	return item, nil
}

func (r *SurveyRepository) Close(ctx context.Context, id int64) (*domain.Survey, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE surveys
		SET status = 'closed', closed_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND status = 'published'
		RETURNING id, slug, title, description, settings, questions, status, sort_order,
			created_at, updated_at, published_at, closed_at`, id)
	item, err := scanSurvey(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrSurveyNotFound
		}
		return nil, err
	}
	return item, nil
}

func (r *SurveyRepository) Delete(ctx context.Context, id int64) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM surveys WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete survey: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrSurveyNotFound
	}
	return nil
}

func (r *SurveyRepository) ListPublished(ctx context.Context) ([]domain.Survey, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, title, description, settings, questions, status, sort_order,
			created_at, updated_at, published_at, closed_at
		FROM surveys
		WHERE status = 'published'
		ORDER BY sort_order ASC, created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("list published surveys: %w", err)
	}
	return scanSurveys(rows)
}

func (r *SurveyRepository) GetPublicByRef(ctx context.Context, ref string) (*domain.Survey, error) {
	ref = strings.TrimSpace(ref)
	if ref == "" {
		return nil, ErrSurveyNotFound
	}
	if id, err := strconv.ParseInt(ref, 10, 64); err == nil && id > 0 {
		return r.getPublicOne(ctx, `id = $1`, id)
	}
	return r.getPublicOne(ctx, `slug = $1`, ref)
}

func (r *SurveyRepository) getPublicOne(ctx context.Context, where string, arg any) (*domain.Survey, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, slug, title, description, settings, questions, status, sort_order,
			created_at, updated_at, published_at, closed_at
		FROM surveys
		WHERE `+where+` AND status IN ('published', 'closed')`, arg)
	s, err := scanSurvey(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrSurveyNotFound
		}
		return nil, err
	}
	return s, nil
}

func (r *SurveyRepository) CreateResponse(ctx context.Context, surveyID int64, answers json.RawMessage) (*domain.SurveyResponse, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO survey_responses (survey_id, answers)
		VALUES ($1, $2)
		RETURNING id, survey_id, answers, created_at`, surveyID, answers)
	var resp domain.SurveyResponse
	if err := row.Scan(&resp.ID, &resp.SurveyID, &resp.Answers, &resp.CreatedAt); err != nil {
		return nil, fmt.Errorf("create survey response: %w", err)
	}
	return &resp, nil
}

func (r *SurveyRepository) ListResponses(ctx context.Context, filter SurveyResponseListFilter) ([]SurveyResponseListRow, int, error) {
	where, args := buildSurveyResponseWhere(filter)
	order := "r.created_at DESC"
	if !filter.SortDesc {
		order = "r.created_at ASC"
	}
	limit := filter.Limit
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	page := filter.Page
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	countQuery := `
		SELECT COUNT(*)
		FROM survey_responses r
		JOIN surveys s ON s.id = r.survey_id
		WHERE ` + where
	var total int
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count survey responses: %w", err)
	}

	listArgs := append(append([]any{}, args...), limit, offset)
	rows, err := r.pool.Query(ctx, `
		SELECT r.id, r.survey_id, s.slug, s.title, r.answers, r.created_at
		FROM survey_responses r
		JOIN surveys s ON s.id = r.survey_id
		WHERE `+where+`
		ORDER BY `+order+`
		LIMIT $`+strconv.Itoa(len(args)+1)+` OFFSET $`+strconv.Itoa(len(args)+2), listArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("list survey responses: %w", err)
	}
	defer rows.Close()

	items := make([]SurveyResponseListRow, 0)
	for rows.Next() {
		var row SurveyResponseListRow
		if err := rows.Scan(&row.ID, &row.SurveyID, &row.SurveySlug, &row.SurveyTitle, &row.Answers, &row.CreatedAt); err != nil {
			return nil, 0, err
		}
		items = append(items, row)
	}
	return items, total, rows.Err()
}

func buildSurveyResponseWhere(filter SurveyResponseListFilter) (string, []any) {
	parts := []string{"1=1"}
	args := make([]any, 0, 6)
	n := 1
	if filter.SurveyID > 0 {
		parts = append(parts, fmt.Sprintf("r.survey_id = $%d", n))
		args = append(args, filter.SurveyID)
		n++
	}
	if filter.From != nil {
		parts = append(parts, fmt.Sprintf("r.created_at >= $%d", n))
		args = append(args, *filter.From)
		n++
	}
	if filter.To != nil {
		parts = append(parts, fmt.Sprintf("r.created_at < $%d", n))
		args = append(args, filter.To.Add(24*time.Hour))
		n++
	}
	if filter.Search != "" {
		parts = append(parts, fmt.Sprintf("r.answers::text ILIKE $%d", n))
		args = append(args, "%"+filter.Search+"%")
		n++
	}
	if filter.QuestionID != "" {
		parts = append(parts, fmt.Sprintf("r.answers ? $%d", n))
		args = append(args, filter.QuestionID)
		n++
	}
	return strings.Join(parts, " AND "), args
}

func (r *SurveyRepository) GetResponseByID(ctx context.Context, id int64) (*SurveyResponseListRow, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT r.id, r.survey_id, s.slug, s.title, r.answers, r.created_at
		FROM survey_responses r
		JOIN surveys s ON s.id = r.survey_id
		WHERE r.id = $1`, id)
	var item SurveyResponseListRow
	if err := row.Scan(&item.ID, &item.SurveyID, &item.SurveySlug, &item.SurveyTitle, &item.Answers, &item.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrSurveyResponseNotFound
		}
		return nil, err
	}
	return &item, nil
}

func (r *SurveyRepository) GetResponseDetail(ctx context.Context, id int64) (*SurveyResponseListRow, *domain.Survey, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT r.id, r.survey_id, s.slug, s.title, r.answers, r.created_at,
			s.id, s.slug, s.title, s.description, s.settings, s.questions, s.status, s.sort_order,
			s.created_at, s.updated_at, s.published_at, s.closed_at
		FROM survey_responses r
		JOIN surveys s ON s.id = r.survey_id
		WHERE r.id = $1`, id)
	var item SurveyResponseListRow
	var survey domain.Survey
	if err := row.Scan(
		&item.ID, &item.SurveyID, &item.SurveySlug, &item.SurveyTitle, &item.Answers, &item.CreatedAt,
		&survey.ID, &survey.Slug, &survey.Title, &survey.Description, &survey.Settings, &survey.Questions,
		&survey.Status, &survey.SortOrder, &survey.CreatedAt, &survey.UpdatedAt, &survey.PublishedAt, &survey.ClosedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil, ErrSurveyResponseNotFound
		}
		return nil, nil, err
	}
	return &item, &survey, nil
}

func (r *SurveyRepository) DeleteResponse(ctx context.Context, id int64) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM survey_responses WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete survey response: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrSurveyResponseNotFound
	}
	return nil
}

type SurveyResponseSummary struct {
	Total      int
	Today      int
	Week       int
	FirstAt    *time.Time
	LastAt     *time.Time
}

func (r *SurveyRepository) GetResponseSummary(ctx context.Context, surveyID int64) (SurveyResponseSummary, error) {
	var summary SurveyResponseSummary
	today := time.Now().UTC().Truncate(24 * time.Hour)
	weekStart := today.AddDate(0, 0, -7)
	err := r.pool.QueryRow(ctx, `
		SELECT
			COUNT(*),
			COUNT(*) FILTER (WHERE created_at >= $2),
			COUNT(*) FILTER (WHERE created_at >= $3),
			MIN(created_at),
			MAX(created_at)
		FROM survey_responses
		WHERE survey_id = $1`, surveyID, today, weekStart,
	).Scan(&summary.Total, &summary.Today, &summary.Week, &summary.FirstAt, &summary.LastAt)
	return summary, err
}

func (r *SurveyRepository) ListFileFormats(ctx context.Context) ([]domain.SurveyFileFormat, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT question_type, category, label_uz, mime_types, extensions,
			default_max_size_mb, default_max_files
		FROM survey_file_formats
		ORDER BY sort_order ASC`)
	if err != nil {
		return nil, fmt.Errorf("list survey file formats: %w", err)
	}
	defer rows.Close()

	items := make([]domain.SurveyFileFormat, 0)
	for rows.Next() {
		var f domain.SurveyFileFormat
		if err := rows.Scan(
			&f.QuestionType, &f.Category, &f.LabelUz, &f.MIMETypes, &f.Extensions,
			&f.DefaultMaxSizeMB, &f.DefaultMaxFiles,
		); err != nil {
			return nil, err
		}
		items = append(items, f)
	}
	return items, rows.Err()
}

func scanSurveys(rows pgx.Rows) ([]domain.Survey, error) {
	defer rows.Close()
	items := make([]domain.Survey, 0)
	for rows.Next() {
		var s domain.Survey
		if err := rows.Scan(
			&s.ID, &s.Slug, &s.Title, &s.Description, &s.Settings, &s.Questions,
			&s.Status, &s.SortOrder, &s.CreatedAt, &s.UpdatedAt, &s.PublishedAt, &s.ClosedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, s)
	}
	return items, rows.Err()
}

func scanSurvey(row pgx.Row) (*domain.Survey, error) {
	var s domain.Survey
	if err := row.Scan(
		&s.ID, &s.Slug, &s.Title, &s.Description, &s.Settings, &s.Questions,
		&s.Status, &s.SortOrder, &s.CreatedAt, &s.UpdatedAt, &s.PublishedAt, &s.ClosedAt,
	); err != nil {
		return nil, err
	}
	return &s, nil
}
