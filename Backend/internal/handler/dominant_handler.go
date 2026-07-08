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
