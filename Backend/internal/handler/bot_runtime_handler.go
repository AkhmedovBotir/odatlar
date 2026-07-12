package handler

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/middleware"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
	"github.com/odatlar-bot/backend/pkg/telegram"
)

type BotRuntimeHandler struct {
	service *service.BotRuntimeService
}

func NewBotRuntimeHandler(svc *service.BotRuntimeService) *BotRuntimeHandler {
	return &BotRuntimeHandler{service: svc}
}

// GetConfig godoc
// @Summary      Bot runtime konfiguratsiyasi
// @Description  Bot servisi uchun token va /start sozlamalarini qaytaradi (bot token kerak)
// @Tags         Bot Runtime
// @Produce      json
// @Security     BotToken
// @Success      200  {object}  dto.BotRuntimeConfigResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      403  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot-runtime/config [get]
func (h *BotRuntimeHandler) GetConfig(c *gin.Context) {
	config, err := h.service.GetConfig(c.Request.Context())
	if err != nil {
		switch {
		case errors.Is(err, service.ErrBotNotActive):
			response.Forbidden(c, "bot is not active")
		case errors.Is(err, service.ErrBotTokenMissing):
			response.Forbidden(c, "bot token is not configured")
		default:
			response.InternalError(c, "failed to get bot config", err)
		}
		return
	}

	response.OK(c, config)
}

// RegisterStart godoc
// @Summary      Foydalanuvchi /start hodisasi
// @Description  Bot /start bosilganda foydalanuvchini saqlaydi yoki yangilaydi
// @Tags         Bot Runtime
// @Accept       json
// @Produce      json
// @Security     BotToken
// @Param        body  body      dto.BotStartUserRequest  true  "Foydalanuvchi ma'lumotlari"
// @Success      200   {object}  dto.BotUserResponse
// @Failure      400   {object}  response.ErrorBody
// @Failure      401   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /bot-runtime/start [post]
func (h *BotRuntimeHandler) RegisterStart(c *gin.Context) {
	var req dto.BotStartUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	user, err := h.service.RegisterStart(c.Request.Context(), req)
	if err != nil {
		response.InternalError(c, "failed to register start", err)
		return
	}

	response.OK(c, user)
}

// RegisterWebAppOpen godoc
// @Summary      WebApp ochilgan hodisasi
// @Description  WebApp ichidan foydalanuvchi ma'lumotini saqlaydi/yangilaydi (Telegram initData kerak)
// @Tags         Bot Runtime
// @Produce      json
// @Security     TelegramInitData
// @Success      200   {object}  dto.BotUserResponse
// @Failure      401   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /bot-runtime/webapp/open [post]
func (h *BotRuntimeHandler) RegisterWebAppOpen(c *gin.Context) {
	tgUser, ok := c.Get(middleware.TelegramWebAppUserKey)
	if !ok {
		response.Unauthorized(c, "telegram user missing")
		return
	}

	user, err := h.service.RegisterWebAppOpen(c.Request.Context(), tgUser.(*telegram.WebAppUser))
	if err != nil {
		response.InternalError(c, "failed to register webapp open", err)
		return
	}

	response.OK(c, user)
}

// GetMe godoc
// @Summary      WebApp foydalanuvchisi o'z ma'lumoti
// @Description  Telegram initData orqali joriy foydalanuvchi ma'lumotini qaytaradi
// @Tags         Bot Runtime
// @Produce      json
// @Security     TelegramInitData
// @Success      200   {object}  dto.BotUserResponse
// @Failure      401   {object}  response.ErrorBody
// @Failure      404   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /bot-runtime/me [post]
func (h *BotRuntimeHandler) GetMe(c *gin.Context) {
	tgUser, ok := c.Get(middleware.TelegramWebAppUserKey)
	if !ok {
		response.Unauthorized(c, "telegram user missing")
		return
	}

	user, err := h.service.GetMe(c.Request.Context(), tgUser.(*telegram.WebAppUser).ID)
	if err != nil {
		if errors.Is(err, service.ErrRuntimeBotUserNotFound) {
			response.NotFound(c, "bot user not found")
			return
		}
		response.InternalError(c, "failed to get bot user", err)
		return
	}

	response.OK(c, user)
}
