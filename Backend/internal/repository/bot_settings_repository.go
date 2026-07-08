package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/odatlar-bot/backend/internal/domain"
)

var ErrBotSettingsNotFound = errors.New("bot settings not found")

type BotSettingsRepository struct {
	pool *pgxpool.Pool
}

func NewBotSettingsRepository(pool *pgxpool.Pool) *BotSettingsRepository {
	return &BotSettingsRepository{pool: pool}
}

const botSettingsSelect = `
	SELECT
		id, bot_token, bot_username, is_active,
		start_message, start_button_enabled, start_button_text, start_button_web_app_url,
		created_at, updated_at
	FROM bot_settings WHERE id = 1`

func (r *BotSettingsRepository) Get(ctx context.Context) (*domain.BotSettings, error) {
	settings, err := r.scanSettings(r.pool.QueryRow(ctx, botSettingsSelect))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrBotSettingsNotFound
		}
		return nil, fmt.Errorf("get bot settings: %w", err)
	}
	return settings, nil
}

func (r *BotSettingsRepository) UpdateToken(ctx context.Context, token, username string, isActive bool) (*domain.BotSettings, error) {
	query := `
		UPDATE bot_settings
		SET bot_token = $1, bot_username = $2, is_active = $3, updated_at = NOW()
		WHERE id = 1
		RETURNING ` + botSettingsReturning()

	return r.scanSettings(r.pool.QueryRow(ctx, query, token, username, isActive))
}

func (r *BotSettingsRepository) ClearToken(ctx context.Context) (*domain.BotSettings, error) {
	query := `
		UPDATE bot_settings
		SET bot_token = NULL, bot_username = NULL, is_active = false, updated_at = NOW()
		WHERE id = 1
		RETURNING ` + botSettingsReturning()

	return r.scanSettings(r.pool.QueryRow(ctx, query))
}

func (r *BotSettingsRepository) UpdateStart(ctx context.Context, settings *domain.BotSettings) (*domain.BotSettings, error) {
	query := `
		UPDATE bot_settings SET
			start_message = $1,
			start_button_enabled = $2,
			start_button_text = $3,
			start_button_web_app_url = $4,
			updated_at = NOW()
		WHERE id = 1
		RETURNING ` + botSettingsReturning()

	return r.scanSettings(r.pool.QueryRow(ctx, query,
		settings.StartMessage,
		settings.StartButtonEnabled,
		settings.StartButtonText,
		nullIfEmpty(settings.StartButtonWebAppURL),
	))
}

func (r *BotSettingsRepository) scanSettings(row pgx.Row) (*domain.BotSettings, error) {
	var s domain.BotSettings
	var token, username, buttonURL *string

	err := row.Scan(
		&s.ID,
		&token, &username, &s.IsActive,
		&s.StartMessage, &s.StartButtonEnabled, &s.StartButtonText, &buttonURL,
		&s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if token != nil {
		s.BotToken = *token
	}
	if username != nil {
		s.BotUsername = *username
	}
	if buttonURL != nil {
		s.StartButtonWebAppURL = *buttonURL
	}

	return &s, nil
}

func botSettingsReturning() string {
	return `
		id, bot_token, bot_username, is_active,
		start_message, start_button_enabled, start_button_text, start_button_web_app_url,
		created_at, updated_at`
}

func nullIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
