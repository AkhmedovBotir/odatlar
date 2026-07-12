package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
)

type GuideVideoHandler struct {
	service *service.GuideVideoService
}

func NewGuideVideoHandler(svc *service.GuideVideoService) *GuideVideoHandler {
	return &GuideVideoHandler{service: svc}
}

// List godoc
// @Summary      Qo'llanma videolari ro'yxati (WebApp)
// @Tags         Guide Videos
// @Produce      json
// @Security     TelegramInitData
// @Success      200  {object}  dto.GuideVideoListResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot-runtime/guides/videos [get]
func (h *GuideVideoHandler) List(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}
	items, err := h.service.ListPublished(c.Request.Context(), tgUser)
	if err != nil {
		handleGuideVideoError(c, err)
		return
	}
	response.OK(c, items)
}

// Get godoc
// @Summary      Qo'llanma videosi (WebApp)
// @Tags         Guide Videos
// @Produce      json
// @Security     TelegramInitData
// @Param        id  path  int  true  "Video ID"
// @Success      200  {object}  dto.GuideVideoResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot-runtime/guides/videos/{id} [get]
func (h *GuideVideoHandler) Get(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}
	id, err := parseGuideVideoID(c)
	if err != nil {
		return
	}
	item, err := h.service.GetPublished(c.Request.Context(), tgUser, id)
	if err != nil {
		handleGuideVideoError(c, err)
		return
	}
	response.OK(c, item)
}

// ToggleLike godoc
// @Summary      Videoga like qo'yish/olib tashlash
// @Tags         Guide Videos
// @Produce      json
// @Security     TelegramInitData
// @Param        id  path  int  true  "Video ID"
// @Success      200  {object}  dto.GuideVideoLikeResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot-runtime/guides/videos/{id}/like [post]
func (h *GuideVideoHandler) ToggleLike(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}
	id, err := parseGuideVideoID(c)
	if err != nil {
		return
	}
	result, err := h.service.ToggleLike(c.Request.Context(), tgUser, id)
	if err != nil {
		handleGuideVideoError(c, err)
		return
	}
	response.OK(c, result)
}

// ListComments godoc
// @Summary      Video izohlari ro'yxati
// @Tags         Guide Videos
// @Produce      json
// @Security     TelegramInitData
// @Param        id  path  int  true  "Video ID"
// @Success      200  {object}  dto.GuideVideoCommentListResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot-runtime/guides/videos/{id}/comments [get]
func (h *GuideVideoHandler) ListComments(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}
	id, err := parseGuideVideoID(c)
	if err != nil {
		return
	}
	items, err := h.service.ListComments(c.Request.Context(), tgUser, id)
	if err != nil {
		handleGuideVideoError(c, err)
		return
	}
	response.OK(c, items)
}

// AddComment godoc
// @Summary      Videoga izoh qo'shish
// @Tags         Guide Videos
// @Accept       json
// @Produce      json
// @Security     TelegramInitData
// @Param        id    path      int                              true  "Video ID"
// @Param        body  body      dto.CreateGuideVideoCommentRequest  true  "Izoh matni"
// @Success      201   {object}  dto.GuideVideoCommentResponse
// @Failure      400   {object}  response.ErrorBody
// @Failure      401   {object}  response.ErrorBody
// @Failure      404   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /bot-runtime/guides/videos/{id}/comments [post]
func (h *GuideVideoHandler) AddComment(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}
	id, err := parseGuideVideoID(c)
	if err != nil {
		return
	}
	var req dto.CreateGuideVideoCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	item, err := h.service.AddComment(c.Request.Context(), tgUser, id, req)
	if err != nil {
		handleGuideVideoError(c, err)
		return
	}
	response.Created(c, item)
}
