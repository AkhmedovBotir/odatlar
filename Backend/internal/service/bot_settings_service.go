package service

import (
	"context"
	"errors"
	"fmt"
	"github.com/jackc/pgx/v5"
	"strings"

	"github.com/odatlar-bot/backend/internal/domain"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/pkg/telegram"
)

var (
	ErrInvalidBotToken        = errors.New("invalid bot token")
	ErrStartButtonRequired    = errors.New("start button text is required when button is enabled")
	ErrStartButtonURLRequired = errors.New("web_app_url is required when button is enabled")
	ErrBotUserNotFound        = errors.New("bot user not found")
)

type BotSettingsService struct {
	settingsRepo *repository.BotSettingsRepository
	userRepo     *repository.BotUserRepository
	xp           *XPService
}

func NewBotSettingsService(settingsRepo *repository.BotSettingsRepository, userRepo *repository.BotUserRepository, xp *XPService) *BotSettingsService {
	return &BotSettingsService{
		settingsRepo: settingsRepo,
		userRepo:     userRepo,
		xp:           xp,
	}
}

func (s *BotSettingsService) GetSettings(ctx context.Context) (*dto.BotSettingsResponse, error) {
	settings, err := s.settingsRepo.Get(ctx)
	if err != nil {
		return nil, err
	}
	resp := toBotSettingsResponse(settings)
	return &resp, nil
}

func (s *BotSettingsService) GetTokenStatus(ctx context.Context) (*dto.BotTokenResponse, error) {
	settings, err := s.settingsRepo.Get(ctx)
	if err != nil {
		return nil, err
	}
	resp := toBotTokenResponse(settings)
	return &resp, nil
}

func (s *BotSettingsService) UpdateToken(ctx context.Context, req dto.UpdateBotTokenRequest) (*dto.BotTokenResponse, error) {
	botInfo, err := telegram.GetBotInfo(ctx, strings.TrimSpace(req.BotToken))
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidBotToken, err)
	}

	settings, err := s.settingsRepo.UpdateToken(ctx, strings.TrimSpace(req.BotToken), botInfo.Username, true)
	if err != nil {
		return nil, err
	}

	resp := toBotTokenResponse(settings)
	return &resp, nil
}

func (s *BotSettingsService) DeleteToken(ctx context.Context) (*dto.BotTokenResponse, error) {
	settings, err := s.settingsRepo.ClearToken(ctx)
	if err != nil {
		return nil, err
	}
	resp := toBotTokenResponse(settings)
	return &resp, nil
}

func (s *BotSettingsService) UpdateSettings(ctx context.Context, req dto.UpdateBotSettingsRequest) (*dto.BotSettingsResponse, error) {
	if err := validateStartSettings(req.Start); err != nil {
		return nil, err
	}

	settings := &domain.BotSettings{
		StartMessage:         strings.TrimSpace(req.Start.Message),
		StartButtonEnabled:   req.Start.Button.Enabled,
		StartButtonText:      strings.TrimSpace(req.Start.Button.Text),
		StartButtonWebAppURL: strings.TrimSpace(req.Start.Button.WebAppURL),
	}

	updated, err := s.settingsRepo.UpdateStart(ctx, settings)
	if err != nil {
		return nil, err
	}

	resp := toBotSettingsResponse(updated)
	return &resp, nil
}

func (s *BotSettingsService) ListUsers(ctx context.Context, page, limit int, search string) (*dto.BotUserListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	users, total, err := s.userRepo.List(ctx, page, limit, search)
	if err != nil {
		return nil, err
	}

	data := make([]dto.BotUserResponse, 0, len(users))
	levelUpXP := s.xp.LevelUpXP(ctx)
	for i := range users {
		data = append(data, toBotUserResponse(&users[i], levelUpXP))
	}

	return &dto.BotUserListResponse{
		Data:  data,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

func (s *BotSettingsService) GetUserByID(ctx context.Context, id int64) (*dto.BotUserResponse, error) {
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrBotUserNotFound
		}
		return nil, err
	}

	resp := toBotUserResponse(user, s.xp.LevelUpXP(ctx))
	return &resp, nil
}

func validateStartSettings(start dto.BotStartDTO) error {
	if !start.Button.Enabled {
		return nil
	}
	if strings.TrimSpace(start.Button.Text) == "" {
		return ErrStartButtonRequired
	}
	if strings.TrimSpace(start.Button.WebAppURL) == "" {
		return ErrStartButtonURLRequired
	}
	return nil
}

func toBotSettingsResponse(s *domain.BotSettings) dto.BotSettingsResponse {
	return dto.BotSettingsResponse{
		Token: toBotTokenResponse(s),
		Start: dto.BotStartDTO{
			Message: s.StartMessage,
			Button: dto.StartButtonDTO{
				Enabled:   s.StartButtonEnabled,
				Text:      s.StartButtonText,
				WebAppURL: s.StartButtonWebAppURL,
			},
		},
		UpdatedAt: s.UpdatedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
}

func toBotTokenResponse(s *domain.BotSettings) dto.BotTokenResponse {
	return dto.BotTokenResponse{
		HasToken:    s.BotToken != "",
		MaskedToken: telegram.MaskToken(s.BotToken),
		BotUsername: s.BotUsername,
		IsActive:    s.IsActive,
	}
}

func toBotUserResponse(u *domain.BotUser, levelUpXP int) dto.BotUserResponse {
	return dto.BotUserResponse{
		ID:           u.ID,
		TelegramID:   u.TelegramID,
		FirstName:    u.FirstName,
		LastName:     u.LastName,
		Username:     u.Username,
		Phone:        u.Phone,
		LanguageCode: u.LanguageCode,
		AvatarURL:    u.AvatarURL,
		IsBot:        u.IsBot,
		IsPremium:    u.IsPremium,
		XP:           u.XP,
		Level:        u.Level,
		LevelUpXP:    levelUpXP,
		StartedAt:    u.StartedAt.UTC().Format("2006-01-02T15:04:05Z"),
		LastStartAt:  u.LastStartAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
}
