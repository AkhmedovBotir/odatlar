package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
)

type NotificationHandler struct {
	service *service.NotificationService
}

func NewNotificationHandler(svc *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{service: svc}
}

var (
	_ dto.UserNotificationListResponse
	_ dto.UnreadCountResponse
)

// List godoc
// @Summary      Foydalanuvchi bildirishnomalari
// @Tags         Notifications
// @Produce      json
// @Security     TelegramInitData
// @Success      200  {object}  dto.UserNotificationListResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot-runtime/notifications [get]
func (h *NotificationHandler) List(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}
	items, err := h.service.ListForUser(c.Request.Context(), tgUser)
	if err != nil {
		handleNotificationError(c, err)
		return
	}
	response.OK(c, items)
}

// MarkRead godoc
// @Summary      Bildirishnomani o'qilgan deb belgilash
// @Tags         Notifications
// @Produce      json
// @Security     TelegramInitData
// @Param        id  path  int  true  "Delivery ID"
// @Success      200  {object}  dto.UnreadCountResponse
// @Failure      400  {object}  response.ErrorBody
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot-runtime/notifications/{id}/read [post]
func (h *NotificationHandler) MarkRead(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		response.BadRequest(c, "invalid id")
		return
	}
	result, err := h.service.MarkRead(c.Request.Context(), tgUser, id)
	if err != nil {
		handleNotificationError(c, err)
		return
	}
	response.OK(c, result)
}

// MarkAllRead godoc
// @Summary      Barcha bildirishnomalarni o'qilgan deb belgilash
// @Tags         Notifications
// @Produce      json
// @Security     TelegramInitData
// @Success      200  {object}  dto.UnreadCountResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot-runtime/notifications/read-all [post]
func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}
	result, err := h.service.MarkAllRead(c.Request.Context(), tgUser)
	if err != nil {
		handleNotificationError(c, err)
		return
	}
	response.OK(c, result)
}
