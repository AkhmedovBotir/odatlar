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
	"github.com/odatlar-bot/backend/pkg/upload"
)

var (
	ErrInvalidVideoSrc   = errors.New("invalid video src")
	ErrInvalidPosterPath = errors.New("invalid poster path")
)

type GuideVideoService struct {
	videoRepo   *repository.GuideVideoRepository
	botUserRepo *repository.BotUserRepository
	uploads     *upload.Storage
}

func NewGuideVideoService(videoRepo *repository.GuideVideoRepository, botUserRepo *repository.BotUserRepository, uploads *upload.Storage) *GuideVideoService {
	return &GuideVideoService{
		videoRepo:   videoRepo,
		botUserRepo: botUserRepo,
		uploads:     uploads,
	}
}

func (s *GuideVideoService) AdminList(ctx context.Context) (*dto.GuideVideoListResponse, error) {
	videos, err := s.videoRepo.ListAll(ctx)
	if err != nil {
		return nil, err
	}
	data := make([]dto.GuideVideoResponse, 0, len(videos))
	for i := range videos {
		item, err := s.toAdminResponse(ctx, &videos[i])
		if err != nil {
			return nil, err
		}
		data = append(data, item)
	}
	return &dto.GuideVideoListResponse{Data: data}, nil
}

func (s *GuideVideoService) AdminGet(ctx context.Context, id int64) (*dto.GuideVideoResponse, error) {
	v, err := s.videoRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	item, err := s.toAdminResponse(ctx, v)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (s *GuideVideoService) AdminCreate(ctx context.Context, req dto.CreateGuideVideoRequest) (*dto.GuideVideoResponse, error) {
	if err := validateGuideVideoInput(req.Src, req.Poster); err != nil {
		return nil, err
	}
	published := true
	if req.IsPublished != nil {
		published = *req.IsPublished
	}
	created, err := s.videoRepo.Create(ctx, &domain.GuideVideo{
		Title:       strings.TrimSpace(req.Title),
		Description: strings.TrimSpace(req.Description),
		Src:         strings.TrimSpace(req.Src),
		Poster:      strings.TrimSpace(req.Poster),
		DurationMin: req.DurationMin,
		SortOrder:   req.SortOrder,
		IsPublished: published,
	})
	if err != nil {
		return nil, err
	}
	item, err := s.toAdminResponse(ctx, created)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (s *GuideVideoService) AdminUpdate(ctx context.Context, id int64, req dto.UpdateGuideVideoRequest) (*dto.GuideVideoResponse, error) {
	if err := validateGuideVideoInput(req.Src, req.Poster); err != nil {
		return nil, err
	}
	existing, err := s.videoRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	updated, err := s.videoRepo.Update(ctx, &domain.GuideVideo{
		ID:          id,
		Title:       strings.TrimSpace(req.Title),
		Description: strings.TrimSpace(req.Description),
		Src:         strings.TrimSpace(req.Src),
		Poster:      strings.TrimSpace(req.Poster),
		DurationMin: req.DurationMin,
		SortOrder:   req.SortOrder,
		IsPublished: req.IsPublished,
	})
	if err != nil {
		return nil, err
	}
	s.cleanupReplacedUploads(existing.Src, req.Src, existing.Poster, req.Poster)
	item, err := s.toAdminResponse(ctx, updated)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (s *GuideVideoService) AdminDelete(ctx context.Context, id int64) error {
	existing, err := s.videoRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.videoRepo.Delete(ctx, id); err != nil {
		return err
	}
	if s.uploads != nil {
		_ = upload.DeleteLocalFile(s.uploads.RootDir(), existing.Src)
		_ = upload.DeleteLocalFile(s.uploads.RootDir(), existing.Poster)
	}
	return nil
}

func (s *GuideVideoService) ListPublished(ctx context.Context, tgUser *telegram.WebAppUser) (*dto.GuideVideoListResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}
	videos, err := s.videoRepo.ListPublished(ctx)
	if err != nil {
		return nil, err
	}
	data := make([]dto.GuideVideoResponse, 0, len(videos))
	for i := range videos {
		item, err := s.toUserResponse(ctx, &videos[i], botUser.ID)
		if err != nil {
			return nil, err
		}
		data = append(data, item)
	}
	return &dto.GuideVideoListResponse{Data: data}, nil
}

func (s *GuideVideoService) GetPublished(ctx context.Context, tgUser *telegram.WebAppUser, id int64) (*dto.GuideVideoResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}
	v, err := s.videoRepo.GetPublishedByID(ctx, id)
	if err != nil {
		return nil, err
	}
	item, err := s.toUserResponse(ctx, v, botUser.ID)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (s *GuideVideoService) ToggleLike(ctx context.Context, tgUser *telegram.WebAppUser, id int64) (*dto.GuideVideoLikeResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}
	if _, err := s.videoRepo.GetPublishedByID(ctx, id); err != nil {
		return nil, err
	}
	liked, err := s.videoRepo.ToggleLike(ctx, id, botUser.ID)
	if err != nil {
		return nil, err
	}
	count, err := s.videoRepo.CountLikes(ctx, id)
	if err != nil {
		return nil, err
	}
	return &dto.GuideVideoLikeResponse{LikedByMe: liked, LikesCount: count}, nil
}

func (s *GuideVideoService) ListComments(ctx context.Context, tgUser *telegram.WebAppUser, id int64) (*dto.GuideVideoCommentListResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}
	if _, err := s.videoRepo.GetPublishedByID(ctx, id); err != nil {
		return nil, err
	}
	comments, err := s.videoRepo.ListComments(ctx, id)
	if err != nil {
		return nil, err
	}
	data := make([]dto.GuideVideoCommentResponse, 0, len(comments))
	for i := range comments {
		data = append(data, toCommentResponse(&comments[i], botUser.ID))
	}
	return &dto.GuideVideoCommentListResponse{Data: data}, nil
}

func (s *GuideVideoService) AddComment(ctx context.Context, tgUser *telegram.WebAppUser, id int64, req dto.CreateGuideVideoCommentRequest) (*dto.GuideVideoCommentResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}
	if _, err := s.videoRepo.GetPublishedByID(ctx, id); err != nil {
		return nil, err
	}
	comment, err := s.videoRepo.AddComment(ctx, id, botUser.ID, strings.TrimSpace(req.Text))
	if err != nil {
		return nil, err
	}
	resp := toCommentResponse(comment, botUser.ID)
	return &resp, nil
}

func (s *GuideVideoService) resolveBotUser(ctx context.Context, telegramID int64) (*domain.BotUser, error) {
	user, err := s.botUserRepo.GetByTelegramID(ctx, telegramID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRuntimeBotUserNotFound
		}
		return nil, fmt.Errorf("get bot user: %w", err)
	}
	return user, nil
}

func (s *GuideVideoService) toAdminResponse(ctx context.Context, v *domain.GuideVideo) (dto.GuideVideoResponse, error) {
	likes, err := s.videoRepo.CountLikes(ctx, v.ID)
	if err != nil {
		return dto.GuideVideoResponse{}, err
	}
	comments, err := s.videoRepo.CountComments(ctx, v.ID)
	if err != nil {
		return dto.GuideVideoResponse{}, err
	}
	return dto.GuideVideoResponse{
		ID:            strconv.FormatInt(v.ID, 10),
		Title:         v.Title,
		Description:   v.Description,
		Src:           v.Src,
		Poster:        v.Poster,
		DurationMin:   v.DurationMin,
		SortOrder:     v.SortOrder,
		IsPublished:   v.IsPublished,
		LikesCount:    likes,
		CommentsCount: comments,
		CreatedAt:     v.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:     v.UpdatedAt.UTC().Format(time.RFC3339),
	}, nil
}

func (s *GuideVideoService) toUserResponse(ctx context.Context, v *domain.GuideVideo, botUserID int64) (dto.GuideVideoResponse, error) {
	likes, err := s.videoRepo.CountLikes(ctx, v.ID)
	if err != nil {
		return dto.GuideVideoResponse{}, err
	}
	comments, err := s.videoRepo.CountComments(ctx, v.ID)
	if err != nil {
		return dto.GuideVideoResponse{}, err
	}
	liked, err := s.videoRepo.IsLikedByUser(ctx, v.ID, botUserID)
	if err != nil {
		return dto.GuideVideoResponse{}, err
	}
	return dto.GuideVideoResponse{
		ID:            strconv.FormatInt(v.ID, 10),
		Title:         v.Title,
		Description:   v.Description,
		Src:           v.Src,
		Poster:        v.Poster,
		DurationMin:   v.DurationMin,
		LikesCount:    likes,
		CommentsCount: comments,
		LikedByMe:     liked,
		CreatedAt:     v.CreatedAt.UTC().Format(time.RFC3339),
	}, nil
}

func toCommentResponse(c *domain.GuideVideoComment, currentUserID int64) dto.GuideVideoCommentResponse {
	name := botUserDisplayNameFromFields(c.FirstName, c.LastName, c.Username, 0)
	return dto.GuideVideoCommentResponse{
		ID:              strconv.FormatInt(c.ID, 10),
		AuthorName:      name,
		AuthorAvatarURL: c.AvatarURL,
		Text:            c.Text,
		CreatedAt:       c.CreatedAt.UTC().Format(time.RFC3339),
		IsMine:          c.BotUserID == currentUserID,
	}
}

func validateGuideVideoInput(src, poster string) error {
	if err := upload.ValidateVideoSrc(src); err != nil {
		return ErrInvalidVideoSrc
	}
	if err := upload.ValidatePosterPath(poster); err != nil {
		return ErrInvalidPosterPath
	}
	return nil
}

func (s *GuideVideoService) cleanupReplacedUploads(oldSrc, newSrc, oldPoster, newPoster string) {
	if s.uploads == nil {
		return
	}
	if strings.TrimSpace(oldSrc) != "" && strings.TrimSpace(oldSrc) != strings.TrimSpace(newSrc) {
		_ = upload.DeleteLocalFile(s.uploads.RootDir(), oldSrc)
	}
	if strings.TrimSpace(oldPoster) != "" && strings.TrimSpace(oldPoster) != strings.TrimSpace(newPoster) {
		_ = upload.DeleteLocalFile(s.uploads.RootDir(), oldPoster)
	}
}
