package handler

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
)

type GuideCourseAdminHandler struct {
	service *service.GuideCourseService
}

func NewGuideCourseAdminHandler(svc *service.GuideCourseService) *GuideCourseAdminHandler {
	return &GuideCourseAdminHandler{service: svc}
}

// List godoc
// @Summary      Qo'llanma kurslari ro'yxati (admin)
// @Tags         Guide Courses
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  dto.GuideCourseListResponse
// @Router       /bot/guides/courses [get]
func (h *GuideCourseAdminHandler) List(c *gin.Context) {
	items, err := h.service.AdminList(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to list guide courses", err)
		return
	}
	response.OK(c, items)
}

// Create godoc
// @Summary      Yangi qo'llanma kursi
// @Tags         Guide Courses
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body  dto.CreateGuideCourseRequest  true  "Kurs"
// @Success      201   {object}  dto.GuideCourseResponse
// @Router       /bot/guides/courses [post]
func (h *GuideCourseAdminHandler) Create(c *gin.Context) {
	var req dto.CreateGuideCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	item, err := h.service.AdminCreate(c.Request.Context(), req)
	if err != nil {
		handleGuideCourseError(c, err)
		return
	}
	response.Created(c, item)
}

// Get godoc
// @Summary      Bitta qo'llanma kursi (admin)
// @Tags         Guide Courses
// @Produce      json
// @Security     BearerAuth
// @Param        id   path  string  true  "Kurs slug yoki ID"
// @Success      200  {object}  dto.GuideCourseResponse
// @Router       /bot/guides/courses/{id} [get]
func (h *GuideCourseAdminHandler) Get(c *gin.Context) {
	item, err := h.service.AdminGet(c.Request.Context(), c.Param("id"))
	if err != nil {
		handleGuideCourseError(c, err)
		return
	}
	response.OK(c, item)
}

// Update godoc
// @Summary      Qo'llanma kursini yangilash
// @Tags         Guide Courses
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path  string  true  "Kurs slug yoki ID"
// @Param        body  body  dto.UpdateGuideCourseRequest  true  "Kurs"
// @Success      200   {object}  dto.GuideCourseResponse
// @Router       /bot/guides/courses/{id} [put]
func (h *GuideCourseAdminHandler) Update(c *gin.Context) {
	var req dto.UpdateGuideCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	item, err := h.service.AdminUpdate(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		handleGuideCourseError(c, err)
		return
	}
	response.OK(c, item)
}

// Delete godoc
// @Summary      Qo'llanma kursini o'chirish
// @Tags         Guide Courses
// @Security     BearerAuth
// @Param        id   path  string  true  "Kurs slug yoki ID"
// @Success      204
// @Router       /bot/guides/courses/{id} [delete]
func (h *GuideCourseAdminHandler) Delete(c *gin.Context) {
	if err := h.service.AdminDelete(c.Request.Context(), c.Param("id")); err != nil {
		handleGuideCourseError(c, err)
		return
	}
	response.NoContent(c)
}

func handleGuideCourseError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, repository.ErrGuideCourseNotFound):
		response.NotFound(c, "guide course not found")
	case errors.Is(err, service.ErrGuideLessonNotFound):
		response.NotFound(c, "guide lesson not found")
	case errors.Is(err, service.ErrInvalidCourseSlug):
		response.BadRequest(c, "slug must be lowercase letters, numbers and hyphens")
	case errors.Is(err, service.ErrDuplicateCourseSlug):
		response.BadRequest(c, "course slug already exists")
	case errors.Is(err, service.ErrInvalidCourseContent):
		response.BadRequest(c, err.Error())
	default:
		response.InternalError(c, "guide course request failed", err)
	}
}
