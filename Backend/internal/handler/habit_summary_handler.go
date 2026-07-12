package handler

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
)

type HabitSummaryHandler struct {
	service *service.HabitSummaryService
}

func NewHabitSummaryHandler(svc *service.HabitSummaryService) *HabitSummaryHandler {
	return &HabitSummaryHandler{service: svc}
}

var _ dto.HabitSummaryResponse

// Get godoc
// @Summary      Odatlar xulosasi
// @Tags         Habits
// @Produce      json
// @Security     TelegramInitData
// @Param        kind  query  string  true  "Turi (practice yoki indicator)"
// @Success      200   {object}  dto.HabitSummaryResponse
// @Failure      400   {object}  response.ErrorBody
// @Failure      401   {object}  response.ErrorBody
// @Failure      404   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /bot-runtime/habits/summary [get]
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
