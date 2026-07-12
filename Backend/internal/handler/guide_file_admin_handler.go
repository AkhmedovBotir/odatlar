package handler

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
)

type GuideFileAdminHandler struct {
	service *service.GuideFileService
}

func NewGuideFileAdminHandler(svc *service.GuideFileService) *GuideFileAdminHandler {
	return &GuideFileAdminHandler{service: svc}
}

// List godoc
// @Summary      Qo'llanma fayllari ro'yxati (admin)
// @Tags         Guide Files
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  dto.GuideFileListResponse
// @Router       /bot/guides/files [get]
func (h *GuideFileAdminHandler) List(c *gin.Context) {
	items, err := h.service.AdminList(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to list guide files", err)
		return
	}
	response.OK(c, items)
}

// Create godoc
// @Summary      Yangi qo'llanma fayli
// @Tags         Guide Files
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body  dto.CreateGuideFileRequest  true  "Fayl"
// @Success      201   {object}  dto.GuideFileResponse
// @Router       /bot/guides/files [post]
func (h *GuideFileAdminHandler) Create(c *gin.Context) {
	var req dto.CreateGuideFileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	item, err := h.service.AdminCreate(c.Request.Context(), req)
	if err != nil {
		handleGuideFileError(c, err)
		return
	}
	response.Created(c, item)
}

// Get godoc
// @Summary      Bitta qo'llanma fayli (admin)
// @Tags         Guide Files
// @Produce      json
// @Security     BearerAuth
// @Param        id   path  string  true  "Fayl slug yoki ID"
// @Success      200  {object}  dto.GuideFileResponse
// @Router       /bot/guides/files/{id} [get]
func (h *GuideFileAdminHandler) Get(c *gin.Context) {
	item, err := h.service.AdminGet(c.Request.Context(), c.Param("id"))
	if err != nil {
		handleGuideFileError(c, err)
		return
	}
	response.OK(c, item)
}

// Update godoc
// @Summary      Qo'llanma faylini yangilash
// @Tags         Guide Files
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path  string  true  "Fayl slug yoki ID"
// @Param        body  body  dto.UpdateGuideFileRequest  true  "Fayl"
// @Success      200   {object}  dto.GuideFileResponse
// @Router       /bot/guides/files/{id} [put]
func (h *GuideFileAdminHandler) Update(c *gin.Context) {
	var req dto.UpdateGuideFileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	item, err := h.service.AdminUpdate(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		handleGuideFileError(c, err)
		return
	}
	response.OK(c, item)
}

// Delete godoc
// @Summary      Qo'llanma faylini o'chirish
// @Tags         Guide Files
// @Security     BearerAuth
// @Param        id   path  string  true  "Fayl slug yoki ID"
// @Success      204
// @Router       /bot/guides/files/{id} [delete]
func (h *GuideFileAdminHandler) Delete(c *gin.Context) {
	if err := h.service.AdminDelete(c.Request.Context(), c.Param("id")); err != nil {
		handleGuideFileError(c, err)
		return
	}
	response.NoContent(c)
}

func handleGuideFileError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, repository.ErrGuideFileNotFound):
		response.NotFound(c, "guide file not found")
	case errors.Is(err, service.ErrInvalidGuideFileSlug):
		response.BadRequest(c, "slug must be lowercase letters, numbers and hyphens")
	case errors.Is(err, service.ErrDuplicateGuideFileSlug):
		response.BadRequest(c, "file slug already exists")
	case errors.Is(err, service.ErrInvalidGuideFileURL):
		response.BadRequest(c, "url must be an http(s) URL or uploaded file path")
	default:
		response.InternalError(c, "guide file request failed", err)
	}
}
