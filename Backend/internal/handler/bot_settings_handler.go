package handler

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
)

type BotSettingsHandler struct {
	service *service.BotSettingsService
}

func NewBotSettingsHandler(svc *service.BotSettingsService) *BotSettingsHandler {
	return &BotSettingsHandler{service: svc}
}

// GetSettings godoc
// @Summary      Bot sozlamalarini olish
// @Description  Token va /start sozlamalarini qaytaradi
// @Tags         Bot Settings
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  dto.BotSettingsResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/settings [get]
func (h *BotSettingsHandler) GetSettings(c *gin.Context) {
	settings, err := h.service.GetSettings(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to get bot settings", err)
		return
	}
	response.OK(c, settings)
}

// UpdateSettings godoc
// @Summary      /start sozlamalarini yangilash
// @Description  Start xabari va pastki tugmani sozlash
// @Tags         Bot Settings
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      dto.UpdateBotSettingsRequest  true  "Start sozlamalari"
// @Success      200   {object}  dto.BotSettingsResponse
// @Failure      400   {object}  response.ErrorBody
// @Failure      401   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /bot/settings [put]
func (h *BotSettingsHandler) UpdateSettings(c *gin.Context) {
	var req dto.UpdateBotSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	settings, err := h.service.UpdateSettings(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrStartButtonRequired) || errors.Is(err, service.ErrStartButtonURLRequired) {
			response.BadRequest(c, err.Error())
			return
		}
		response.InternalError(c, "failed to update bot settings", err)
		return
	}

	response.OK(c, settings)
}

// GetToken godoc
// @Summary      Bot token holati
// @Tags         Bot Settings
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  dto.BotTokenResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/token [get]
func (h *BotSettingsHandler) GetToken(c *gin.Context) {
	token, err := h.service.GetTokenStatus(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to get bot token", err)
		return
	}
	response.OK(c, token)
}

// UpdateToken godoc
// @Summary      Bot token qo'shish/yangilash
// @Tags         Bot Settings
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      dto.UpdateBotTokenRequest  true  "Bot token"
// @Success      200   {object}  dto.BotTokenResponse
// @Failure      400   {object}  response.ErrorBody
// @Failure      401   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /bot/token [put]
func (h *BotSettingsHandler) UpdateToken(c *gin.Context) {
	var req dto.UpdateBotTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	token, err := h.service.UpdateToken(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidBotToken) {
			response.BadRequest(c, "invalid bot token")
			return
		}
		response.InternalError(c, "failed to update bot token", err)
		return
	}

	response.OK(c, token)
}

// DeleteToken godoc
// @Summary      Bot tokenni o'chirish
// @Tags         Bot Settings
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  dto.BotTokenResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/token [delete]
func (h *BotSettingsHandler) DeleteToken(c *gin.Context) {
	token, err := h.service.DeleteToken(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to delete bot token", err)
		return
	}
	response.OK(c, token)
}

// ListUsers godoc
// @Summary      /start bosgan foydalanuvchilar
// @Description  Botga start bosgan foydalanuvchilar ro'yxati
// @Tags         Bot Settings
// @Produce      json
// @Security     BearerAuth
// @Param        page    query  int     false  "Sahifa"   default(1)
// @Param        limit   query  int     false  "Limit"    default(10)
// @Param        search  query  string  false  "Qidiruv"
// @Success      200  {object}  dto.BotUserListResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/users [get]
func (h *BotSettingsHandler) ListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	users, err := h.service.ListUsers(c.Request.Context(), page, limit, search)
	if err != nil {
		response.InternalError(c, "failed to list bot users", err)
		return
	}

	response.OK(c, users)
}

// GetUserByID godoc
// @Summary      Bitta bot foydalanuvchi tafsiloti
// @Description  Tanlangan foydalanuvchi uchun to'liq ma'lumotlarni qaytaradi
// @Tags         Bot Settings
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      int  true  "Bot user ID"
// @Success      200  {object}  dto.BotUserResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/users/{id} [get]
func (h *BotSettingsHandler) GetUserByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		response.BadRequest(c, "invalid id")
		return
	}

	user, err := h.service.GetUserByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrBotUserNotFound) {
			response.NotFound(c, "bot user not found")
			return
		}
		response.InternalError(c, "failed to get bot user", err)
		return
	}

	response.OK(c, user)
}
