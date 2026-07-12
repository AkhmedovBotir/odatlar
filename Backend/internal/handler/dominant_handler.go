package handler

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
)

type DominantHandler struct {
	service *service.DominantService
}

func NewDominantHandler(svc *service.DominantService) *DominantHandler {
	return &DominantHandler{service: svc}
}

// List godoc
// @Summary      Dominantlar ro'yxati
// @Tags         Dominants
// @Produce      json
// @Security     TelegramInitData
// @Success      200  {object}  dto.DominantListResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot-runtime/dominants [get]
func (h *DominantHandler) List(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	items, err := h.service.List(c.Request.Context(), tgUser)
	if err != nil {
		handleDominantError(c, err)
		return
	}
	response.OK(c, items)
}

// Create godoc
// @Summary      Yangi dominant yaratish
// @Tags         Dominants
// @Accept       json
// @Produce      json
// @Security     TelegramInitData
// @Param        body  body      dto.CreateDominantRequest  true  "Dominant ma'lumotlari"
// @Success      201   {object}  dto.DominantResponse
// @Failure      400   {object}  response.ErrorBody
// @Failure      401   {object}  response.ErrorBody
// @Failure      404   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /bot-runtime/dominants [post]
func (h *DominantHandler) Create(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	var req dto.CreateDominantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	item, err := h.service.Create(c.Request.Context(), tgUser, req)
	if err != nil {
		handleDominantError(c, err)
		return
	}
	response.Created(c, item)
}

// Update godoc
// @Summary      Dominantni yangilash
// @Tags         Dominants
// @Accept       json
// @Produce      json
// @Security     TelegramInitData
// @Param        id    path      int                        true  "Dominant ID"
// @Param        body  body      dto.UpdateDominantRequest  true  "Yangilangan ma'lumotlar"
// @Success      200   {object}  dto.DominantResponse
// @Failure      400   {object}  response.ErrorBody
// @Failure      401   {object}  response.ErrorBody
// @Failure      404   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /bot-runtime/dominants/{id} [put]
func (h *DominantHandler) Update(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		response.BadRequest(c, "invalid id")
		return
	}

	var req dto.UpdateDominantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	item, err := h.service.Update(c.Request.Context(), tgUser, id, req)
	if err != nil {
		handleDominantError(c, err)
		return
	}
	response.OK(c, item)
}

// Delete godoc
// @Summary      Dominantni o'chirish
// @Tags         Dominants
// @Security     TelegramInitData
// @Param        id  path  int  true  "Dominant ID"
// @Success      204
// @Failure      400  {object}  response.ErrorBody
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot-runtime/dominants/{id} [delete]
func (h *DominantHandler) Delete(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		response.BadRequest(c, "invalid id")
		return
	}

	if err := h.service.Delete(c.Request.Context(), tgUser, id); err != nil {
		handleDominantError(c, err)
		return
	}
	response.NoContent(c)
}

// CompleteSession godoc
// @Summary      Dominant sessiyasini yakunlash
// @Tags         Dominants
// @Accept       json
// @Produce      json
// @Security     TelegramInitData
// @Param        id    path      int                              true  "Dominant ID"
// @Param        body  body      dto.CompleteDominantSessionRequest  true  "Sessiya ma'lumotlari"
// @Success      200   {object}  dto.DominantResponse
// @Failure      400   {object}  response.ErrorBody
// @Failure      401   {object}  response.ErrorBody
// @Failure      404   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /bot-runtime/dominants/{id}/session [post]
func (h *DominantHandler) CompleteSession(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		response.BadRequest(c, "invalid id")
		return
	}

	var req dto.CompleteDominantSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	item, err := h.service.CompleteSession(c.Request.Context(), tgUser, id, req)
	if err != nil {
		handleDominantError(c, err)
		return
	}
	response.OK(c, item)
}

func handleDominantError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrRuntimeBotUserNotFound):
		response.NotFound(c, "bot user not found")
	case errors.Is(err, repository.ErrDominantNotFound):
		response.NotFound(c, "dominant not found")
	default:
		response.InternalError(c, "dominant request failed", err)
	}
}
