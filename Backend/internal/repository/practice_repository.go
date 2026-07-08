package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/odatlar-bot/backend/internal/domain"
)

var ErrPracticeNotFound = errors.New("practice not found")

type PracticeRepository struct {
	pool *pgxpool.Pool
}

func NewPracticeRepository(pool *pgxpool.Pool) *PracticeRepository {
	return &PracticeRepository{pool: pool}
}

func (r *PracticeRepository) ListByBotUserID(ctx context.Context, botUserID int64, today time.Time) ([]domain.UserPractice, map[int64]bool, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, bot_user_id, name, benefits, streak, created_at, updated_at
		FROM user_practices
		WHERE bot_user_id = $1
		ORDER BY created_at ASC`, botUserID)
	if err != nil {
		return nil, nil, fmt.Errorf("list practices: %w", err)
	}
	defer rows.Close()

	practices := make([]domain.UserPractice, 0)
	ids := make([]int64, 0)
	for rows.Next() {
		p, err := scanPractice(rows)
		if err != nil {
			return nil, nil, err
		}
		practices = append(practices, *p)
		ids = append(ids, p.ID)
	}

	completedMap, err := r.completedTodayMap(ctx, ids, today)
	if err != nil {
		return nil, nil, err
	}

	return practices, completedMap, nil
}

func (r *PracticeRepository) Create(ctx context.Context, practice *domain.UserPractice) (*domain.UserPractice, error) {
	benefitsJSON, err := json.Marshal(practice.Benefits)
	if err != nil {
		return nil, err
	}

	row := r.pool.QueryRow(ctx, `
		INSERT INTO user_practices (bot_user_id, name, benefits, streak)
		VALUES ($1, $2, $3, $4)
		RETURNING id, bot_user_id, name, benefits, streak, created_at, updated_at`,
		practice.BotUserID, practice.Name, benefitsJSON, practice.Streak,
	)

	return scanPractice(row)
}

func (r *PracticeRepository) GetByID(ctx context.Context, botUserID, practiceID int64) (*domain.UserPractice, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, bot_user_id, name, benefits, streak, created_at, updated_at
		FROM user_practices
		WHERE id = $1 AND bot_user_id = $2`, practiceID, botUserID)

	p, err := scanPractice(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPracticeNotFound
		}
		return nil, err
	}
	return p, nil
}

func (r *PracticeRepository) Update(ctx context.Context, practice *domain.UserPractice) (*domain.UserPractice, error) {
	benefitsJSON, err := json.Marshal(practice.Benefits)
	if err != nil {
		return nil, err
	}

	row := r.pool.QueryRow(ctx, `
		UPDATE user_practices
		SET name = $1, benefits = $2, updated_at = NOW()
		WHERE id = $3 AND bot_user_id = $4
		RETURNING id, bot_user_id, name, benefits, streak, created_at, updated_at`,
		practice.Name, benefitsJSON, practice.ID, practice.BotUserID,
	)

	p, err := scanPractice(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPracticeNotFound
		}
		return nil, err
	}
	return p, nil
}

func (r *PracticeRepository) Delete(ctx context.Context, botUserID, practiceID int64) error {
	tag, err := r.pool.Exec(ctx, `
		DELETE FROM user_practices
		WHERE id = $1 AND bot_user_id = $2`, practiceID, botUserID)
	if err != nil {
		return fmt.Errorf("delete practice: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrPracticeNotFound
	}
	return nil
}

func (r *PracticeRepository) UpdateStreak(ctx context.Context, botUserID, practiceID int64, streak int) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE user_practices
		SET streak = $1, updated_at = NOW()
		WHERE id = $2 AND bot_user_id = $3`, streak, practiceID, botUserID)
	if err != nil {
		return fmt.Errorf("update streak: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrPracticeNotFound
	}
	return nil
}

func (r *PracticeRepository) IsCompletedToday(ctx context.Context, practiceID int64, today time.Time) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM practice_completions
			WHERE practice_id = $1 AND date = $2
		)`, practiceID, today).Scan(&exists)
	return exists, err
}

func (r *PracticeRepository) AddCompletion(ctx context.Context, completion *domain.PracticeCompletion) (*domain.PracticeCompletion, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO practice_completions (practice_id, bot_user_id, completed_at, date)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (practice_id, date) DO UPDATE SET completed_at = EXCLUDED.completed_at
		RETURNING id, practice_id, bot_user_id, completed_at, date`,
		completion.PracticeID, completion.BotUserID, completion.CompletedAt, completion.Date,
	)

	var c domain.PracticeCompletion
	err := row.Scan(&c.ID, &c.PracticeID, &c.BotUserID, &c.CompletedAt, &c.Date)
	if err != nil {
		return nil, fmt.Errorf("add completion: %w", err)
	}
	return &c, nil
}

func (r *PracticeRepository) RemoveCompletionToday(ctx context.Context, practiceID int64, today time.Time) error {
	_, err := r.pool.Exec(ctx, `
		DELETE FROM practice_completions
		WHERE practice_id = $1 AND date = $2`, practiceID, today)
	return err
}

func (r *PracticeRepository) ListCompletions(ctx context.Context, botUserID int64, from, to time.Time) ([]domain.PracticeCompletion, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT pc.id, pc.practice_id, pc.bot_user_id, pc.completed_at, pc.date
		FROM practice_completions pc
		WHERE pc.bot_user_id = $1 AND pc.date BETWEEN $2 AND $3
		ORDER BY pc.completed_at DESC`, botUserID, from, to)
	if err != nil {
		return nil, fmt.Errorf("list completions: %w", err)
	}
	defer rows.Close()

	var items []domain.PracticeCompletion
	for rows.Next() {
		var c domain.PracticeCompletion
		if err := rows.Scan(&c.ID, &c.PracticeID, &c.BotUserID, &c.CompletedAt, &c.Date); err != nil {
			return nil, err
		}
		items = append(items, c)
	}
	if items == nil {
		items = []domain.PracticeCompletion{}
	}
	return items, nil
}

func (r *PracticeRepository) completedTodayMap(ctx context.Context, practiceIDs []int64, today time.Time) (map[int64]bool, error) {
	result := make(map[int64]bool, len(practiceIDs))
	if len(practiceIDs) == 0 {
		return result, nil
	}

	rows, err := r.pool.Query(ctx, `
		SELECT practice_id
		FROM practice_completions
		WHERE practice_id = ANY($1) AND date = $2`, practiceIDs, today)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		result[id] = true
	}
	return result, nil
}

func scanPractice(row pgx.Row) (*domain.UserPractice, error) {
	var p domain.UserPractice
	var benefitsRaw []byte
	if err := row.Scan(&p.ID, &p.BotUserID, &p.Name, &benefitsRaw, &p.Streak, &p.CreatedAt, &p.UpdatedAt); err != nil {
		return nil, err
	}
	if len(benefitsRaw) > 0 {
		_ = json.Unmarshal(benefitsRaw, &p.Benefits)
	}
	if p.Benefits == nil {
		p.Benefits = []string{}
	}
	return &p, nil
}
