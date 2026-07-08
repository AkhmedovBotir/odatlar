package handler

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/middleware"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
	"github.com/odatlar-bot/backend/pkg/telegram"
)

type PracticeHandler struct {
	service *service.PracticeService
}

func NewPracticeHandler(svc *service.PracticeService) *PracticeHandler {
	return &PracticeHandler{service: svc}
}

func (h *PracticeHandler) List(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	items, err := h.service.List(c.Request.Context(), tgUser)
	if err != nil {
		handlePracticeError(c, err)
		return
	}
	response.OK(c, items)
}

func (h *PracticeHandler) Create(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	var req dto.CreatePracticeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	item, err := h.service.Create(c.Request.Context(), tgUser, req)
	if err != nil {
		handlePracticeError(c, err)
		return
	}
	response.Created(c, item)
}

func (h *PracticeHandler) Update(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	practiceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || practiceID < 1 {
		response.BadRequest(c, "invalid id")
		return
	}

	var req dto.UpdatePracticeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	item, err := h.service.Update(c.Request.Context(), tgUser, practiceID, req)
	if err != nil {
		handlePracticeError(c, err)
		return
	}
	response.OK(c, item)
}

func (h *PracticeHandler) Delete(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	practiceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || practiceID < 1 {
		response.BadRequest(c, "invalid id")
		return
	}

	if err := h.service.Delete(c.Request.Context(), tgUser, practiceID); err != nil {
		handlePracticeError(c, err)
		return
	}
	response.NoContent(c)
}

func (h *PracticeHandler) Toggle(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	practiceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || practiceID < 1 {
		response.BadRequest(c, "invalid id")
		return
	}

	item, err := h.service.Toggle(c.Request.Context(), tgUser, practiceID)
	if err != nil {
		handlePracticeError(c, err)
		return
	}
	response.OK(c, item)
}

func (h *PracticeHandler) ListHistory(c *gin.Context) {
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
		handlePracticeError(c, err)
		return
	}
	response.OK(c, items)
}

func getTelegramUser(c *gin.Context) *telegram.WebAppUser {
	raw, ok := c.Get(middleware.TelegramWebAppUserKey)
	if !ok {
		response.Unauthorized(c, "telegram user missing")
		return nil
	}
	return raw.(*telegram.WebAppUser)
}

func handlePracticeError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrRuntimeBotUserNotFound):
		response.NotFound(c, "bot user not found")
	case errors.Is(err, repository.ErrPracticeNotFound):
		response.NotFound(c, "practice not found")
	default:
		if err.Error() == "invalid from date" || err.Error() == "invalid to date" {
			response.BadRequest(c, err.Error())
			return
		}
		response.InternalError(c, "practice request failed", err)
	}
}
