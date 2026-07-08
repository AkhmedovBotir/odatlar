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

type IndicatorService struct {
	indicatorRepo *repository.IndicatorRepository
	botUserRepo   *repository.BotUserRepository
	xp            *XPService
}

func NewIndicatorService(indicatorRepo *repository.IndicatorRepository, botUserRepo *repository.BotUserRepository, xp *XPService) *IndicatorService {
	return &IndicatorService{
		indicatorRepo: indicatorRepo,
		botUserRepo:   botUserRepo,
		xp:            xp,
	}
}

func (s *IndicatorService) List(ctx context.Context, tgUser *telegram.WebAppUser) (*dto.IndicatorListResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}

	indicators, err := s.indicatorRepo.ListByBotUserID(ctx, botUser.ID)
	if err != nil {
		return nil, err
	}

	data := make([]dto.IndicatorResponse, 0, len(indicators))
	for i := range indicators {
		data = append(data, toIndicatorResponse(&indicators[i]))
	}
	return &dto.IndicatorListResponse{Data: data}, nil
}

func (s *IndicatorService) Create(ctx context.Context, tgUser *telegram.WebAppUser, req dto.CreateIndicatorRequest) (*dto.IndicatorResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}

	indicator := &domain.UserIndicator{
		BotUserID: botUser.ID,
		Name:      strings.TrimSpace(req.Name),
		Benefits:  cleanBenefits(req.Benefits),
	}

	created, err := s.indicatorRepo.Create(ctx, indicator)
	if err != nil {
		return nil, err
	}

	resp := toIndicatorResponse(created)
	return &resp, nil
}

func (s *IndicatorService) Update(ctx context.Context, tgUser *telegram.WebAppUser, indicatorID int64, req dto.UpdateIndicatorRequest) (*dto.IndicatorResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}

	existing, err := s.indicatorRepo.GetByID(ctx, botUser.ID, indicatorID)
	if err != nil {
		return nil, err
	}

	existing.Name = strings.TrimSpace(req.Name)
	existing.Benefits = cleanBenefits(req.Benefits)

	updated, err := s.indicatorRepo.Update(ctx, existing)
	if err != nil {
		return nil, err
	}

	resp := toIndicatorResponse(updated)
	return &resp, nil
}

func (s *IndicatorService) Delete(ctx context.Context, tgUser *telegram.WebAppUser, indicatorID int64) error {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return err
	}
	return s.indicatorRepo.Delete(ctx, botUser.ID, indicatorID)
}

func (s *IndicatorService) Log(ctx context.Context, tgUser *telegram.WebAppUser, indicatorID int64, req dto.LogIndicatorRequest) (*dto.IndicatorResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}

	indicator, err := s.indicatorRepo.GetByID(ctx, botUser.ID, indicatorID)
	if err != nil {
		return nil, err
	}

	valueID := strings.TrimSpace(req.ValueID)
	valueLabel := strings.TrimSpace(req.ValueLabel)
	var numericValue *float64
	if !req.IsEmpty {
		if parsed, ok := parseIndicatorNumeric(valueID); ok {
			numericValue = &parsed
		}
	}

	today := todayDate()
	_, err = s.indicatorRepo.UpsertLog(ctx, &domain.IndicatorLog{
		IndicatorID:  indicator.ID,
		BotUserID:    botUser.ID,
		CompletedAt:  time.Now().UTC(),
		Date:         today,
		ValueID:      valueID,
		ValueLabel:   valueLabel,
		NumericValue: numericValue,
		IsEmpty:      req.IsEmpty,
	})
	if err != nil {
		return nil, err
	}

	var todayValue *string
	if valueID != "" {
		todayValue = &valueID
	}
	if err := s.indicatorRepo.SetTodayValue(ctx, botUser.ID, indicator.ID, todayValue); err != nil {
		return nil, err
	}

	var reward XPRewardResult
	if s.xp != nil && !req.IsEmpty {
		reward = s.xp.GrantIndicatorLog(ctx, botUser.ID)
	}

	indicator.TodayIndicatorValue = valueID
	resp := toIndicatorResponse(indicator)
	fillIndicatorXPReward(&resp, reward)
	return &resp, nil
}

func (s *IndicatorService) ListHistory(ctx context.Context, tgUser *telegram.WebAppUser, from, to string) (*dto.IndicatorHistoryResponse, error) {
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

	logs, err := s.indicatorRepo.ListLogs(ctx, botUser.ID, fromDate, toDate)
	if err != nil {
		return nil, err
	}

	indicators, err := s.indicatorRepo.ListByBotUserID(ctx, botUser.ID)
	if err != nil {
		return nil, err
	}
	nameByID := make(map[int64]string, len(indicators))
	for _, item := range indicators {
		nameByID[item.ID] = item.Name
	}

	data := make([]dto.IndicatorHistoryEntryResponse, 0, len(logs))
	for _, log := range logs {
		data = append(data, dto.IndicatorHistoryEntryResponse{
			ID:           strconv.FormatInt(log.ID, 10),
			HabitID:      strconv.FormatInt(log.IndicatorID, 10),
			HabitName:    nameByID[log.IndicatorID],
			Date:         log.Date.Format("2006-01-02"),
			CompletedAt:  log.CompletedAt.UTC().Format(time.RFC3339),
			Kind:         "indicator",
			ValueID:      log.ValueID,
			ValueLabel:   log.ValueLabel,
			NumericValue: log.NumericValue,
			IsEmpty:      log.IsEmpty,
		})
	}

	return &dto.IndicatorHistoryResponse{Data: data}, nil
}

func (s *IndicatorService) resolveBotUser(ctx context.Context, telegramID int64) (*domain.BotUser, error) {
	user, err := s.botUserRepo.GetByTelegramID(ctx, telegramID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRuntimeBotUserNotFound
		}
		return nil, err
	}
	return user, nil
}

func toIndicatorResponse(item *domain.UserIndicator) dto.IndicatorResponse {
	var todayValue *string
	if strings.TrimSpace(item.TodayIndicatorValue) != "" {
		v := item.TodayIndicatorValue
		todayValue = &v
	}

	return dto.IndicatorResponse{
		ID:                  strconv.FormatInt(item.ID, 10),
		Name:                item.Name,
		Benefits:            item.Benefits,
		Kind:                "indicator",
		CompletedToday:      false,
		Streak:              0,
		TodayIndicatorValue: todayValue,
		CreatedAt:           item.CreatedAt.In(tashkentTZ).Format("2006-01-02"),
	}
}

func parseIndicatorNumeric(valueID string) (float64, bool) {
	valueID = strings.TrimSpace(valueID)
	if valueID == "" || valueID == "skip" {
		return 0, false
	}

	if idx := strings.Index(valueID, ":"); idx > 0 {
		num, err := strconv.ParseFloat(valueID[:idx], 64)
		if err == nil {
			return num, true
		}
	}

	num, err := strconv.ParseFloat(valueID, 64)
	if err != nil {
		return 0, false
	}
	return num, true
}
