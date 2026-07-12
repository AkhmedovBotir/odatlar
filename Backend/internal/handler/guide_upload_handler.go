package handler

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/pkg/response"
	"github.com/odatlar-bot/backend/pkg/upload"
)

type GuideUploadHandler struct {
	storage *upload.Storage
}

func NewGuideUploadHandler(storage *upload.Storage) *GuideUploadHandler {
	return &GuideUploadHandler{storage: storage}
}

// UploadPoster godoc
// @Summary      Poster rasm yuklash
// @Description  Faqat rasm fayli (jpg, png, webp, gif). JSON orqali URL qabul qilinmaydi.
// @Tags         Guide Videos
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        file  formData  file  true  "Poster rasm"
// @Success      201   {object}  upload.SavedFile
// @Router       /bot/guides/upload/poster [post]
func (h *GuideUploadHandler) UploadPoster(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		response.BadRequest(c, "file is required")
		return
	}
	saved, err := h.storage.SavePoster(file)
	if err != nil {
		handleUploadError(c, err)
		return
	}
	response.Created(c, saved)
}

// UploadVideo godoc
// @Summary      Video fayl yuklash
// @Description  Video fayl (mp4, webm, mov). Tashqi URL o'rniga yuklangan path ishlatiladi.
// @Tags         Guide Videos
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        file  formData  file  true  "Video fayl"
// @Success      201   {object}  upload.SavedFile
// @Router       /bot/guides/upload/video [post]
func (h *GuideUploadHandler) UploadVideo(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		response.BadRequest(c, "file is required")
		return
	}
	saved, err := h.storage.SaveVideo(file)
	if err != nil {
		handleUploadError(c, err)
		return
	}
	response.Created(c, saved)
}

// UploadFile godoc
// @Summary      Qo'llanma fayli yuklash
// @Description  Hujjat fayl (pdf, txt, doc, docx, zip va boshqalar)
// @Tags         Guide Files
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        file  formData  file  true  "Fayl"
// @Success      201   {object}  upload.SavedFile
// @Router       /bot/guides/upload/file [post]
func (h *GuideUploadHandler) UploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		response.BadRequest(c, "file is required")
		return
	}
	saved, err := h.storage.SaveGuideFile(file)
	if err != nil {
		handleUploadError(c, err)
		return
	}
	response.Created(c, saved)
}

func handleUploadError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, upload.ErrFileTooLarge):
		response.BadRequest(c, "file too large")
	case errors.Is(err, upload.ErrInvalidFileType):
		response.BadRequest(c, "invalid file type")
	case errors.Is(err, upload.ErrEmptyFile):
		response.BadRequest(c, "empty file")
	default:
		response.InternalError(c, "upload failed", err)
	}
}
