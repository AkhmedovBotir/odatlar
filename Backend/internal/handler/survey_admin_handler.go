package handler

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
)

type SurveyAdminHandler struct {
	service *service.SurveyService
}

func NewSurveyAdminHandler(svc *service.SurveyService) *SurveyAdminHandler {
	return &SurveyAdminHandler{service: svc}
}

// ListFileFormats godoc
// @Summary      Fayl yuklash savol turlari ro'yxati (admin)
// @Tags         Surveys
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  dto.SurveyFileFormatListResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/surveys/file-formats [get]
func (h *SurveyAdminHandler) ListFileFormats(c *gin.Context) {
	items, err := h.service.AdminListFileFormats(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to list survey file formats", err)
		return
	}
	response.OK(c, items)
}

// List godoc
// @Summary      So'rovnomalar ro'yxati (admin)
// @Tags         Surveys
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  dto.SurveyListResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/surveys [get]
func (h *SurveyAdminHandler) List(c *gin.Context) {
	items, err := h.service.AdminList(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to list surveys", err)
		return
	}
	response.OK(c, items)
}

// Create godoc
// @Summary      Yangi so'rovnoma yaratish (admin)
// @Tags         Surveys
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      dto.CreateSurveyRequest  true  "So'rovnoma"
// @Success      201   {object}  dto.SurveyResponse
// @Failure      400   {object}  response.ErrorBody
// @Failure      401   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /bot/surveys [post]
func (h *SurveyAdminHandler) Create(c *gin.Context) {
	var req dto.CreateSurveyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	item, err := h.service.AdminCreate(c.Request.Context(), req)
	if err != nil {
		handleSurveyError(c, err)
		return
	}
	response.Created(c, item)
}

// Get godoc
// @Summary      So'rovnoma tafsilotlari (admin)
// @Tags         Surveys
// @Produce      json
// @Security     BearerAuth
// @Param        id  path  string  true  "So'rovnoma slug yoki ID"
// @Success      200  {object}  dto.SurveyResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/surveys/{id} [get]
func (h *SurveyAdminHandler) Get(c *gin.Context) {
	item, err := h.service.AdminGet(c.Request.Context(), c.Param("id"))
	if err != nil {
		handleSurveyError(c, err)
		return
	}
	response.OK(c, item)
}

// Update godoc
// @Summary      So'rovnomani yangilash (admin)
// @Tags         Surveys
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                   true  "So'rovnoma slug yoki ID"
// @Param        body  body      dto.UpdateSurveyRequest  true  "Yangilangan ma'lumotlar"
// @Success      200   {object}  dto.SurveyResponse
// @Failure      400   {object}  response.ErrorBody
// @Failure      401   {object}  response.ErrorBody
// @Failure      404   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /bot/surveys/{id} [put]
func (h *SurveyAdminHandler) Update(c *gin.Context) {
	var req dto.UpdateSurveyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	item, err := h.service.AdminUpdate(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		handleSurveyError(c, err)
		return
	}
	response.OK(c, item)
}

// Delete godoc
// @Summary      So'rovnomani o'chirish (admin)
// @Tags         Surveys
// @Security     BearerAuth
// @Param        id  path  string  true  "So'rovnoma slug yoki ID"
// @Success      204
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/surveys/{id} [delete]
func (h *SurveyAdminHandler) Delete(c *gin.Context) {
	if err := h.service.AdminDelete(c.Request.Context(), c.Param("id")); err != nil {
		handleSurveyError(c, err)
		return
	}
	response.NoContent(c)
}

// Publish godoc
// @Summary      So'rovnomani nashr qilish (admin)
// @Description  Draft holatdagi so'rovnomani foydalanuvchilarga ochadi
// @Tags         Surveys
// @Produce      json
// @Security     BearerAuth
// @Param        id  path  string  true  "So'rovnoma slug yoki ID"
// @Success      200  {object}  dto.SurveyResponse
// @Failure      400  {object}  response.ErrorBody
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/surveys/{id}/publish [post]
func (h *SurveyAdminHandler) Publish(c *gin.Context) {
	item, err := h.service.AdminPublish(c.Request.Context(), c.Param("id"))
	if err != nil {
		handleSurveyError(c, err)
		return
	}
	response.OK(c, item)
}

// Close godoc
// @Summary      So'rovnomani yopish (admin)
// @Description  Nashr qilingan so'rovnomani yopadi (javoblar qabul qilinmaydi)
// @Tags         Surveys
// @Produce      json
// @Security     BearerAuth
// @Param        id  path  string  true  "So'rovnoma slug yoki ID"
// @Success      200  {object}  dto.SurveyResponse
// @Failure      400  {object}  response.ErrorBody
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot/surveys/{id}/close [post]
func (h *SurveyAdminHandler) Close(c *gin.Context) {
	item, err := h.service.AdminClose(c.Request.Context(), c.Param("id"))
	if err != nil {
		handleSurveyError(c, err)
		return
	}
	response.OK(c, item)
}

func handleSurveyError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, repository.ErrSurveyNotFound):
		response.NotFound(c, "survey not found")
	case errors.Is(err, service.ErrInvalidSurveySlug):
		response.BadRequest(c, "slug must be lowercase letters, numbers and hyphens")
	case errors.Is(err, service.ErrDuplicateSurveySlug):
		response.BadRequest(c, "survey slug already exists")
	case errors.Is(err, service.ErrInvalidSurveyQuestions):
		response.BadRequest(c, err.Error())
	case errors.Is(err, service.ErrInvalidSurveySettings):
		response.BadRequest(c, "invalid survey settings")
	case errors.Is(err, service.ErrSurveyNotDraft):
		response.BadRequest(c, "only draft surveys can be published")
	case errors.Is(err, service.ErrSurveyNotPublished):
		response.BadRequest(c, "only published surveys can be closed")
	case errors.Is(err, service.ErrSurveyClosed):
		response.BadRequest(c, "closed surveys cannot be edited")
	default:
		response.InternalError(c, "survey request failed", err)
	}
}
