package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/odatlar-bot/backend/internal/domain"
)

var ErrDominantNotFound = errors.New("dominant not found")

type DominantRepository struct {
	pool *pgxpool.Pool
}

func NewDominantRepository(pool *pgxpool.Pool) *DominantRepository {
	return &DominantRepository{pool: pool}
}

func (r *DominantRepository) ListByBotUserID(ctx context.Context, botUserID int64) ([]domain.UserDominant, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, bot_user_id, title, type, cue, reward, pros, cons, notes, sessions_completed, created_at, updated_at
		FROM user_dominants
		WHERE bot_user_id = $1
		ORDER BY created_at ASC`, botUserID)
	if err != nil {
		return nil, fmt.Errorf("list dominants: %w", err)
	}
	defer rows.Close()

	items := make([]domain.UserDominant, 0)
	for rows.Next() {
		item, err := scanDominant(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *item)
	}
	return items, nil
}

func (r *DominantRepository) Create(ctx context.Context, dominant *domain.UserDominant) (*domain.UserDominant, error) {
	prosJSON, err := json.Marshal(normalizeStringSlice(dominant.Pros))
	if err != nil {
		return nil, err
	}
	consJSON, err := json.Marshal(normalizeStringSlice(dominant.Cons))
	if err != nil {
		return nil, err
	}

	row := r.pool.QueryRow(ctx, `
		INSERT INTO user_dominants (bot_user_id, title, type, cue, reward, pros, cons, notes, sessions_completed)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, bot_user_id, title, type, cue, reward, pros, cons, notes, sessions_completed, created_at, updated_at`,
		dominant.BotUserID, dominant.Title, dominant.Type, dominant.Cue, dominant.Reward,
		prosJSON, consJSON, dominant.Notes, dominant.SessionsCompleted,
	)

	return scanDominant(row)
}

func (r *DominantRepository) GetByID(ctx context.Context, botUserID, dominantID int64) (*domain.UserDominant, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, bot_user_id, title, type, cue, reward, pros, cons, notes, sessions_completed, created_at, updated_at
		FROM user_dominants
		WHERE id = $1 AND bot_user_id = $2`, dominantID, botUserID)

	d, err := scanDominant(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrDominantNotFound
		}
		return nil, err
	}
	return d, nil
}

func (r *DominantRepository) Update(ctx context.Context, dominant *domain.UserDominant) (*domain.UserDominant, error) {
	prosJSON, err := json.Marshal(normalizeStringSlice(dominant.Pros))
	if err != nil {
		return nil, err
	}
	consJSON, err := json.Marshal(normalizeStringSlice(dominant.Cons))
	if err != nil {
		return nil, err
	}

	row := r.pool.QueryRow(ctx, `
		UPDATE user_dominants
		SET title = $1, type = $2, cue = $3, reward = $4, pros = $5, cons = $6, notes = $7, sessions_completed = $8, updated_at = NOW()
		WHERE id = $9 AND bot_user_id = $10
		RETURNING id, bot_user_id, title, type, cue, reward, pros, cons, notes, sessions_completed, created_at, updated_at`,
		dominant.Title, dominant.Type, dominant.Cue, dominant.Reward,
		prosJSON, consJSON, dominant.Notes, dominant.SessionsCompleted,
		dominant.ID, dominant.BotUserID,
	)

	d, err := scanDominant(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrDominantNotFound
		}
		return nil, err
	}
	return d, nil
}

func (r *DominantRepository) Delete(ctx context.Context, botUserID, dominantID int64) error {
	tag, err := r.pool.Exec(ctx, `
		DELETE FROM user_dominants
		WHERE id = $1 AND bot_user_id = $2`, dominantID, botUserID)
	if err != nil {
		return fmt.Errorf("delete dominant: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrDominantNotFound
	}
	return nil
}

func (r *DominantRepository) AddSession(ctx context.Context, session *domain.DominantSession) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO dominant_sessions (dominant_id, bot_user_id, type, completed_at)
		VALUES ($1, $2, $3, $4)`,
		session.DominantID, session.BotUserID, session.Type, session.CompletedAt,
	)
	if err != nil {
		return fmt.Errorf("add dominant session: %w", err)
	}
	return nil
}

func normalizeStringSlice(items []string) []string {
	if items == nil {
		return []string{}
	}
	return items
}

func scanDominant(row pgx.Row) (*domain.UserDominant, error) {
	var d domain.UserDominant
	var prosRaw, consRaw []byte
	if err := row.Scan(
		&d.ID, &d.BotUserID, &d.Title, &d.Type, &d.Cue, &d.Reward,
		&prosRaw, &consRaw, &d.Notes, &d.SessionsCompleted, &d.CreatedAt, &d.UpdatedAt,
	); err != nil {
		return nil, err
	}
	if len(prosRaw) > 0 {
		_ = json.Unmarshal(prosRaw, &d.Pros)
	}
	if len(consRaw) > 0 {
		_ = json.Unmarshal(consRaw, &d.Cons)
	}
	if d.Pros == nil {
		d.Pros = []string{}
	}
	if d.Cons == nil {
		d.Cons = []string{}
	}
	return &d, nil
}
