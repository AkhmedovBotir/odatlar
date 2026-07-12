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

// ListResponses godoc
// @Summary      Barcha so'rovnoma javoblari (admin)
// @Description  Filtrlash: survey, sana oralig'i, matn qidiruv, savol id
// @Tags         Survey Responses Admin
// @Produce      json
// @Security     BearerAuth
// @Param        survey       query  string  false  "So'rovnoma slug yoki ID"
// @Param        from         query  string  false  "Boshlanish sanasi (YYYY-MM-DD)"
// @Param        to           query  string  false  "Tugash sanasi (YYYY-MM-DD)"
// @Param        search       query  string  false  "Javoblarda matn qidiruv"
// @Param        question_id  query  string  false  "Ma'lum savol id bo'yicha filter"
// @Param        page         query  int     false  "Sahifa"  default(1)
// @Param        limit        query  int     false  "Limit"  default(20)
// @Param        sort         query  string  false  "created_at_desc | created_at_asc"
// @Success      200  {object}  dto.AdminSurveyResponseListResponse
// @Router       /bot/surveys/responses [get]
func (h *SurveyAdminHandler) ListResponses(c *gin.Context) {
	filter := parseAdminResponseFilter(c)
	items, err := h.service.AdminListResponses(c.Request.Context(), filter)
	if err != nil {
		handleSurveyResponseError(c, err)
		return
	}
	response.OK(c, items)
}

// ListSurveyResponses godoc
// @Summary      Bitta so'rovnoma javoblari (admin)
// @Tags         Survey Responses Admin
// @Produce      json
// @Security     BearerAuth
// @Param        id           path   string  true   "So'rovnoma slug yoki ID"
// @Param        from         query  string  false  "Boshlanish sanasi (YYYY-MM-DD)"
// @Param        to           query  string  false  "Tugash sanasi (YYYY-MM-DD)"
// @Param        search       query  string  false  "Javoblarda matn qidiruv"
// @Param        question_id  query  string  false  "Ma'lum savol id bo'yicha filter"
// @Param        page         query  int     false  "Sahifa"  default(1)
// @Param        limit        query  int     false  "Limit"  default(20)
// @Param        sort         query  string  false  "created_at_desc | created_at_asc"
// @Success      200  {object}  dto.AdminSurveyResponseListResponse
// @Router       /bot/surveys/{id}/responses [get]
func (h *SurveyAdminHandler) ListSurveyResponses(c *gin.Context) {
	filter := parseAdminResponseFilter(c)
	items, err := h.service.AdminListSurveyResponses(c.Request.Context(), c.Param("id"), filter)
	if err != nil {
		handleSurveyResponseError(c, err)
		return
	}
	response.OK(c, items)
}

// GetResponse godoc
// @Summary      Bitta javob tafsilotlari (admin)
// @Tags         Survey Responses Admin
// @Produce      json
// @Security     BearerAuth
// @Param        responseId  path  int  true  "Javob ID"
// @Success      200  {object}  dto.AdminSurveyResponseDetailResponse
// @Router       /bot/surveys/responses/{responseId} [get]
func (h *SurveyAdminHandler) GetResponse(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("responseId"), 10, 64)
	if err != nil || id < 1 {
		response.BadRequest(c, "invalid response id")
		return
	}
	item, err := h.service.AdminGetResponse(c.Request.Context(), id)
	if err != nil {
		handleSurveyResponseError(c, err)
		return
	}
	response.OK(c, item)
}

// GetSurveyResponseSummary godoc
// @Summary      So'rovnoma javoblari statistikasi (admin)
// @Tags         Survey Responses Admin
// @Produce      json
// @Security     BearerAuth
// @Param        id  path  string  true  "So'rovnoma slug yoki ID"
// @Success      200  {object}  dto.AdminSurveyResponseSummaryResponse
// @Router       /bot/surveys/{id}/responses/summary [get]
func (h *SurveyAdminHandler) GetSurveyResponseSummary(c *gin.Context) {
	item, err := h.service.AdminGetSurveyResponseSummary(c.Request.Context(), c.Param("id"))
	if err != nil {
		handleSurveyResponseError(c, err)
		return
	}
	response.OK(c, item)
}

// DeleteResponse godoc
// @Summary      Javobni o'chirish (admin)
// @Tags         Survey Responses Admin
// @Security     BearerAuth
// @Param        responseId  path  int  true  "Javob ID"
// @Success      204
// @Router       /bot/surveys/responses/{responseId} [delete]
func (h *SurveyAdminHandler) DeleteResponse(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("responseId"), 10, 64)
	if err != nil || id < 1 {
		response.BadRequest(c, "invalid response id")
		return
	}
	if err := h.service.AdminDeleteResponse(c.Request.Context(), id); err != nil {
		handleSurveyResponseError(c, err)
		return
	}
	response.NoContent(c)
}

func parseAdminResponseFilter(c *gin.Context) dto.AdminSurveyResponseFilter {
	filter := dto.AdminSurveyResponseFilter{
		SurveyRef:  c.Query("survey"),
		From:       c.Query("from"),
		To:         c.Query("to"),
		Search:     c.Query("search"),
		QuestionID: c.Query("question_id"),
		Sort:       c.Query("sort"),
	}
	if page, err := strconv.Atoi(c.Query("page")); err == nil && page > 0 {
		filter.Page = page
	}
	if limit, err := strconv.Atoi(c.Query("limit")); err == nil && limit > 0 {
		filter.Limit = limit
	}
	return filter
}

func handleSurveyResponseError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, repository.ErrSurveyNotFound):
		response.NotFound(c, "survey not found")
	case errors.Is(err, repository.ErrSurveyResponseNotFound), errors.Is(err, service.ErrSurveyResponseNotFound):
		response.NotFound(c, "survey response not found")
	case errors.Is(err, service.ErrInvalidSurveyResponseFilter):
		response.BadRequest(c, "invalid filter: from/to must be YYYY-MM-DD")
	default:
		response.InternalError(c, "survey response request failed", err)
	}
}
