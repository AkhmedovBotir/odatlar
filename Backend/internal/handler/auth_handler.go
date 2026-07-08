package handler

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/middleware"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
)

type AuthHandler struct {
	service *service.AdminService
}

func NewAuthHandler(svc *service.AdminService) *AuthHandler {
	return &AuthHandler{service: svc}
}

// Login godoc
// @Summary      Admin login
// @Description  Username va password orqali tizimga kirish
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body  body      dto.LoginRequest   true  "Login ma'lumotlari"
// @Success      200   {object}  dto.LoginResponse
// @Failure      400   {object}  response.ErrorBody
// @Failure      401   {object}  response.ErrorBody
// @Failure      403   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	result, err := h.service.Login(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidCredentials):
			response.Unauthorized(c, "invalid username or password")
		case errors.Is(err, service.ErrAdminInactive):
			response.Forbidden(c, "admin account is inactive")
		default:
			response.InternalError(c, "login failed", err)
		}
		return
	}

	response.OK(c, result)
}

// GetProfile godoc
// @Summary      Admin profili
// @Description  Joriy admin profil ma'lumotlarini qaytaradi
// @Tags         Auth
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  dto.ProfileResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /auth/profile [get]
func (h *AuthHandler) GetProfile(c *gin.Context) {
	adminID, ok := middleware.GetAdminID(c)
	if !ok {
		response.Unauthorized(c, "unauthorized")
		return
	}

	profile, err := h.service.GetProfile(c.Request.Context(), adminID)
	if err != nil {
		if errors.Is(err, repository.ErrAdminNotFound) {
			response.NotFound(c, "admin not found")
			return
		}
		response.InternalError(c, "failed to get profile", err)
		return
	}

	response.OK(c, profile)
}
