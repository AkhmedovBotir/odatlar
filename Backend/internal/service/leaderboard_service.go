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

type LeaderboardService struct {
	userRepo *repository.BotUserRepository
}

func NewLeaderboardService(userRepo *repository.BotUserRepository) *LeaderboardService {
	return &LeaderboardService{userRepo: userRepo}
}

func (s *LeaderboardService) Get(ctx context.Context, tgUser *telegram.WebAppUser, limit int) (*dto.LeaderboardResponse, error) {
	botUser, err := s.userRepo.GetByTelegramID(ctx, tgUser.ID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRuntimeBotUserNotFound
		}
		return nil, fmt.Errorf("get bot user: %w", err)
	}

	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	users, err := s.userRepo.ListTopByXP(ctx, limit)
	if err != nil {
		return nil, err
	}

	rank, err := s.userRepo.GetRankByXP(ctx, botUser.ID)
	if err != nil {
		return nil, err
	}

	data := make([]dto.LeaderboardEntryResponse, 0, len(users))
	for i, user := range users {
		data = append(data, dto.LeaderboardEntryResponse{
			Rank:  i + 1,
			Name:  botUserDisplayName(&user),
			XP:    user.XP,
			Level: user.Level,
			IsMe:  user.ID == botUser.ID,
		})
	}

	return &dto.LeaderboardResponse{
		Data:            data,
		CurrentUserRank: rank,
	}, nil
}

func botUserDisplayName(u *domain.BotUser) string {
	return botUserDisplayNameFromFields(u.FirstName, u.LastName, u.Username, u.TelegramID)
}

func botUserDisplayNameFromFields(firstName, lastName, username string, telegramID int64) string {
	name := strings.TrimSpace(strings.TrimSpace(firstName) + " " + strings.TrimSpace(lastName))
	if name == "" && strings.TrimSpace(username) != "" {
		return "@" + strings.TrimSpace(username)
	}
	if name == "" {
		return fmt.Sprintf("Foydalanuvchi %d", telegramID)
	}
	return name
}
