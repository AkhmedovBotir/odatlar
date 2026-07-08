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

type IndicatorHandler struct {
	service *service.IndicatorService
}

func NewIndicatorHandler(svc *service.IndicatorService) *IndicatorHandler {
	return &IndicatorHandler{service: svc}
}

func (h *IndicatorHandler) List(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	items, err := h.service.List(c.Request.Context(), tgUser)
	if err != nil {
		handleIndicatorError(c, err)
		return
	}
	response.OK(c, items)
}

func (h *IndicatorHandler) Create(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	var req dto.CreateIndicatorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	item, err := h.service.Create(c.Request.Context(), tgUser, req)
	if err != nil {
		handleIndicatorError(c, err)
		return
	}
	response.Created(c, item)
}

func (h *IndicatorHandler) Update(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	indicatorID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || indicatorID < 1 {
		response.BadRequest(c, "invalid id")
		return
	}

	var req dto.UpdateIndicatorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	item, err := h.service.Update(c.Request.Context(), tgUser, indicatorID, req)
	if err != nil {
		handleIndicatorError(c, err)
		return
	}
	response.OK(c, item)
}

func (h *IndicatorHandler) Delete(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	indicatorID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || indicatorID < 1 {
		response.BadRequest(c, "invalid id")
		return
	}

	if err := h.service.Delete(c.Request.Context(), tgUser, indicatorID); err != nil {
		handleIndicatorError(c, err)
		return
	}
	response.NoContent(c)
}

func (h *IndicatorHandler) Log(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	indicatorID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || indicatorID < 1 {
		response.BadRequest(c, "invalid id")
		return
	}

	var req dto.LogIndicatorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	item, err := h.service.Log(c.Request.Context(), tgUser, indicatorID, req)
	if err != nil {
		handleIndicatorError(c, err)
		return
	}
	response.OK(c, item)
}

func (h *IndicatorHandler) ListHistory(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	from := c.DefaultQuery("from", "")
	to := c.DefaultQuery("to", "")
	if from == "" || to == "" {
		response.BadRequest(c, "from and to query params are required")
		return
	}

	items, err := h.service.ListHistory(c.Request.Context(), tgUser, from, to)
	if err != nil {
		handleIndicatorError(c, err)
		return
	}
	response.OK(c, items)
}

func handleIndicatorError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrRuntimeBotUserNotFound):
		response.NotFound(c, "bot user not found")
	case errors.Is(err, repository.ErrIndicatorNotFound):
		response.NotFound(c, "indicator not found")
	default:
		if err.Error() == "invalid from date" || err.Error() == "invalid to date" {
			response.BadRequest(c, err.Error())
			return
		}
		response.InternalError(c, "indicator request failed", err)
	}
}
