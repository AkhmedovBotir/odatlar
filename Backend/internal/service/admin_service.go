package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/odatlar-bot/backend/internal/domain"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/pkg/hash"
	"github.com/odatlar-bot/backend/pkg/jwt"
)

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrAdminInactive      = errors.New("admin account is inactive")
	ErrAdminExists        = errors.New("admin already exists")
)

type AdminService struct {
	repo       *repository.AdminRepository
	jwtManager *jwt.Manager
}

func NewAdminService(repo *repository.AdminRepository, jwtManager *jwt.Manager) *AdminService {
	return &AdminService{
		repo:       repo,
		jwtManager: jwtManager,
	}
}

func (s *AdminService) Create(ctx context.Context, req dto.CreateAdminRequest) (*dto.AdminResponse, error) {
	hashedPassword, err := hash.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	admin := &domain.Admin{
		FirstName: strings.TrimSpace(req.FirstName),
		LastName:  strings.TrimSpace(req.LastName),
		Phone:     strings.TrimSpace(req.Phone),
		Username:  strings.TrimSpace(req.Username),
		Password:  hashedPassword,
		Status:    domain.AdminStatusActive,
	}

	if err := s.repo.Create(ctx, admin); err != nil {
		if strings.Contains(err.Error(), "already exists") {
			return nil, ErrAdminExists
		}
		return nil, err
	}

	resp := toAdminResponse(admin)
	return &resp, nil
}

func (s *AdminService) GetByID(ctx context.Context, id string) (*dto.AdminResponse, error) {
	admin, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	resp := toAdminResponse(admin)
	return &resp, nil
}

func (s *AdminService) List(ctx context.Context, page, limit int) (*dto.AdminListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	admins, total, err := s.repo.List(ctx, page, limit)
	if err != nil {
		return nil, err
	}

	data := make([]dto.AdminResponse, 0, len(admins))
	for i := range admins {
		data = append(data, toAdminResponse(&admins[i]))
	}

	return &dto.AdminListResponse{
		Data:  data,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

func (s *AdminService) Update(ctx context.Context, id string, req dto.UpdateAdminRequest) (*dto.AdminResponse, error) {
	admin, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.FirstName != "" {
		admin.FirstName = strings.TrimSpace(req.FirstName)
	}
	if req.LastName != "" {
		admin.LastName = strings.TrimSpace(req.LastName)
	}
	if req.Phone != "" {
		admin.Phone = strings.TrimSpace(req.Phone)
	}
	if req.Username != "" {
		admin.Username = strings.TrimSpace(req.Username)
	}
	if req.Password != "" {
		hashedPassword, err := hash.HashPassword(req.Password)
		if err != nil {
			return nil, fmt.Errorf("hash password: %w", err)
		}
		admin.Password = hashedPassword
	}

	if err := s.repo.Update(ctx, admin); err != nil {
		if strings.Contains(err.Error(), "already exists") {
			return nil, ErrAdminExists
		}
		return nil, err
	}

	resp := toAdminResponse(admin)
	return &resp, nil
}

func (s *AdminService) UpdateStatus(ctx context.Context, id string, status domain.AdminStatus) (*dto.AdminResponse, error) {
	if !status.IsValid() {
		return nil, fmt.Errorf("invalid status")
	}

	admin, err := s.repo.UpdateStatus(ctx, id, status)
	if err != nil {
		return nil, err
	}

	resp := toAdminResponse(admin)
	return &resp, nil
}

func (s *AdminService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *AdminService) Login(ctx context.Context, req dto.LoginRequest) (*dto.LoginResponse, error) {
	admin, err := s.repo.GetByUsername(ctx, strings.TrimSpace(req.Username))
	if err != nil {
		if errors.Is(err, repository.ErrAdminNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if admin.Status != domain.AdminStatusActive {
		return nil, ErrAdminInactive
	}

	if !hash.CheckPassword(req.Password, admin.Password) {
		return nil, ErrInvalidCredentials
	}

	token, err := s.jwtManager.Generate(admin.ID, admin.Username)
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	return &dto.LoginResponse{
		Token: token,
		Admin: toAdminResponse(admin),
	}, nil
}

func (s *AdminService) GetProfile(ctx context.Context, adminID string) (*dto.ProfileResponse, error) {
	admin, err := s.repo.GetByID(ctx, adminID)
	if err != nil {
		return nil, err
	}

	return &dto.ProfileResponse{
		Admin: toAdminResponse(admin),
	}, nil
}

func toAdminResponse(admin *domain.Admin) dto.AdminResponse {
	return dto.AdminResponse{
		ID:        admin.ID,
		FirstName: admin.FirstName,
		LastName:  admin.LastName,
		Phone:     admin.Phone,
		Username:  admin.Username,
		Status:    admin.Status,
		CreatedAt: admin.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
		UpdatedAt: admin.UpdatedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
}
