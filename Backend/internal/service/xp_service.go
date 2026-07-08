package service

import (
	"context"
	"log"

	"github.com/odatlar-bot/backend/internal/domain"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
)

// XPRewardResult is returned after granting or revoking XP so action responses
// can tell the client exactly what changed.
type XPRewardResult struct {
	Delta int
	XP    int
	Level int
}

// XPService manages admin-configurable XP rewards and grants XP to bot users
// when they complete actions in the Odatlar and Dominantalar sections.
type XPService struct {
	xpRepo      *repository.XPSettingsRepository
	botUserRepo *repository.BotUserRepository
}

func NewXPService(xpRepo *repository.XPSettingsRepository, botUserRepo *repository.BotUserRepository) *XPService {
	return &XPService{
		xpRepo:      xpRepo,
		botUserRepo: botUserRepo,
	}
}

func (s *XPService) GetSettings(ctx context.Context) (*dto.XPSettingsResponse, error) {
	settings, err := s.xpRepo.Get(ctx)
	if err != nil {
		return nil, err
	}
	resp := toXPSettingsResponse(settings)
	return &resp, nil
}

func (s *XPService) UpdateSettings(ctx context.Context, req dto.UpdateXPSettingsRequest) (*dto.XPSettingsResponse, error) {
	levelUpXP := req.LevelUpXP
	if levelUpXP < 1 {
		levelUpXP = 1
	}
	updated, err := s.xpRepo.Update(ctx, &domain.XPSettings{
		PracticeCompleteXP: req.PracticeCompleteXP,
		IndicatorLogXP:     req.IndicatorLogXP,
		DominantCreateXP:   req.DominantCreateXP,
		DominantSessionXP:  req.DominantSessionXP,
		LevelUpXP:          levelUpXP,
	})
	if err != nil {
		return nil, err
	}
	resp := toXPSettingsResponse(updated)
	return &resp, nil
}

func (s *XPService) LevelUpXP(ctx context.Context) int {
	settings, err := s.xpRepo.Get(ctx)
	if err != nil {
		return 1000
	}
	if settings.LevelUpXP < 1 {
		return 1
	}
	return settings.LevelUpXP
}

// grant reads the XP settings once, resolves the reward amount via pick, and
// applies it (positive or negative) to the user. Errors are logged but not
// surfaced so a settings hiccup never fails the user's core action.
func (s *XPService) grant(ctx context.Context, botUserID int64, sign int, pick func(*domain.XPSettings) int) XPRewardResult {
	settings, err := s.xpRepo.Get(ctx)
	if err != nil {
		log.Printf("xp grant: get settings: %v", err)
		return XPRewardResult{}
	}
	amount := sign * pick(settings)
	if amount == 0 {
		return XPRewardResult{}
	}
	xp, level, err := s.botUserRepo.AddXP(ctx, botUserID, amount, settings.LevelUpXP)
	if err != nil {
		log.Printf("xp grant: add xp: %v", err)
		return XPRewardResult{}
	}
	return XPRewardResult{Delta: amount, XP: xp, Level: level}
}

func (s *XPService) GrantPracticeComplete(ctx context.Context, botUserID int64) XPRewardResult {
	return s.grant(ctx, botUserID, 1, func(x *domain.XPSettings) int { return x.PracticeCompleteXP })
}

func (s *XPService) RevokePracticeComplete(ctx context.Context, botUserID int64) XPRewardResult {
	return s.grant(ctx, botUserID, -1, func(x *domain.XPSettings) int { return x.PracticeCompleteXP })
}

func (s *XPService) GrantIndicatorLog(ctx context.Context, botUserID int64) XPRewardResult {
	return s.grant(ctx, botUserID, 1, func(x *domain.XPSettings) int { return x.IndicatorLogXP })
}

func (s *XPService) GrantDominantCreate(ctx context.Context, botUserID int64) XPRewardResult {
	return s.grant(ctx, botUserID, 1, func(x *domain.XPSettings) int { return x.DominantCreateXP })
}

func (s *XPService) GrantDominantSession(ctx context.Context, botUserID int64) XPRewardResult {
	return s.grant(ctx, botUserID, 1, func(x *domain.XPSettings) int { return x.DominantSessionXP })
}

func fillPracticeXPReward(resp *dto.PracticeResponse, reward XPRewardResult) {
	if reward.Delta == 0 && reward.XP == 0 && reward.Level == 0 {
		return
	}
	resp.XPReward = reward.Delta
	resp.XP = reward.XP
	resp.Level = reward.Level
}

func fillIndicatorXPReward(resp *dto.IndicatorResponse, reward XPRewardResult) {
	if reward.Delta == 0 && reward.XP == 0 && reward.Level == 0 {
		return
	}
	resp.XPReward = reward.Delta
	resp.XP = reward.XP
	resp.Level = reward.Level
}

func fillDominantXPReward(resp *dto.DominantResponse, reward XPRewardResult) {
	if reward.Delta == 0 && reward.XP == 0 && reward.Level == 0 {
		return
	}
	resp.XPReward = reward.Delta
	resp.XP = reward.XP
	resp.Level = reward.Level
}

func toXPSettingsResponse(s *domain.XPSettings) dto.XPSettingsResponse {
	return dto.XPSettingsResponse{
		PracticeCompleteXP: s.PracticeCompleteXP,
		IndicatorLogXP:     s.IndicatorLogXP,
		DominantCreateXP:   s.DominantCreateXP,
		DominantSessionXP:  s.DominantSessionXP,
		LevelUpXP:          s.LevelUpXP,
		UpdatedAt:          s.UpdatedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
}
