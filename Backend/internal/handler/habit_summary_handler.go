package handler

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
)

type HabitSummaryHandler struct {
	service *service.HabitSummaryService
}

func NewHabitSummaryHandler(svc *service.HabitSummaryService) *HabitSummaryHandler {
	return &HabitSummaryHandler{service: svc}
}

func (h *HabitSummaryHandler) Get(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	kind := c.Query("kind")
	if kind == "" {
		response.BadRequest(c, "kind is required")
		return
	}

	result, err := h.service.GetSummary(c.Request.Context(), tgUser, kind)
	if err != nil {
		handleHabitSummaryError(c, err)
		return
	}
	response.OK(c, result)
}

func handleHabitSummaryError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrRuntimeBotUserNotFound):
		response.NotFound(c, "bot user not found")
	default:
		response.InternalError(c, "habit summary request failed", err)
	}
}
