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

var ErrIndicatorNotFound = errors.New("indicator not found")

type IndicatorRepository struct {
	pool *pgxpool.Pool
}

func NewIndicatorRepository(pool *pgxpool.Pool) *IndicatorRepository {
	return &IndicatorRepository{pool: pool}
}

func (r *IndicatorRepository) ListByBotUserID(ctx context.Context, botUserID int64) ([]domain.UserIndicator, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, bot_user_id, name, benefits, today_indicator_value, created_at, updated_at
		FROM user_indicators
		WHERE bot_user_id = $1
		ORDER BY created_at ASC`, botUserID)
	if err != nil {
		return nil, fmt.Errorf("list indicators: %w", err)
	}
	defer rows.Close()

	var items []domain.UserIndicator
	for rows.Next() {
		item, err := scanIndicator(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *item)
	}
	if items == nil {
		items = []domain.UserIndicator{}
	}
	return items, nil
}

func (r *IndicatorRepository) Create(ctx context.Context, indicator *domain.UserIndicator) (*domain.UserIndicator, error) {
	benefitsJSON, err := json.Marshal(indicator.Benefits)
	if err != nil {
		return nil, err
	}

	row := r.pool.QueryRow(ctx, `
		INSERT INTO user_indicators (bot_user_id, name, benefits, today_indicator_value)
		VALUES ($1, $2, $3, NULL)
		RETURNING id, bot_user_id, name, benefits, today_indicator_value, created_at, updated_at`,
		indicator.BotUserID, indicator.Name, benefitsJSON,
	)
	return scanIndicator(row)
}

func (r *IndicatorRepository) GetByID(ctx context.Context, botUserID, indicatorID int64) (*domain.UserIndicator, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, bot_user_id, name, benefits, today_indicator_value, created_at, updated_at
		FROM user_indicators
		WHERE id = $1 AND bot_user_id = $2`, indicatorID, botUserID)

	item, err := scanIndicator(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrIndicatorNotFound
		}
		return nil, err
	}
	return item, nil
}

func (r *IndicatorRepository) Update(ctx context.Context, indicator *domain.UserIndicator) (*domain.UserIndicator, error) {
	benefitsJSON, err := json.Marshal(indicator.Benefits)
	if err != nil {
		return nil, err
	}

	row := r.pool.QueryRow(ctx, `
		UPDATE user_indicators
		SET name = $1, benefits = $2, updated_at = NOW()
		WHERE id = $3 AND bot_user_id = $4
		RETURNING id, bot_user_id, name, benefits, today_indicator_value, created_at, updated_at`,
		indicator.Name, benefitsJSON, indicator.ID, indicator.BotUserID,
	)

	item, err := scanIndicator(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrIndicatorNotFound
		}
		return nil, err
	}
	return item, nil
}

func (r *IndicatorRepository) Delete(ctx context.Context, botUserID, indicatorID int64) error {
	tag, err := r.pool.Exec(ctx, `
		DELETE FROM user_indicators
		WHERE id = $1 AND bot_user_id = $2`, indicatorID, botUserID)
	if err != nil {
		return fmt.Errorf("delete indicator: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrIndicatorNotFound
	}
	return nil
}

func (r *IndicatorRepository) SetTodayValue(ctx context.Context, botUserID, indicatorID int64, value *string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE user_indicators
		SET today_indicator_value = $1, updated_at = NOW()
		WHERE id = $2 AND bot_user_id = $3`, value, indicatorID, botUserID)
	if err != nil {
		return fmt.Errorf("set today indicator value: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrIndicatorNotFound
	}
	return nil
}

func (r *IndicatorRepository) UpsertLog(ctx context.Context, log *domain.IndicatorLog) (*domain.IndicatorLog, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO indicator_logs (indicator_id, bot_user_id, completed_at, date, value_id, value_label, numeric_value, is_empty)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (indicator_id, date) DO UPDATE SET
			completed_at = EXCLUDED.completed_at,
			value_id = EXCLUDED.value_id,
			value_label = EXCLUDED.value_label,
			numeric_value = EXCLUDED.numeric_value,
			is_empty = EXCLUDED.is_empty
		RETURNING id, indicator_id, bot_user_id, completed_at, date, value_id, value_label, numeric_value, is_empty`,
		log.IndicatorID, log.BotUserID, log.CompletedAt, log.Date,
		log.ValueID, log.ValueLabel, log.NumericValue, log.IsEmpty,
	)

	var item domain.IndicatorLog
	err := row.Scan(
		&item.ID, &item.IndicatorID, &item.BotUserID, &item.CompletedAt, &item.Date,
		&item.ValueID, &item.ValueLabel, &item.NumericValue, &item.IsEmpty,
	)
	if err != nil {
		return nil, fmt.Errorf("upsert indicator log: %w", err)
	}
	return &item, nil
}

func (r *IndicatorRepository) ListLogs(ctx context.Context, botUserID int64, from, to time.Time) ([]domain.IndicatorLog, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, indicator_id, bot_user_id, completed_at, date, value_id, value_label, numeric_value, is_empty
		FROM indicator_logs
		WHERE bot_user_id = $1 AND date BETWEEN $2 AND $3
		ORDER BY completed_at DESC`, botUserID, from, to)
	if err != nil {
		return nil, fmt.Errorf("list indicator logs: %w", err)
	}
	defer rows.Close()

	var items []domain.IndicatorLog
	for rows.Next() {
		var item domain.IndicatorLog
		if err := rows.Scan(
			&item.ID, &item.IndicatorID, &item.BotUserID, &item.CompletedAt, &item.Date,
			&item.ValueID, &item.ValueLabel, &item.NumericValue, &item.IsEmpty,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if items == nil {
		items = []domain.IndicatorLog{}
	}
	return items, nil
}

func scanIndicator(row pgx.Row) (*domain.UserIndicator, error) {
	var item domain.UserIndicator
	var benefitsRaw []byte
	var todayValue *string

	if err := row.Scan(
		&item.ID, &item.BotUserID, &item.Name, &benefitsRaw, &todayValue,
		&item.CreatedAt, &item.UpdatedAt,
	); err != nil {
		return nil, err
	}

	if len(benefitsRaw) > 0 {
		_ = json.Unmarshal(benefitsRaw, &item.Benefits)
	}
	if item.Benefits == nil {
		item.Benefits = []string{}
	}
	if todayValue != nil {
		item.TodayIndicatorValue = *todayValue
	}
	return &item, nil
}
