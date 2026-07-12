package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
)

type GuideFileHandler struct {
	service *service.GuideFileService
}

func NewGuideFileHandler(svc *service.GuideFileService) *GuideFileHandler {
	return &GuideFileHandler{service: svc}
}

var _ dto.GuideFileListResponse

// List godoc
// @Summary      Fayllar ro'yxati (WebApp)
// @Tags         Guide Files
// @Produce      json
// @Security     TelegramInitData
// @Success      200  {object}  dto.GuideFileListResponse
// @Failure      500  {object}  response.ErrorBody
// @Router       /bot-runtime/guides/files [get]
func (h *GuideFileHandler) List(c *gin.Context) {
	items, err := h.service.ListPublished(c.Request.Context())
	if err != nil {
		handleGuideFileError(c, err)
		return
	}
	response.OK(c, items)
}
