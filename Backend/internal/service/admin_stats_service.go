package service

import (
	"context"
	"strings"
	"time"

	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
)

type AdminStatsService struct {
	statsRepo *repository.StatsRepository
	userRepo  *repository.BotUserRepository
	xp        *XPService
}

func NewAdminStatsService(statsRepo *repository.StatsRepository, userRepo *repository.BotUserRepository, xp *XPService) *AdminStatsService {
	return &AdminStatsService{
		statsRepo: statsRepo,
		userRepo:  userRepo,
		xp:        xp,
	}
}

func (s *AdminStatsService) GetOverview(ctx context.Context) (*dto.AdminStatsResponse, error) {
	now := time.Now().In(tashkentTZ)
	dayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, tashkentTZ)
	weekStart := dayStart.AddDate(0, 0, -6)
	today := dayStart

	userStats, err := s.statsRepo.GetUserStats(ctx, dayStart, weekStart)
	if err != nil {
		return nil, err
	}
	practiceStats, err := s.statsRepo.GetPracticeStats(ctx, today)
	if err != nil {
		return nil, err
	}
	indicatorStats, err := s.statsRepo.GetIndicatorStats(ctx, today)
	if err != nil {
		return nil, err
	}
	dominantStats, err := s.statsRepo.GetDominantStats(ctx, dayStart)
	if err != nil {
		return nil, err
	}
	xpStats, err := s.statsRepo.GetXPStats(ctx)
	if err != nil {
		return nil, err
	}

	return &dto.AdminStatsResponse{
		Users: dto.AdminUserStats{
			Total:          userStats.Total,
			NewToday:       userStats.NewToday,
			NewThisWeek:    userStats.NewThisWeek,
			ActiveThisWeek: userStats.ActiveThisWeek,
			WithPhone:      userStats.WithPhone,
			Premium:        userStats.Premium,
		},
		Practices:  toActivityStats(practiceStats),
		Indicators: toActivityStats(indicatorStats),
		Dominants:  toActivityStats(dominantStats),
		XP: dto.AdminXPStats{
			TotalXP:  xpStats.TotalXP,
			AvgXP:    round2(xpStats.AvgXP),
			MaxXP:    xpStats.MaxXP,
			MaxLevel: xpStats.MaxLevel,
			AvgLevel: round2(xpStats.AvgLevel),
			LevelUp:  s.xp.LevelUpXP(ctx),
		},
		GeneratedAt: now.UTC().Format("2006-01-02T15:04:05Z"),
	}, nil
}

func (s *AdminStatsService) GetLeaderboard(ctx context.Context, limit int) (*dto.AdminLeaderboardResponse, error) {
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
	total, err := s.userRepo.CountAll(ctx)
	if err != nil {
		return nil, err
	}

	data := make([]dto.AdminLeaderboardEntry, 0, len(users))
	for i := range users {
		u := users[i]
		data = append(data, dto.AdminLeaderboardEntry{
			Rank:       i + 1,
			BotUserID:  u.ID,
			TelegramID: u.TelegramID,
			Name:       botUserDisplayName(&u),
			Username:   strings.TrimSpace(u.Username),
			XP:         u.XP,
			Level:      u.Level,
		})
	}

	return &dto.AdminLeaderboardResponse{
		Data:  data,
		Total: total,
		Limit: limit,
	}, nil
}

func toActivityStats(s repository.ActivityStats) dto.AdminActivityStats {
	return dto.AdminActivityStats{
		TotalItems:   s.TotalItems,
		TotalEntries: s.TotalEntries,
		EntriesToday: s.EntriesToday,
	}
}

func round2(v float64) float64 {
	return float64(int64(v*100+0.5)) / 100
}
