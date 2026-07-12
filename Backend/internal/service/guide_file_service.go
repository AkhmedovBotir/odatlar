package service

import (
	"context"
	"errors"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/odatlar-bot/backend/internal/domain"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/pkg/upload"
)

var (
	ErrInvalidGuideFileSlug = errors.New("invalid guide file slug")
	ErrDuplicateGuideFileSlug = errors.New("duplicate guide file slug")
	ErrInvalidGuideFileURL  = errors.New("invalid guide file url")
)

var guideFileSlugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type GuideFileService struct {
	fileRepo *repository.GuideFileRepository
	uploads  *upload.Storage
}

func NewGuideFileService(fileRepo *repository.GuideFileRepository, uploads *upload.Storage) *GuideFileService {
	return &GuideFileService{fileRepo: fileRepo, uploads: uploads}
}

func (s *GuideFileService) AdminList(ctx context.Context) (*dto.GuideFileListResponse, error) {
	files, err := s.fileRepo.ListAll(ctx)
	if err != nil {
		return nil, err
	}
	data := make([]dto.GuideFileResponse, 0, len(files))
	for i := range files {
		data = append(data, toGuideFileResponse(&files[i], true))
	}
	return &dto.GuideFileListResponse{Data: data}, nil
}

func (s *GuideFileService) AdminGet(ctx context.Context, ref string) (*dto.GuideFileResponse, error) {
	f, err := s.resolveFileRef(ctx, ref, false)
	if err != nil {
		return nil, err
	}
	item := toGuideFileResponse(f, true)
	return &item, nil
}

func (s *GuideFileService) AdminCreate(ctx context.Context, req dto.CreateGuideFileRequest) (*dto.GuideFileResponse, error) {
	slug, err := normalizeGuideFileSlug(req.Slug)
	if err != nil {
		return nil, err
	}
	if err := validateGuideFileInput(req.URL, req.Ext); err != nil {
		return nil, err
	}
	exists, err := s.fileRepo.SlugExists(ctx, slug, 0)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrDuplicateGuideFileSlug
	}
	published := true
	if req.IsPublished != nil {
		published = *req.IsPublished
	}
	created, err := s.fileRepo.Create(ctx, &domain.GuideFile{
		Slug:        slug,
		Title:       strings.TrimSpace(req.Title),
		Description: strings.TrimSpace(req.Description),
		URL:         strings.TrimSpace(req.URL),
		Ext:         normalizeExt(req.Ext),
		SizeBytes:   req.SizeBytes,
		SortOrder:   req.SortOrder,
		IsPublished: published,
	})
	if err != nil {
		return nil, err
	}
	item := toGuideFileResponse(created, true)
	return &item, nil
}

func (s *GuideFileService) AdminUpdate(ctx context.Context, ref string, req dto.UpdateGuideFileRequest) (*dto.GuideFileResponse, error) {
	existing, err := s.resolveFileRef(ctx, ref, false)
	if err != nil {
		return nil, err
	}
	slug, err := normalizeGuideFileSlug(req.Slug)
	if err != nil {
		return nil, err
	}
	if err := validateGuideFileInput(req.URL, req.Ext); err != nil {
		return nil, err
	}
	exists, err := s.fileRepo.SlugExists(ctx, slug, existing.ID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrDuplicateGuideFileSlug
	}
	updated, err := s.fileRepo.Update(ctx, &domain.GuideFile{
		ID:          existing.ID,
		Slug:        slug,
		Title:       strings.TrimSpace(req.Title),
		Description: strings.TrimSpace(req.Description),
		URL:         strings.TrimSpace(req.URL),
		Ext:         normalizeExt(req.Ext),
		SizeBytes:   req.SizeBytes,
		SortOrder:   req.SortOrder,
		IsPublished: req.IsPublished,
	})
	if err != nil {
		return nil, err
	}
	if s.uploads != nil && strings.TrimSpace(existing.URL) != strings.TrimSpace(req.URL) {
		_ = upload.DeleteLocalFile(s.uploads.RootDir(), existing.URL)
	}
	item := toGuideFileResponse(updated, true)
	return &item, nil
}

func (s *GuideFileService) AdminDelete(ctx context.Context, ref string) error {
	existing, err := s.resolveFileRef(ctx, ref, false)
	if err != nil {
		return err
	}
	if err := s.fileRepo.Delete(ctx, existing.ID); err != nil {
		return err
	}
	if s.uploads != nil {
		_ = upload.DeleteLocalFile(s.uploads.RootDir(), existing.URL)
	}
	return nil
}

func (s *GuideFileService) ListPublished(ctx context.Context) (*dto.GuideFileListResponse, error) {
	files, err := s.fileRepo.ListPublished(ctx)
	if err != nil {
		return nil, err
	}
	data := make([]dto.GuideFileResponse, 0, len(files))
	for i := range files {
		data = append(data, toGuideFileResponse(&files[i], false))
	}
	return &dto.GuideFileListResponse{Data: data}, nil
}

func (s *GuideFileService) resolveFileRef(ctx context.Context, ref string, publishedOnly bool) (*domain.GuideFile, error) {
	ref = strings.TrimSpace(ref)
	if ref == "" {
		return nil, repository.ErrGuideFileNotFound
	}
	if id, err := strconv.ParseInt(ref, 10, 64); err == nil && id > 0 {
		if publishedOnly {
			return s.fileRepo.GetPublishedByID(ctx, id)
		}
		return s.fileRepo.GetByID(ctx, id)
	}
	if publishedOnly {
		return s.fileRepo.GetPublishedBySlug(ctx, ref)
	}
	return s.fileRepo.GetBySlug(ctx, ref)
}

func toGuideFileResponse(f *domain.GuideFile, admin bool) dto.GuideFileResponse {
	item := dto.GuideFileResponse{
		ID:          f.Slug,
		Title:       f.Title,
		Description: f.Description,
		URL:         f.URL,
		Ext:         f.Ext,
		SizeLabel:   upload.FormatSizeLabel(f.SizeBytes),
	}
	if admin {
		item.SizeBytes = f.SizeBytes
		item.SortOrder = f.SortOrder
		item.IsPublished = f.IsPublished
		item.CreatedAt = f.CreatedAt.UTC().Format(time.RFC3339)
		item.UpdatedAt = f.UpdatedAt.UTC().Format(time.RFC3339)
	}
	return item
}

func normalizeGuideFileSlug(raw string) (string, error) {
	slug := strings.ToLower(strings.TrimSpace(raw))
	if slug == "" || len(slug) > 100 || !guideFileSlugPattern.MatchString(slug) {
		return "", ErrInvalidGuideFileSlug
	}
	return slug, nil
}

func normalizeExt(raw string) string {
	return strings.ToLower(strings.TrimPrefix(strings.TrimSpace(raw), "."))
}

func validateGuideFileInput(url, ext string) error {
	if err := upload.ValidateGuideFileURL(url); err != nil {
		return ErrInvalidGuideFileURL
	}
	if normalizeExt(ext) == "" {
		return ErrInvalidGuideFileURL
	}
	return nil
}
