package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
)

type GuideCourseHandler struct {
	service *service.GuideCourseService
}

func NewGuideCourseHandler(svc *service.GuideCourseService) *GuideCourseHandler {
	return &GuideCourseHandler{service: svc}
}

var (
	_ dto.GuideCourseListResponse
	_ dto.GuideCourseResponse
	_ dto.GuideLessonResponse
)

// List godoc
// @Summary      Kurslar ro'yxati (WebApp)
// @Tags         Guide Courses
// @Produce      json
// @Security     TelegramInitData
// @Success      200  {object}  dto.GuideCourseListResponse
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot-runtime/guides/courses [get]
func (h *GuideCourseHandler) List(c *gin.Context) {
	items, err := h.service.ListPublished(c.Request.Context())
	if err != nil {
		handleGuideCourseError(c, err)
		return
	}
	response.OK(c, items)
}

// Get godoc
// @Summary      Kurs tafsilotlari (WebApp)
// @Tags         Guide Courses
// @Produce      json
// @Security     TelegramInitData
// @Param        id  path  string  true  "Kurs slug yoki ID"
// @Success      200  {object}  dto.GuideCourseResponse
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot-runtime/guides/courses/{id} [get]
func (h *GuideCourseHandler) Get(c *gin.Context) {
	item, err := h.service.GetPublished(c.Request.Context(), c.Param("id"))
	if err != nil {
		handleGuideCourseError(c, err)
		return
	}
	response.OK(c, item)
}

// GetLesson godoc
// @Summary      Dars tafsilotlari (WebApp)
// @Tags         Guide Courses
// @Produce      json
// @Security     TelegramInitData
// @Param        lessonId  path  string  true  "Dars ID"
// @Success      200       {object}  dto.GuideLessonResponse
// @Failure      404       {object}  response.ErrorBody
// @Failure      500       {object}  response.ErrorBody
// @Router       /bot-runtime/guides/lessons/{lessonId} [get]
func (h *GuideCourseHandler) GetLesson(c *gin.Context) {
	item, err := h.service.GetLesson(c.Request.Context(), c.Param("lessonId"))
	if err != nil {
		handleGuideCourseError(c, err)
		return
	}
	response.OK(c, item)
}
