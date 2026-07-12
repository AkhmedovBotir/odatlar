package handler

import (
	"errors"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
)

type MonitoringHandler struct {
	service *service.MonitoringService
}

func NewMonitoringHandler(svc *service.MonitoringService) *MonitoringHandler {
	return &MonitoringHandler{service: svc}
}

var (
	_ dto.UserMonitoringResponse
	_ dto.UserActivityResponse
)

// GetUserMonitoring godoc
// @Summary      Foydalanuvchini to'liq monitoring
// @Description  Bitta foydalanuvchi bo'yicha profil, umumiy ko'rsatkichlar, amaliyot/indikator/dominanta tafsilotlari va so'nggi faoliyat lentasi
// @Tags         Bot Monitoring
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      int  true  "Bot user ID"
// @Success      200  {object}  dto.UserMonitoringResponse
// @Failure      400  {object}  response.ErrorBody
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/users/{id}/monitoring [get]
func (h *MonitoringHandler) GetUserMonitoring(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		response.BadRequest(c, "invalid id")
		return
	}

	result, err := h.service.GetUserMonitoring(c.Request.Context(), id)
	if err != nil {
		handleMonitoringError(c, err)
		return
	}
	response.OK(c, result)
}

// GetUserActivity godoc
// @Summary      Foydalanuvchi faoliyat lentasi
// @Description  Amaliyot bajarilishlari, indikator kiritishlari va dominanta sessiyalarini xronologik tartibda qaytaradi
// @Tags         Bot Monitoring
// @Produce      json
// @Security     BearerAuth
// @Param        id     path   int     true   "Bot user ID"
// @Param        from   query  string  false  "Boshlanish sanasi (YYYY-MM-DD)"
// @Param        to     query  string  false  "Tugash sanasi (YYYY-MM-DD)"
// @Param        limit  query  int     false  "Limit"  default(50)
// @Success      200  {object}  dto.UserActivityResponse
// @Failure      400  {object}  response.ErrorBody
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/users/{id}/activity [get]
func (h *MonitoringHandler) GetUserActivity(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		response.BadRequest(c, "invalid id")
		return
	}

	limit := 50
	if raw := c.Query("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = parsed
		}
	}

	loc := time.FixedZone("Asia/Tashkent", 5*60*60)
	now := time.Now().In(loc)
	to := now
	from := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc).AddDate(0, 0, -29)

	if raw := c.Query("from"); raw != "" {
		if parsed, err := time.ParseInLocation("2006-01-02", raw, loc); err == nil {
			from = parsed
		} else {
			response.BadRequest(c, "invalid from date")
			return
		}
	}
	if raw := c.Query("to"); raw != "" {
		if parsed, err := time.ParseInLocation("2006-01-02", raw, loc); err == nil {
			to = parsed.Add(24*time.Hour - time.Second)
		} else {
			response.BadRequest(c, "invalid to date")
			return
		}
	}

	result, err := h.service.GetUserActivity(c.Request.Context(), id, from, to, limit)
	if err != nil {
		handleMonitoringError(c, err)
		return
	}
	response.OK(c, result)
}

func handleMonitoringError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrMonitoringUserNotFound):
		response.NotFound(c, "bot user not found")
	default:
		response.InternalError(c, "monitoring request failed", err)
	}
}
