package service

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/odatlar-bot/backend/internal/domain"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/pkg/telegram"
)

const dominantTypeInfo = "ma'lumot"

type DominantService struct {
	dominantRepo *repository.DominantRepository
	botUserRepo  *repository.BotUserRepository
	xp           *XPService
}

func NewDominantService(dominantRepo *repository.DominantRepository, botUserRepo *repository.BotUserRepository, xp *XPService) *DominantService {
	return &DominantService{
		dominantRepo: dominantRepo,
		botUserRepo:  botUserRepo,
		xp:           xp,
	}
}

func (s *DominantService) List(ctx context.Context, tgUser *telegram.WebAppUser) (*dto.DominantListResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}

	dominants, err := s.dominantRepo.ListByBotUserID(ctx, botUser.ID)
	if err != nil {
		return nil, err
	}

	data := make([]dto.DominantResponse, 0, len(dominants))
	for i := range dominants {
		data = append(data, toDominantResponse(&dominants[i]))
	}
	return &dto.DominantListResponse{Data: data}, nil
}

func (s *DominantService) Create(ctx context.Context, tgUser *telegram.WebAppUser, req dto.CreateDominantRequest) (*dto.DominantResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}

	pros := []string{}
	cons := []string{}
	notes := ""
	if req.Type == dominantTypeInfo {
		notes = strings.TrimSpace(req.Notes)
	} else {
		pros = cleanBenefits(req.Pros)
		cons = cleanBenefits(req.Cons)
	}

	dominant := &domain.UserDominant{
		BotUserID:         botUser.ID,
		Title:             strings.TrimSpace(req.Title),
		Type:              req.Type,
		Cue:               strings.TrimSpace(req.Cue),
		Reward:            strings.TrimSpace(req.Reward),
		Pros:              pros,
		Cons:              cons,
		Notes:             notes,
		SessionsCompleted: 1,
	}

	created, err := s.dominantRepo.Create(ctx, dominant)
	if err != nil {
		return nil, err
	}

	_ = s.dominantRepo.AddSession(ctx, &domain.DominantSession{
		DominantID:  created.ID,
		BotUserID:   botUser.ID,
		Type:        req.Type,
		CompletedAt: time.Now(),
	})

	var reward XPRewardResult
	if s.xp != nil {
		reward = s.xp.GrantDominantCreate(ctx, botUser.ID)
	}

	resp := toDominantResponse(created)
	fillDominantXPReward(&resp, reward)
	return &resp, nil
}

func (s *DominantService) Update(ctx context.Context, tgUser *telegram.WebAppUser, dominantID int64, req dto.UpdateDominantRequest) (*dto.DominantResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}

	existing, err := s.dominantRepo.GetByID(ctx, botUser.ID, dominantID)
	if err != nil {
		return nil, err
	}

	existing.Title = strings.TrimSpace(req.Title)
	existing.Cue = strings.TrimSpace(req.Cue)
	existing.Reward = strings.TrimSpace(req.Reward)

	updated, err := s.dominantRepo.Update(ctx, existing)
	if err != nil {
		return nil, err
	}

	resp := toDominantResponse(updated)
	return &resp, nil
}

func (s *DominantService) Delete(ctx context.Context, tgUser *telegram.WebAppUser, dominantID int64) error {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return err
	}
	return s.dominantRepo.Delete(ctx, botUser.ID, dominantID)
}

func (s *DominantService) CompleteSession(ctx context.Context, tgUser *telegram.WebAppUser, dominantID int64, req dto.CompleteDominantSessionRequest) (*dto.DominantResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}

	existing, err := s.dominantRepo.GetByID(ctx, botUser.ID, dominantID)
	if err != nil {
		return nil, err
	}

	existing.SessionsCompleted++
	if req.Type == dominantTypeInfo {
		if notes := strings.TrimSpace(req.Notes); notes != "" {
			existing.Notes = notes
		}
	} else {
		existing.Pros = append(existing.Pros, cleanBenefits(req.Pros)...)
		existing.Cons = append(existing.Cons, cleanBenefits(req.Cons)...)
	}

	updated, err := s.dominantRepo.Update(ctx, existing)
	if err != nil {
		return nil, err
	}

	_ = s.dominantRepo.AddSession(ctx, &domain.DominantSession{
		DominantID:  updated.ID,
		BotUserID:   botUser.ID,
		Type:        req.Type,
		CompletedAt: time.Now(),
	})

	var reward XPRewardResult
	if s.xp != nil {
		reward = s.xp.GrantDominantSession(ctx, botUser.ID)
	}

	resp := toDominantResponse(updated)
	fillDominantXPReward(&resp, reward)
	return &resp, nil
}

func (s *DominantService) resolveBotUser(ctx context.Context, telegramID int64) (*domain.BotUser, error) {
	user, err := s.botUserRepo.GetByTelegramID(ctx, telegramID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRuntimeBotUserNotFound
		}
		return nil, err
	}
	return user, nil
}

func toDominantResponse(d *domain.UserDominant) dto.DominantResponse {
	pros := d.Pros
	if pros == nil {
		pros = []string{}
	}
	cons := d.Cons
	if cons == nil {
		cons = []string{}
	}
	return dto.DominantResponse{
		ID:                strconv.FormatInt(d.ID, 10),
		Title:             d.Title,
		Type:              d.Type,
		Cue:               d.Cue,
		Reward:            d.Reward,
		Pros:              pros,
		Cons:              cons,
		Notes:             d.Notes,
		SessionsCompleted: d.SessionsCompleted,
		CreatedAt:         d.CreatedAt.In(tashkentTZ).Format("2006-01-02"),
	}
}
