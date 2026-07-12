package handler

import (
	"errors"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
	"github.com/odatlar-bot/backend/pkg/upload"
)

type SurveyHandler struct {
	service *service.SurveyService
}

func NewSurveyHandler(svc *service.SurveyService) *SurveyHandler {
	return &SurveyHandler{service: svc}
}

// List godoc
// @Summary      Nashr qilingan so'rovnomalar ro'yxati
// @Description  Autentifikatsiya talab qilinmaydi
// @Tags         Survey Responses
// @Produce      json
// @Success      200  {object}  dto.PublicSurveyListResponse
// @Failure      500  {object}  response.ErrorBody
// @Router       /surveys [get]
func (h *SurveyHandler) List(c *gin.Context) {
	items, err := h.service.ListPublished(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to list surveys", err)
		return
	}
	response.OK(c, items)
}

// Get godoc
// @Summary      So'rovnoma tafsilotlari (javob berish uchun)
// @Description  Autentifikatsiya talab qilinmaydi. Faqat published yoki closed holatdagi so'rovnomalar.
// @Tags         Survey Responses
// @Produce      json
// @Param        id  path  string  true  "So'rovnoma slug yoki ID"
// @Success      200  {object}  dto.PublicSurveyResponse
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /surveys/{id} [get]
func (h *SurveyHandler) Get(c *gin.Context) {
	item, err := h.service.GetPublic(c.Request.Context(), c.Param("id"))
	if err != nil {
		handlePublicSurveyError(c, err)
		return
	}
	response.OK(c, item)
}

// Submit godoc
// @Summary      So'rovnomaga javob yuborish
// @Description  Autentifikatsiya talab qilinmaydi. Faqat published holatda qabul qilinadi.
// @Tags         Survey Responses
// @Accept       json
// @Produce      json
// @Param        id    path  string                         true  "So'rovnoma slug yoki ID"
// @Param        body  body  dto.SubmitSurveyResponseRequest  true  "Javoblar"
// @Success      201   {object}  dto.SubmitSurveyResponseResult
// @Failure      400   {object}  response.ErrorBody
// @Failure      404   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /surveys/{id}/responses [post]
func (h *SurveyHandler) Submit(c *gin.Context) {
	var req dto.SubmitSurveyResponseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	item, err := h.service.SubmitResponse(c.Request.Context(), c.Param("id"), req)
	if err != nil {
		handlePublicSurveyError(c, err)
		return
	}
	response.Created(c, item)
}

// Upload godoc
// @Summary      So'rovnoma javobi uchun fayl yuklash
// @Description  Autentifikatsiya talab qilinmaydi. questionId — fayl savolining id maydoni.
// @Tags         Survey Responses
// @Accept       multipart/form-data
// @Produce      json
// @Param        id          path      string  true  "So'rovnoma slug yoki ID"
// @Param        questionId  formData  string  true  "Savol ID"
// @Param        file        formData  file    true  "Yuklanadigan fayl"
// @Success      201         {object}  upload.SavedFile
// @Failure      400         {object}  response.ErrorBody
// @Failure      404         {object}  response.ErrorBody
// @Failure      500         {object}  response.ErrorBody
// @Router       /surveys/{id}/upload [post]
func (h *SurveyHandler) Upload(c *gin.Context) {
	questionID := strings.TrimSpace(c.PostForm("questionId"))
	if questionID == "" {
		response.BadRequest(c, "questionId is required")
		return
	}
	file, err := c.FormFile("file")
	if err != nil {
		response.BadRequest(c, "file is required")
		return
	}
	saved, err := h.service.UploadResponseFile(c.Request.Context(), c.Param("id"), questionID, file)
	if err != nil {
		handlePublicSurveyError(c, err)
		return
	}
	response.Created(c, saved)
}

func handlePublicSurveyError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, repository.ErrSurveyNotFound):
		response.NotFound(c, "survey not found")
	case errors.Is(err, service.ErrSurveyNotAcceptingResponses):
		response.BadRequest(c, "survey is not accepting responses")
	case errors.Is(err, service.ErrSurveyQuestionNotFound):
		response.NotFound(c, "survey question not found")
	case errors.Is(err, service.ErrInvalidSurveyFileQuestion):
		response.BadRequest(c, "question is not a file upload type")
	case errors.Is(err, service.ErrInvalidSurveyAnswers):
		response.BadRequest(c, err.Error())
	case errors.Is(err, upload.ErrFileTooLarge):
		response.BadRequest(c, "file too large")
	case errors.Is(err, upload.ErrInvalidFileType):
		response.BadRequest(c, "invalid file type")
	case errors.Is(err, upload.ErrEmptyFile):
		response.BadRequest(c, "empty file")
	default:
		response.InternalError(c, "survey request failed", err)
	}
}
