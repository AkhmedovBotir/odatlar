package service

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/odatlar-bot/backend/internal/domain"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/pkg/telegram"
)

type ArchiveService struct {
	practiceRepo  *repository.PracticeRepository
	indicatorRepo *repository.IndicatorRepository
	botUserRepo   *repository.BotUserRepository
}

func NewArchiveService(
	practiceRepo *repository.PracticeRepository,
	indicatorRepo *repository.IndicatorRepository,
	botUserRepo *repository.BotUserRepository,
) *ArchiveService {
	return &ArchiveService{
		practiceRepo:  practiceRepo,
		indicatorRepo: indicatorRepo,
		botUserRepo:   botUserRepo,
	}
}

func (s *ArchiveService) GetArchive(
	ctx context.Context,
	tgUser *telegram.WebAppUser,
	kind, from, to string,
) (*dto.ArchiveResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}

	fromDate, err := parseDateKey(from)
	if err != nil {
		return nil, fmt.Errorf("invalid from date")
	}
	toDate, err := parseDateKey(to)
	if err != nil {
		return nil, fmt.Errorf("invalid to date")
	}
	if fromDate.After(toDate) {
		fromDate, toDate = toDate, fromDate
	}

	dates := dateKeysBetween(fromDate, toDate)
	sort.Slice(dates, func(i, j int) bool { return dates[i].After(dates[j]) })

	switch strings.ToLower(kind) {
	case "indicator", "indikatorlar":
		return s.buildIndicatorArchive(ctx, botUser.ID, dates)
	default:
		return s.buildPracticeArchive(ctx, botUser.ID, dates)
	}
}

func (s *ArchiveService) buildPracticeArchive(
	ctx context.Context,
	botUserID int64,
	dates []time.Time,
) (*dto.ArchiveResponse, error) {
	practices, _, err := s.practiceRepo.ListByBotUserID(ctx, botUserID, todayDate())
	if err != nil {
		return nil, err
	}
	if len(practices) == 0 || len(dates) == 0 {
		return emptyArchiveResponse(), nil
	}

	from := dates[len(dates)-1]
	to := dates[0]
	completions, err := s.practiceRepo.ListCompletions(ctx, botUserID, from, to)
	if err != nil {
		return nil, err
	}

	completedByDate := make(map[string][]dto.ArchiveDayItemResponse)
	for _, completion := range completions {
		dateKey := completion.Date.Format("2006-01-02")
		completedAt := completion.CompletedAt.UTC().Format(time.RFC3339)
		completedByDate[dateKey] = append(completedByDate[dateKey], dto.ArchiveDayItemResponse{
			ID:          strconv.FormatInt(completion.ID, 10),
			HabitID:     strconv.FormatInt(completion.PracticeID, 10),
			HabitName:   practiceNameByID(practices, completion.PracticeID),
			Status:      "completed",
			CompletedAt: &completedAt,
			Date:        dateKey,
			Kind:        "practice",
		})
	}

	return buildArchiveDaysResponse(dates, practicesAsHabits(practices), completedByDate, "practice"), nil
}

func (s *ArchiveService) buildIndicatorArchive(
	ctx context.Context,
	botUserID int64,
	dates []time.Time,
) (*dto.ArchiveResponse, error) {
	indicators, err := s.indicatorRepo.ListByBotUserID(ctx, botUserID)
	if err != nil {
		return nil, err
	}
	if len(indicators) == 0 || len(dates) == 0 {
		return emptyArchiveResponse(), nil
	}

	from := dates[len(dates)-1]
	to := dates[0]
	logs, err := s.indicatorRepo.ListLogs(ctx, botUserID, from, to)
	if err != nil {
		return nil, err
	}

	completedByDate := make(map[string][]dto.ArchiveDayItemResponse)
	for _, log := range logs {
		dateKey := log.Date.Format("2006-01-02")
		completedAt := log.CompletedAt.UTC().Format(time.RFC3339)
		label := log.ValueLabel
		completedByDate[dateKey] = append(completedByDate[dateKey], dto.ArchiveDayItemResponse{
			ID:          strconv.FormatInt(log.ID, 10),
			HabitID:     strconv.FormatInt(log.IndicatorID, 10),
			HabitName:   indicatorNameByID(indicators, log.IndicatorID),
			Status:      "completed",
			CompletedAt: &completedAt,
			Date:        dateKey,
			Kind:        "indicator",
			ValueLabel:  &label,
		})
	}

	return buildArchiveDaysResponse(dates, indicatorsAsHabits(indicators), completedByDate, "indicator"), nil
}

type archiveHabit struct {
	ID        int64
	Name      string
	CreatedAt time.Time
}

func buildArchiveDaysResponse(
	dates []time.Time,
	habits []archiveHabit,
	completedByDate map[string][]dto.ArchiveDayItemResponse,
	kind string,
) *dto.ArchiveResponse {
	days := make([]dto.ArchiveDayResponse, 0, len(dates))
	completedCount := 0
	missedCount := 0

	for _, date := range dates {
		dateKey := date.Format("2006-01-02")
		completedItems := completedByDate[dateKey]
		if completedItems == nil {
			completedItems = []dto.ArchiveDayItemResponse{}
		}

		activeHabits := make([]archiveHabit, 0, len(habits))
		for _, habit := range habits {
			if habitActiveOnDate(habit.CreatedAt, date) {
				activeHabits = append(activeHabits, habit)
			}
		}
		if len(activeHabits) == 0 {
			continue
		}

		activeIDs := make(map[int64]bool, len(activeHabits))
		for _, habit := range activeHabits {
			activeIDs[habit.ID] = true
		}

		filteredCompleted := make([]dto.ArchiveDayItemResponse, 0, len(completedItems))
		for _, item := range completedItems {
			id, _ := strconv.ParseInt(item.HabitID, 10, 64)
			if activeIDs[id] {
				filteredCompleted = append(filteredCompleted, item)
			}
		}
		completedItems = filteredCompleted

		loggedIDs := make(map[int64]bool, len(completedItems))
		for _, item := range completedItems {
			id, _ := strconv.ParseInt(item.HabitID, 10, 64)
			loggedIDs[id] = true
		}

		missedItems := make([]dto.ArchiveDayItemResponse, 0)
		for _, habit := range activeHabits {
			if loggedIDs[habit.ID] {
				continue
			}
			item := dto.ArchiveDayItemResponse{
				ID:        fmt.Sprintf("missed_%d_%s", habit.ID, dateKey),
				HabitID:   strconv.FormatInt(habit.ID, 10),
				HabitName: habit.Name,
				Status:    "missed",
				Date:      dateKey,
				Kind:      kind,
			}
			if kind == "indicator" {
				label := "Kiritilmagan"
				item.ValueLabel = &label
			}
			missedItems = append(missedItems, item)
		}

		sort.Slice(completedItems, func(i, j int) bool {
			if completedItems[i].CompletedAt == nil || completedItems[j].CompletedAt == nil {
				return false
			}
			return *completedItems[i].CompletedAt > *completedItems[j].CompletedAt
		})
		sort.Slice(missedItems, func(i, j int) bool {
			return missedItems[i].HabitName < missedItems[j].HabitName
		})

		items := append(completedItems, missedItems...)
		completedCount += len(completedItems)
		missedCount += len(missedItems)

		days = append(days, dto.ArchiveDayResponse{
			Date:  dateKey,
			Items: items,
		})
	}

	return &dto.ArchiveResponse{
		Days:           days,
		CompletedCount: completedCount,
		MissedCount:    missedCount,
	}
}

func emptyArchiveResponse() *dto.ArchiveResponse {
	return &dto.ArchiveResponse{
		Days:           []dto.ArchiveDayResponse{},
		CompletedCount: 0,
		MissedCount:    0,
	}
}

func dateKeysBetween(from, to time.Time) []time.Time {
	var dates []time.Time
	cursor := from
	for !cursor.After(to) {
		dates = append(dates, cursor)
		cursor = cursor.AddDate(0, 0, 1)
	}
	return dates
}

func practicesAsHabits(practices []domain.UserPractice) []archiveHabit {
	out := make([]archiveHabit, 0, len(practices))
	for _, p := range practices {
		out = append(out, archiveHabit{ID: p.ID, Name: p.Name, CreatedAt: p.CreatedAt})
	}
	return out
}

func indicatorsAsHabits(indicators []domain.UserIndicator) []archiveHabit {
	out := make([]archiveHabit, 0, len(indicators))
	for _, i := range indicators {
		out = append(out, archiveHabit{ID: i.ID, Name: i.Name, CreatedAt: i.CreatedAt})
	}
	return out
}

func practiceNameByID(practices []domain.UserPractice, id int64) string {
	for _, p := range practices {
		if p.ID == id {
			return p.Name
		}
	}
	return ""
}

func indicatorNameByID(indicators []domain.UserIndicator, id int64) string {
	for _, i := range indicators {
		if i.ID == id {
			return i.Name
		}
	}
	return ""
}

func (s *ArchiveService) resolveBotUser(ctx context.Context, telegramID int64) (*domain.BotUser, error) {
	user, err := s.botUserRepo.GetByTelegramID(ctx, telegramID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRuntimeBotUserNotFound
		}
		return nil, err
	}
	return user, nil
}
