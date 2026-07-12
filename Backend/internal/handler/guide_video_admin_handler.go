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

type GuideVideoAdminHandler struct {
	service *service.GuideVideoService
}

func NewGuideVideoAdminHandler(svc *service.GuideVideoService) *GuideVideoAdminHandler {
	return &GuideVideoAdminHandler{service: svc}
}

// List godoc
// @Summary      Qo'llanma videolari ro'yxati (admin)
// @Tags         Guide Videos
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  dto.GuideVideoListResponse
// @Router       /bot/guides/videos [get]
func (h *GuideVideoAdminHandler) List(c *gin.Context) {
	items, err := h.service.AdminList(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to list guide videos", err)
		return
	}
	response.OK(c, items)
}

// Create godoc
// @Summary      Yangi qo'llanma videosi
// @Tags         Guide Videos
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body  dto.CreateGuideVideoRequest  true  "Video"
// @Success      201   {object}  dto.GuideVideoResponse
// @Router       /bot/guides/videos [post]
func (h *GuideVideoAdminHandler) Create(c *gin.Context) {
	var req dto.CreateGuideVideoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	item, err := h.service.AdminCreate(c.Request.Context(), req)
	if err != nil {
		handleGuideVideoError(c, err)
		return
	}
	response.Created(c, item)
}

// Get godoc
// @Summary      Bitta qo'llanma videosi (admin)
// @Tags         Guide Videos
// @Produce      json
// @Security     BearerAuth
// @Param        id   path  int  true  "Video ID"
// @Success      200  {object}  dto.GuideVideoResponse
// @Router       /bot/guides/videos/{id} [get]
func (h *GuideVideoAdminHandler) Get(c *gin.Context) {
	id, err := parseGuideVideoID(c)
	if err != nil {
		return
	}
	item, err := h.service.AdminGet(c.Request.Context(), id)
	if err != nil {
		handleGuideVideoError(c, err)
		return
	}
	response.OK(c, item)
}

// Update godoc
// @Summary      Qo'llanma videosini yangilash
// @Tags         Guide Videos
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path  int  true  "Video ID"
// @Param        body  body  dto.UpdateGuideVideoRequest  true  "Video"
// @Success      200   {object}  dto.GuideVideoResponse
// @Router       /bot/guides/videos/{id} [put]
func (h *GuideVideoAdminHandler) Update(c *gin.Context) {
	id, err := parseGuideVideoID(c)
	if err != nil {
		return
	}
	var req dto.UpdateGuideVideoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	item, err := h.service.AdminUpdate(c.Request.Context(), id, req)
	if err != nil {
		handleGuideVideoError(c, err)
		return
	}
	response.OK(c, item)
}

// Delete godoc
// @Summary      Qo'llanma videosini o'chirish
// @Tags         Guide Videos
// @Security     BearerAuth
// @Param        id   path  int  true  "Video ID"
// @Success      204
// @Router       /bot/guides/videos/{id} [delete]
func (h *GuideVideoAdminHandler) Delete(c *gin.Context) {
	id, err := parseGuideVideoID(c)
	if err != nil {
		return
	}
	if err := h.service.AdminDelete(c.Request.Context(), id); err != nil {
		handleGuideVideoError(c, err)
		return
	}
	response.NoContent(c)
}

func parseGuideVideoID(c *gin.Context) (int64, error) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		response.BadRequest(c, "invalid id")
		return 0, err
	}
	return id, nil
}

func handleGuideVideoError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, repository.ErrGuideVideoNotFound):
		response.NotFound(c, "guide video not found")
	case errors.Is(err, service.ErrRuntimeBotUserNotFound):
		response.NotFound(c, "bot user not found")
	case errors.Is(err, service.ErrInvalidVideoSrc):
		response.BadRequest(c, "video src must be an http(s) URL or uploaded video path")
	case errors.Is(err, service.ErrInvalidPosterPath):
		response.BadRequest(c, "poster must be uploaded via /bot/guides/upload/poster")
	default:
		response.InternalError(c, "guide video request failed", err)
	}
}
