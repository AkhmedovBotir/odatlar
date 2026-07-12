package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
)

type AdminStatsHandler struct {
	service *service.AdminStatsService
}

func NewAdminStatsHandler(svc *service.AdminStatsService) *AdminStatsHandler {
	return &AdminStatsHandler{service: svc}
}

var (
	_ dto.AdminStatsResponse
	_ dto.AdminLeaderboardResponse
)

// GetOverview godoc
// @Summary      Admin statistikasi
// @Description  Foydalanuvchilar, amaliyotlar, indikatorlar, dominantalar va XP bo'yicha umumiy ko'rsatkichlar
// @Tags         Bot Stats
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  dto.AdminStatsResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/stats [get]
func (h *AdminStatsHandler) GetOverview(c *gin.Context) {
	stats, err := h.service.GetOverview(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to get admin stats", err)
		return
	}
	response.OK(c, stats)
}

// GetLeaderboard godoc
// @Summary      Admin XP reytingi
// @Description  XP bo'yicha eng yuqori foydalanuvchilar (telegram_id, username bilan)
// @Tags         Bot Stats
// @Produce      json
// @Security     BearerAuth
// @Param        limit  query  int  false  "Limit"  default(20)
// @Success      200  {object}  dto.AdminLeaderboardResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/leaderboard [get]
func (h *AdminStatsHandler) GetLeaderboard(c *gin.Context) {
	limit := 20
	if raw := c.Query("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = parsed
		}
	}

	result, err := h.service.GetLeaderboard(c.Request.Context(), limit)
	if err != nil {
		response.InternalError(c, "failed to get admin leaderboard", err)
		return
	}
	response.OK(c, result)
}
