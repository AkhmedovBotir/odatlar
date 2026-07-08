package service

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/odatlar-bot/backend/internal/domain"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/pkg/telegram"
)

var tashkentTZ = time.FixedZone("Asia/Tashkent", 5*60*60)

type PracticeService struct {
	practiceRepo *repository.PracticeRepository
	botUserRepo  *repository.BotUserRepository
	xp           *XPService
}

func NewPracticeService(practiceRepo *repository.PracticeRepository, botUserRepo *repository.BotUserRepository, xp *XPService) *PracticeService {
	return &PracticeService{
		practiceRepo: practiceRepo,
		botUserRepo:  botUserRepo,
		xp:           xp,
	}
}

func (s *PracticeService) List(ctx context.Context, tgUser *telegram.WebAppUser) (*dto.PracticeListResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}

	today := todayDate()
	practices, completedMap, err := s.practiceRepo.ListByBotUserID(ctx, botUser.ID, today)
	if err != nil {
		return nil, err
	}

	data := make([]dto.PracticeResponse, 0, len(practices))
	for i := range practices {
		data = append(data, toPracticeResponse(&practices[i], completedMap[practices[i].ID]))
	}

	return &dto.PracticeListResponse{Data: data}, nil
}

func (s *PracticeService) Create(ctx context.Context, tgUser *telegram.WebAppUser, req dto.CreatePracticeRequest) (*dto.PracticeResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}

	practice := &domain.UserPractice{
		BotUserID: botUser.ID,
		Name:      strings.TrimSpace(req.Name),
		Benefits:  cleanBenefits(req.Benefits),
		Streak:    0,
	}

	created, err := s.practiceRepo.Create(ctx, practice)
	if err != nil {
		return nil, err
	}

	resp := toPracticeResponse(created, false)
	return &resp, nil
}

func (s *PracticeService) Update(ctx context.Context, tgUser *telegram.WebAppUser, practiceID int64, req dto.UpdatePracticeRequest) (*dto.PracticeResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}

	existing, err := s.practiceRepo.GetByID(ctx, botUser.ID, practiceID)
	if err != nil {
		return nil, err
	}

	existing.Name = strings.TrimSpace(req.Name)
	existing.Benefits = cleanBenefits(req.Benefits)

	updated, err := s.practiceRepo.Update(ctx, existing)
	if err != nil {
		return nil, err
	}

	completed, err := s.practiceRepo.IsCompletedToday(ctx, updated.ID, todayDate())
	if err != nil {
		return nil, err
	}

	resp := toPracticeResponse(updated, completed)
	return &resp, nil
}

func (s *PracticeService) Delete(ctx context.Context, tgUser *telegram.WebAppUser, practiceID int64) error {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return err
	}
	return s.practiceRepo.Delete(ctx, botUser.ID, practiceID)
}

func (s *PracticeService) Toggle(ctx context.Context, tgUser *telegram.WebAppUser, practiceID int64) (*dto.PracticeResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}

	practice, err := s.practiceRepo.GetByID(ctx, botUser.ID, practiceID)
	if err != nil {
		return nil, err
	}

	today := todayDate()
	completed, err := s.practiceRepo.IsCompletedToday(ctx, practice.ID, today)
	if err != nil {
		return nil, err
	}

	if completed {
		if err := s.practiceRepo.RemoveCompletionToday(ctx, practice.ID, today); err != nil {
			return nil, err
		}
		newStreak := practice.Streak - 1
		if newStreak < 0 {
			newStreak = 0
		}
		if err := s.practiceRepo.UpdateStreak(ctx, botUser.ID, practice.ID, newStreak); err != nil {
			return nil, err
		}
		practice.Streak = newStreak
		if s.xp != nil {
			reward := s.xp.RevokePracticeComplete(ctx, botUser.ID)
			resp := toPracticeResponse(practice, false)
			fillPracticeXPReward(&resp, reward)
			return &resp, nil
		}
		resp := toPracticeResponse(practice, false)
		return &resp, nil
	}

	_, err = s.practiceRepo.AddCompletion(ctx, &domain.PracticeCompletion{
		PracticeID:  practice.ID,
		BotUserID:   botUser.ID,
		CompletedAt: time.Now().UTC(),
		Date:        today,
	})
	if err != nil {
		return nil, err
	}

	newStreak := practice.Streak + 1
	if err := s.practiceRepo.UpdateStreak(ctx, botUser.ID, practice.ID, newStreak); err != nil {
		return nil, err
	}
	practice.Streak = newStreak

	var reward XPRewardResult
	if s.xp != nil {
		reward = s.xp.GrantPracticeComplete(ctx, botUser.ID)
	}

	resp := toPracticeResponse(practice, true)
	fillPracticeXPReward(&resp, reward)
	return &resp, nil
}

func (s *PracticeService) ListHistory(ctx context.Context, tgUser *telegram.WebAppUser, from, to string) (*dto.PracticeHistoryResponse, error) {
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

	completions, err := s.practiceRepo.ListCompletions(ctx, botUser.ID, fromDate, toDate)
	if err != nil {
		return nil, err
	}

	practices, _, err := s.practiceRepo.ListByBotUserID(ctx, botUser.ID, todayDate())
	if err != nil {
		return nil, err
	}
	nameByID := make(map[int64]string, len(practices))
	for _, p := range practices {
		nameByID[p.ID] = p.Name
	}

	data := make([]dto.PracticeHistoryEntryResponse, 0, len(completions))
	for _, c := range completions {
		data = append(data, dto.PracticeHistoryEntryResponse{
			ID:          strconv.FormatInt(c.ID, 10),
			HabitID:     strconv.FormatInt(c.PracticeID, 10),
			HabitName:   nameByID[c.PracticeID],
			Date:        c.Date.Format("2006-01-02"),
			CompletedAt: c.CompletedAt.UTC().Format(time.RFC3339),
			Kind:        "practice",
		})
	}

	return &dto.PracticeHistoryResponse{Data: data}, nil
}

func (s *PracticeService) resolveBotUser(ctx context.Context, telegramID int64) (*domain.BotUser, error) {
	user, err := s.botUserRepo.GetByTelegramID(ctx, telegramID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRuntimeBotUserNotFound
		}
		return nil, err
	}
	return user, nil
}

func toPracticeResponse(p *domain.UserPractice, completedToday bool) dto.PracticeResponse {
	return dto.PracticeResponse{
		ID:             strconv.FormatInt(p.ID, 10),
		Name:           p.Name,
		Benefits:       p.Benefits,
		Kind:           "practice",
		CompletedToday: completedToday,
		Streak:         p.Streak,
		CreatedAt:      p.CreatedAt.In(tashkentTZ).Format("2006-01-02"),
	}
}

func cleanBenefits(items []string) []string {
	out := make([]string, 0, len(items))
	for _, item := range items {
		v := strings.TrimSpace(item)
		if v != "" {
			out = append(out, v)
		}
	}
	return out
}

func todayDate() time.Time {
	now := time.Now().In(tashkentTZ)
	y, m, d := now.Date()
	return time.Date(y, m, d, 0, 0, 0, 0, tashkentTZ)
}

func parseDateKey(value string) (time.Time, error) {
	t, err := time.ParseInLocation("2006-01-02", strings.TrimSpace(value), tashkentTZ)
	if err != nil {
		return time.Time{}, err
	}
	return t, nil
}
