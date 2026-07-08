package service

import (
	"context"
	"errors"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
)

var ErrMonitoringUserNotFound = errors.New("bot user not found")

type MonitoringService struct {
	monitoringRepo *repository.MonitoringRepository
	userRepo       *repository.BotUserRepository
	xp             *XPService
}

func NewMonitoringService(monitoringRepo *repository.MonitoringRepository, userRepo *repository.BotUserRepository, xp *XPService) *MonitoringService {
	return &MonitoringService{
		monitoringRepo: monitoringRepo,
		userRepo:       userRepo,
		xp:             xp,
	}
}

func (s *MonitoringService) GetUserMonitoring(ctx context.Context, botUserID int64) (*dto.UserMonitoringResponse, error) {
	user, err := s.userRepo.GetByID(ctx, botUserID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrMonitoringUserNotFound
		}
		return nil, err
	}

	now := time.Now().In(tashkentTZ)
	dayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, tashkentTZ)
	weekStartTS := dayStart.AddDate(0, 0, -6)
	today := dayStart
	weekStartDate := weekStartTS

	agg, err := s.monitoringRepo.GetAggregates(ctx, botUserID, today, weekStartDate, dayStart, weekStartTS)
	if err != nil {
		return nil, err
	}

	practices, err := s.monitoringRepo.ListPracticeStats(ctx, botUserID)
	if err != nil {
		return nil, err
	}
	indicators, err := s.monitoringRepo.ListIndicatorStats(ctx, botUserID)
	if err != nil {
		return nil, err
	}
	dominants, err := s.monitoringRepo.ListDominantStats(ctx, botUserID)
	if err != nil {
		return nil, err
	}

	activityRows, err := s.monitoringRepo.ListActivity(ctx, botUserID, weekStartTS.AddDate(0, 0, -23), now, 30)
	if err != nil {
		return nil, err
	}

	rank, err := s.userRepo.GetRankByXP(ctx, botUserID)
	if err != nil {
		return nil, err
	}

	levelUpXP := s.xp.LevelUpXP(ctx)
	daysSinceStart := int(now.Sub(user.StartedAt).Hours() / 24)
	if daysSinceStart < 0 {
		daysSinceStart = 0
	}

	resp := &dto.UserMonitoringResponse{
		User: toBotUserResponse(user, levelUpXP),
		Summary: dto.UserMonitoringSummary{
			Rank:           rank,
			XP:             user.XP,
			Level:          user.Level,
			LevelUpXP:      levelUpXP,
			DaysSinceStart: daysSinceStart,

			PracticeCount:            agg.PracticeCount,
			PracticeCompletionsTotal: agg.PracticeCompletionsTotal,
			PracticeCompletionsToday: agg.PracticeCompletionsToday,
			PracticeCompletionsWeek:  agg.PracticeCompletionsWeek,
			BestStreak:               agg.BestStreak,

			IndicatorCount:     agg.IndicatorCount,
			IndicatorLogsTotal: agg.IndicatorLogsTotal,
			IndicatorLogsToday: agg.IndicatorLogsToday,
			IndicatorLogsWeek:  agg.IndicatorLogsWeek,

			DominantCount:         agg.DominantCount,
			DominantSessionsTotal: agg.DominantSessionsTotal,
			DominantSessionsToday: agg.DominantSessionsToday,
			DominantSessionsWeek:  agg.DominantSessionsWeek,
		},
		Practices:   toMonitoredPractices(practices),
		Indicators:  toMonitoredIndicators(indicators),
		Dominants:   toMonitoredDominants(dominants),
		Activity:    toActivityEntries(activityRows),
		GeneratedAt: now.UTC().Format(time.RFC3339),
	}
	return resp, nil
}

func (s *MonitoringService) GetUserActivity(ctx context.Context, botUserID int64, from, to time.Time, limit int) (*dto.UserActivityResponse, error) {
	if _, err := s.userRepo.GetByID(ctx, botUserID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrMonitoringUserNotFound
		}
		return nil, err
	}

	if from.After(to) {
		from, to = to, from
	}
	if limit < 1 {
		limit = 50
	}
	if limit > 500 {
		limit = 500
	}

	rows, err := s.monitoringRepo.ListActivity(ctx, botUserID, from, to, limit)
	if err != nil {
		return nil, err
	}

	return &dto.UserActivityResponse{
		Data:  toActivityEntries(rows),
		Limit: limit,
		From:  from.UTC().Format(time.RFC3339),
		To:    to.UTC().Format(time.RFC3339),
	}, nil
}

func toMonitoredPractices(rows []repository.MonitoredPracticeRow) []dto.MonitoredPractice {
	out := make([]dto.MonitoredPractice, 0, len(rows))
	for _, r := range rows {
		out = append(out, dto.MonitoredPractice{
			ID:               strconv.FormatInt(r.ID, 10),
			Name:             r.Name,
			Streak:           r.Streak,
			CompletionsTotal: r.CompletionsTotal,
			LastCompletedAt:  formatTimePtr(r.LastCompletedAt),
			CreatedAt:        r.CreatedAt.In(tashkentTZ).Format("2006-01-02"),
		})
	}
	return out
}

func toMonitoredIndicators(rows []repository.MonitoredIndicatorRow) []dto.MonitoredIndicator {
	out := make([]dto.MonitoredIndicator, 0, len(rows))
	for _, r := range rows {
		label := ""
		if r.LastValueLabel != nil {
			label = *r.LastValueLabel
		}
		out = append(out, dto.MonitoredIndicator{
			ID:             strconv.FormatInt(r.ID, 10),
			Name:           r.Name,
			LogsTotal:      r.LogsTotal,
			LastValueLabel: label,
			LastLoggedAt:   formatTimePtr(r.LastLoggedAt),
			CreatedAt:      r.CreatedAt.In(tashkentTZ).Format("2006-01-02"),
		})
	}
	return out
}

func toMonitoredDominants(rows []repository.MonitoredDominantRow) []dto.MonitoredDominant {
	out := make([]dto.MonitoredDominant, 0, len(rows))
	for _, r := range rows {
		out = append(out, dto.MonitoredDominant{
			ID:                strconv.FormatInt(r.ID, 10),
			Title:             r.Title,
			Type:              r.Type,
			SessionsCompleted: r.SessionsCompleted,
			LastSessionAt:     formatTimePtr(r.LastSessionAt),
			CreatedAt:         r.CreatedAt.In(tashkentTZ).Format("2006-01-02"),
		})
	}
	return out
}

func toActivityEntries(rows []repository.ActivityRow) []dto.UserActivityEntry {
	out := make([]dto.UserActivityEntry, 0, len(rows))
	for _, r := range rows {
		out = append(out, dto.UserActivityEntry{
			Kind:   r.Kind,
			Title:  r.Title,
			Detail: r.Detail,
			At:     r.At.UTC().Format(time.RFC3339),
		})
	}
	return out
}

func formatTimePtr(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}
