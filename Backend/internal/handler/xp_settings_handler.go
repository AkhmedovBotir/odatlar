package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
)

type XPSettingsHandler struct {
	service *service.XPService
}

func NewXPSettingsHandler(svc *service.XPService) *XPSettingsHandler {
	return &XPSettingsHandler{service: svc}
}

// GetSettings godoc
// @Summary      XP sozlamalarini olish
// @Tags         xp-settings
// @Security     BearerAuth
// @Produce      json
// @Success      200 {object} dto.XPSettingsResponse
// @Router       /bot/xp-settings [get]
func (h *XPSettingsHandler) GetSettings(c *gin.Context) {
	settings, err := h.service.GetSettings(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to get xp settings", err)
		return
	}
	response.OK(c, settings)
}

// UpdateSettings godoc
// @Summary      XP sozlamalarini yangilash
// @Tags         xp-settings
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request body dto.UpdateXPSettingsRequest true "XP sozlamalari"
// @Success      200 {object} dto.XPSettingsResponse
// @Router       /bot/xp-settings [put]
func (h *XPSettingsHandler) UpdateSettings(c *gin.Context) {
	var req dto.UpdateXPSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	settings, err := h.service.UpdateSettings(c.Request.Context(), req)
	if err != nil {
		response.InternalError(c, "failed to update xp settings", err)
		return
	}
	response.OK(c, settings)
}
