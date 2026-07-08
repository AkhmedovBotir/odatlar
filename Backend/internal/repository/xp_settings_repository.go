package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/odatlar-bot/backend/internal/domain"
)

var ErrXPSettingsNotFound = errors.New("xp settings not found")

type XPSettingsRepository struct {
	pool *pgxpool.Pool
}

func NewXPSettingsRepository(pool *pgxpool.Pool) *XPSettingsRepository {
	return &XPSettingsRepository{pool: pool}
}

const xpSettingsSelect = `
	SELECT id, practice_complete_xp, indicator_log_xp, dominant_create_xp, dominant_session_xp, level_up_xp, created_at, updated_at
	FROM xp_settings WHERE id = 1`

func (r *XPSettingsRepository) Get(ctx context.Context) (*domain.XPSettings, error) {
	s, err := scanXPSettings(r.pool.QueryRow(ctx, xpSettingsSelect))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrXPSettingsNotFound
		}
		return nil, fmt.Errorf("get xp settings: %w", err)
	}
	return s, nil
}

func (r *XPSettingsRepository) Update(ctx context.Context, s *domain.XPSettings) (*domain.XPSettings, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE xp_settings
		SET practice_complete_xp = $1,
			indicator_log_xp = $2,
			dominant_create_xp = $3,
			dominant_session_xp = $4,
			level_up_xp = $5,
			updated_at = NOW()
		WHERE id = 1
		RETURNING id, practice_complete_xp, indicator_log_xp, dominant_create_xp, dominant_session_xp, level_up_xp, created_at, updated_at`,
		s.PracticeCompleteXP, s.IndicatorLogXP, s.DominantCreateXP, s.DominantSessionXP, s.LevelUpXP,
	)
	updated, err := scanXPSettings(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrXPSettingsNotFound
		}
		return nil, fmt.Errorf("update xp settings: %w", err)
	}
	return updated, nil
}

func scanXPSettings(row pgx.Row) (*domain.XPSettings, error) {
	var s domain.XPSettings
	if err := row.Scan(
		&s.ID, &s.PracticeCompleteXP, &s.IndicatorLogXP, &s.DominantCreateXP,
		&s.DominantSessionXP, &s.LevelUpXP, &s.CreatedAt, &s.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return &s, nil
}
