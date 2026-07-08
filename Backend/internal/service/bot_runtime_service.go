package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/odatlar-bot/backend/internal/domain"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/pkg/telegram"
)

var (
	ErrBotNotActive           = errors.New("bot is not active")
	ErrBotTokenMissing        = errors.New("bot token is not configured")
	ErrRuntimeBotUserNotFound = errors.New("bot user not found")
)

type BotRuntimeService struct {
	settingsRepo *repository.BotSettingsRepository
	userRepo     *repository.BotUserRepository
	xp           *XPService
}

func NewBotRuntimeService(settingsRepo *repository.BotSettingsRepository, userRepo *repository.BotUserRepository, xp *XPService) *BotRuntimeService {
	return &BotRuntimeService{
		settingsRepo: settingsRepo,
		userRepo:     userRepo,
		xp:           xp,
	}
}

func (s *BotRuntimeService) GetConfig(ctx context.Context) (*dto.BotRuntimeConfigResponse, error) {
	settings, err := s.settingsRepo.Get(ctx)
	if err != nil {
		return nil, err
	}

	if !settings.IsActive {
		return nil, ErrBotNotActive
	}
	if settings.BotToken == "" {
		return nil, ErrBotTokenMissing
	}

	return &dto.BotRuntimeConfigResponse{
		IsActive:    settings.IsActive,
		BotToken:    settings.BotToken,
		BotUsername: settings.BotUsername,
		Start: dto.BotStartDTO{
			Message: settings.StartMessage,
			Button: dto.StartButtonDTO{
				Enabled:   settings.StartButtonEnabled,
				Text:      settings.StartButtonText,
				WebAppURL: settings.StartButtonWebAppURL,
			},
		},
		UpdatedAt: settings.UpdatedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}, nil
}

func (s *BotRuntimeService) RegisterStart(ctx context.Context, req dto.BotStartUserRequest) (*dto.BotUserResponse, error) {
	user := &domain.BotUser{
		TelegramID:   req.TelegramID,
		FirstName:    strings.TrimSpace(req.FirstName),
		LastName:     strings.TrimSpace(req.LastName),
		Username:     strings.TrimSpace(req.Username),
		Phone:        strings.TrimSpace(req.Phone),
		LanguageCode: strings.TrimSpace(req.LanguageCode),
		AvatarURL:    strings.TrimSpace(req.AvatarURL),
		IsBot:        req.IsBot,
		IsPremium:    req.IsPremium,
	}

	saved, err := s.userRepo.UpsertOnStart(ctx, user)
	if err != nil {
		return nil, err
	}

	resp := toBotUserResponse(saved, s.xp.LevelUpXP(ctx))
	return &resp, nil
}

func (s *BotRuntimeService) RegisterWebAppOpen(ctx context.Context, tgUser *telegram.WebAppUser) (*dto.BotUserResponse, error) {
	user := webAppUserToDomain(tgUser)
	saved, err := s.userRepo.UpsertOnStart(ctx, user)
	if err != nil {
		return nil, err
	}

	resp := toBotUserResponse(saved, s.xp.LevelUpXP(ctx))
	return &resp, nil
}

func (s *BotRuntimeService) GetMe(ctx context.Context, telegramID int64) (*dto.BotUserResponse, error) {
	user, err := s.userRepo.GetByTelegramID(ctx, telegramID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRuntimeBotUserNotFound
		}
		return nil, fmt.Errorf("get bot user: %w", err)
	}

	resp := toBotUserResponse(user, s.xp.LevelUpXP(ctx))
	return &resp, nil
}

func webAppUserToDomain(tgUser *telegram.WebAppUser) *domain.BotUser {
	return &domain.BotUser{
		TelegramID:   tgUser.ID,
		FirstName:    strings.TrimSpace(tgUser.FirstName),
		LastName:     strings.TrimSpace(tgUser.LastName),
		Username:     strings.TrimSpace(tgUser.Username),
		LanguageCode: strings.TrimSpace(tgUser.LanguageCode),
		AvatarURL:    strings.TrimSpace(tgUser.PhotoURL),
		IsPremium:    tgUser.IsPremium,
	}
}
