package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/odatlar-bot/backend/internal/domain"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/pkg/telegram"
)

type HabitSummaryService struct {
	practiceRepo  *repository.PracticeRepository
	indicatorRepo *repository.IndicatorRepository
	botUserRepo   *repository.BotUserRepository
}

func NewHabitSummaryService(
	practiceRepo *repository.PracticeRepository,
	indicatorRepo *repository.IndicatorRepository,
	botUserRepo *repository.BotUserRepository,
) *HabitSummaryService {
	return &HabitSummaryService{
		practiceRepo:  practiceRepo,
		indicatorRepo: indicatorRepo,
		botUserRepo:   botUserRepo,
	}
}

func (s *HabitSummaryService) GetSummary(
	ctx context.Context,
	tgUser *telegram.WebAppUser,
	kind string,
) (*dto.HabitSummaryResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}

	switch strings.ToLower(kind) {
	case "indicator", "indikatorlar":
		return s.buildIndicatorSummary(ctx, botUser.ID)
	default:
		return s.buildPracticeSummary(ctx, botUser.ID)
	}
}

func (s *HabitSummaryService) buildPracticeSummary(
	ctx context.Context,
	botUserID int64,
) (*dto.HabitSummaryResponse, error) {
	today := todayDate()
	practices, completedMap, err := s.practiceRepo.ListByBotUserID(ctx, botUserID, today)
	if err != nil {
		return nil, err
	}

	completedToday := 0
	for _, p := range practices {
		if completedMap[p.ID] {
			completedToday++
		}
	}

	weekFrom := today.AddDate(0, 0, -6)
	completions, err := s.practiceRepo.ListCompletions(ctx, botUserID, weekFrom, today)
	if err != nil {
		return nil, err
	}

	completedByDate := make(map[string]map[int64]bool)
	for _, c := range completions {
		dateKey := c.Date.Format("2006-01-02")
		if completedByDate[dateKey] == nil {
			completedByDate[dateKey] = make(map[int64]bool)
		}
		completedByDate[dateKey][c.PracticeID] = true
	}

	week := buildPracticeWeekDays(practices, completedByDate, today)

	return &dto.HabitSummaryResponse{
		Completed: completedToday,
		Total:     len(practices),
		Percent:   dayCompletionRate(completedToday, len(practices)),
		Week:      week,
	}, nil
}

func (s *HabitSummaryService) buildIndicatorSummary(
	ctx context.Context,
	botUserID int64,
) (*dto.HabitSummaryResponse, error) {
	today := todayDate()
	indicators, err := s.indicatorRepo.ListByBotUserID(ctx, botUserID)
	if err != nil {
		return nil, err
	}

	weekFrom := today.AddDate(0, 0, -6)
	logs, err := s.indicatorRepo.ListLogs(ctx, botUserID, weekFrom, today)
	if err != nil {
		return nil, err
	}

	loggedByDate := make(map[string]map[int64]bool)
	loggedTodaySet := make(map[int64]bool)
	todayKey := today.Format("2006-01-02")
	for _, log := range logs {
		dateKey := log.Date.Format("2006-01-02")
		if loggedByDate[dateKey] == nil {
			loggedByDate[dateKey] = make(map[int64]bool)
		}
		loggedByDate[dateKey][log.IndicatorID] = true
		if dateKey == todayKey {
			loggedTodaySet[log.IndicatorID] = true
		}
	}

	week := buildIndicatorWeekDays(indicators, loggedByDate, today)

	return &dto.HabitSummaryResponse{
		Completed: len(loggedTodaySet),
		Total:     len(indicators),
		Percent:   dayCompletionRate(len(loggedTodaySet), len(indicators)),
		Week:      week,
	}, nil
}

func buildPracticeWeekDays(
	practices []domain.UserPractice,
	completedByDate map[string]map[int64]bool,
	today time.Time,
) []dto.HabitWeekDayResponse {
	week := make([]dto.HabitWeekDayResponse, 0, 7)
	for i := 6; i >= 0; i-- {
		date := today.AddDate(0, 0, -i)
		dateKey := date.Format("2006-01-02")

		active := 0
		completed := 0
		for _, p := range practices {
			if !habitActiveOnDate(p.CreatedAt, date) {
				continue
			}
			active++
			if completedByDate[dateKey][p.ID] {
				completed++
			}
		}

		week = append(week, dto.HabitWeekDayResponse{
			Date:    dateKey,
			Label:   weekdayLabel(date, today),
			Rate:    dayCompletionRate(completed, active),
			IsToday: dateKey == today.Format("2006-01-02"),
		})
	}
	return week
}

func buildIndicatorWeekDays(
	indicators []domain.UserIndicator,
	loggedByDate map[string]map[int64]bool,
	today time.Time,
) []dto.HabitWeekDayResponse {
	week := make([]dto.HabitWeekDayResponse, 0, 7)
	for i := 6; i >= 0; i-- {
		date := today.AddDate(0, 0, -i)
		dateKey := date.Format("2006-01-02")

		active := 0
		logged := 0
		for _, item := range indicators {
			if !habitActiveOnDate(item.CreatedAt, date) {
				continue
			}
			active++
			if loggedByDate[dateKey][item.ID] {
				logged++
			}
		}

		week = append(week, dto.HabitWeekDayResponse{
			Date:    dateKey,
			Label:   weekdayLabel(date, today),
			Rate:    dayCompletionRate(logged, active),
			IsToday: dateKey == today.Format("2006-01-02"),
		})
	}
	return week
}

func (s *HabitSummaryService) resolveBotUser(ctx context.Context, telegramID int64) (*domain.BotUser, error) {
	user, err := s.botUserRepo.GetByTelegramID(ctx, telegramID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRuntimeBotUserNotFound
		}
		return nil, err
	}
	return user, nil
}
