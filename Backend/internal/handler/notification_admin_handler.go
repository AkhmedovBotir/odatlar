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

type NotificationAdminHandler struct {
	service *service.NotificationService
}

func NewNotificationAdminHandler(svc *service.NotificationService) *NotificationAdminHandler {
	return &NotificationAdminHandler{service: svc}
}

// List godoc
// @Summary      Bildirishnomalar ro'yxati (admin)
// @Tags         Notifications
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  dto.NotificationListResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/notifications [get]
func (h *NotificationAdminHandler) List(c *gin.Context) {
	items, err := h.service.AdminList(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to list notifications", err)
		return
	}
	response.OK(c, items)
}

// Create godoc
// @Summary      Yangi bildirishnoma yaratish (admin)
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      dto.CreateNotificationRequest  true  "Bildirishnoma ma'lumotlari"
// @Success      201   {object}  dto.NotificationResponse
// @Failure      400   {object}  response.ErrorBody
// @Failure      401   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /bot/notifications [post]
func (h *NotificationAdminHandler) Create(c *gin.Context) {
	var req dto.CreateNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	item, err := h.service.AdminCreate(c.Request.Context(), req)
	if err != nil {
		handleNotificationError(c, err)
		return
	}
	response.Created(c, item)
}

// Get godoc
// @Summary      Bildirishnoma tafsilotlari (admin)
// @Tags         Notifications
// @Produce      json
// @Security     BearerAuth
// @Param        id  path  int  true  "Bildirishnoma ID"
// @Success      200  {object}  dto.NotificationResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/notifications/{id} [get]
func (h *NotificationAdminHandler) Get(c *gin.Context) {
	id, err := parseNotificationID(c)
	if err != nil {
		return
	}
	item, err := h.service.AdminGet(c.Request.Context(), id)
	if err != nil {
		handleNotificationError(c, err)
		return
	}
	response.OK(c, item)
}

// Update godoc
// @Summary      Bildirishnomani yangilash (admin)
// @Tags         Notifications
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      int                            true  "Bildirishnoma ID"
// @Param        body  body      dto.UpdateNotificationRequest  true  "Yangilangan ma'lumotlar"
// @Success      200   {object}  dto.NotificationResponse
// @Failure      400   {object}  response.ErrorBody
// @Failure      401   {object}  response.ErrorBody
// @Failure      404   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /bot/notifications/{id} [put]
func (h *NotificationAdminHandler) Update(c *gin.Context) {
	id, err := parseNotificationID(c)
	if err != nil {
		return
	}
	var req dto.UpdateNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	item, err := h.service.AdminUpdate(c.Request.Context(), id, req)
	if err != nil {
		handleNotificationError(c, err)
		return
	}
	response.OK(c, item)
}

// Delete godoc
// @Summary      Bildirishnomani o'chirish (admin)
// @Tags         Notifications
// @Security     BearerAuth
// @Param        id  path  int  true  "Bildirishnoma ID"
// @Success      204
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/notifications/{id} [delete]
func (h *NotificationAdminHandler) Delete(c *gin.Context) {
	id, err := parseNotificationID(c)
	if err != nil {
		return
	}
	if err := h.service.AdminDelete(c.Request.Context(), id); err != nil {
		handleNotificationError(c, err)
		return
	}
	response.NoContent(c)
}

// Send godoc
// @Summary      Bildirishnomani yuborish (admin)
// @Description  Draft holatdagi bildirishnomani foydalanuvchilarga yuboradi
// @Tags         Notifications
// @Produce      json
// @Security     BearerAuth
// @Param        id  path  int  true  "Bildirishnoma ID"
// @Success      200  {object}  dto.NotificationResponse
// @Failure      400  {object}  response.ErrorBody
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/notifications/{id}/send [post]
func (h *NotificationAdminHandler) Send(c *gin.Context) {
	id, err := parseNotificationID(c)
	if err != nil {
		return
	}
	item, err := h.service.AdminSend(c.Request.Context(), id)
	if err != nil {
		handleNotificationError(c, err)
		return
	}
	response.OK(c, item)
}

func parseNotificationID(c *gin.Context) (int64, error) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		response.BadRequest(c, "invalid id")
		return 0, err
	}
	return id, nil
}

func handleNotificationError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, repository.ErrNotificationNotFound):
		response.NotFound(c, "notification not found")
	case errors.Is(err, repository.ErrNotificationDeliveryNotFound):
		response.NotFound(c, "notification not found")
	case errors.Is(err, service.ErrInvalidNotificationType):
		response.BadRequest(c, "invalid notification type")
	case errors.Is(err, service.ErrInvalidNotificationTarget):
		response.BadRequest(c, "invalid notification target")
	case errors.Is(err, service.ErrNotificationNotDraft):
		response.BadRequest(c, "only draft notifications can be changed")
	case errors.Is(err, service.ErrNotificationEmptyTargets):
		response.BadRequest(c, "no target users specified")
	case errors.Is(err, service.ErrRuntimeBotUserNotFound):
		response.NotFound(c, "bot user not found")
	default:
		response.InternalError(c, "notification request failed", err)
	}
}
