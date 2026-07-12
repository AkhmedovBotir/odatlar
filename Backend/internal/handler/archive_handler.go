package handler

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
)

type ArchiveHandler struct {
	service *service.ArchiveService
}

func NewArchiveHandler(svc *service.ArchiveService) *ArchiveHandler {
	return &ArchiveHandler{service: svc}
}

var _ dto.ArchiveResponse

// Get godoc
// @Summary      Arxiv ma'lumotlari
// @Description  Belgilangan davr uchun amaliyot/ko'rsatkich arxivi
// @Tags         Archive
// @Produce      json
// @Security     TelegramInitData
// @Param        kind  query  string  false  "Turi (practice, indicator yoki bo'sh — hammasi)"
// @Param        from  query  string  true   "Boshlanish sanasi (YYYY-MM-DD)"
// @Param        to    query  string  true   "Tugash sanasi (YYYY-MM-DD)"
// @Success      200   {object}  dto.ArchiveResponse
// @Failure      400   {object}  response.ErrorBody
// @Failure      401   {object}  response.ErrorBody
// @Failure      404   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /bot-runtime/archive [get]
func (h *ArchiveHandler) Get(c *gin.Context) {
	tgUser := getTelegramUser(c)
	if tgUser == nil {
		return
	}

	kind := c.Query("kind")
	from := c.Query("from")
	to := c.Query("to")
	if from == "" || to == "" {
		response.BadRequest(c, "from and to are required")
		return
	}

	result, err := h.service.GetArchive(c.Request.Context(), tgUser, kind, from, to)
	if err != nil {
		handleArchiveError(c, err)
		return
	}
	response.OK(c, result)
}

func handleArchiveError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrRuntimeBotUserNotFound):
		response.NotFound(c, "bot user not found")
	default:
		if err.Error() == "invalid from date" || err.Error() == "invalid to date" {
			response.BadRequest(c, err.Error())
			return
		}
		response.InternalError(c, "archive request failed", err)
	}
}
