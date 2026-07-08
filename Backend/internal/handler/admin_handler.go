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

type AdminHandler struct {
	service *service.AdminService
}

func NewAdminHandler(svc *service.AdminService) *AdminHandler {
	return &AdminHandler{service: svc}
}

// Create godoc
// @Summary      Yangi admin yaratish
// @Description  Yangi admin foydalanuvchisini yaratadi
// @Tags         Admins
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      dto.CreateAdminRequest  true  "Admin ma'lumotlari"
// @Success      201   {object}  dto.AdminResponse
// @Failure      400   {object}  response.ErrorBody
// @Failure      401   {object}  response.ErrorBody
// @Failure      409   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /admins [post]
func (h *AdminHandler) Create(c *gin.Context) {
	var req dto.CreateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	admin, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrAdminExists) {
			response.Conflict(c, err.Error())
			return
		}
		response.InternalError(c, "failed to create admin", err)
		return
	}

	response.Created(c, admin)
}

// List godoc
// @Summary      Adminlar ro'yxati
// @Description  Barcha adminlarni sahifalangan holda qaytaradi
// @Tags         Admins
// @Produce      json
// @Security     BearerAuth
// @Param        page   query     int  false  "Sahifa raqami"  default(1)
// @Param        limit  query     int  false  "Sahifa hajmi"   default(10)
// @Success      200    {object}  dto.AdminListResponse
// @Failure      401    {object}  response.ErrorBody
// @Failure      500    {object}  response.ErrorBody
// @Router       /admins [get]
func (h *AdminHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	result, err := h.service.List(c.Request.Context(), page, limit)
	if err != nil {
		response.InternalError(c, "failed to list admins", err)
		return
	}

	response.OK(c, result)
}

// GetByID godoc
// @Summary      Adminni ID bo'yicha olish
// @Description  Bitta admin ma'lumotlarini qaytaradi
// @Tags         Admins
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Admin ID"
// @Success      200  {object}  dto.AdminResponse
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /admins/{id} [get]
func (h *AdminHandler) GetByID(c *gin.Context) {
	id, err := parseID(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid admin id")
		return
	}

	admin, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrAdminNotFound) {
			response.NotFound(c, "admin not found")
			return
		}
		response.InternalError(c, "failed to get admin", err)
		return
	}

	response.OK(c, admin)
}

// Update godoc
// @Summary      Adminni yangilash
// @Description  Admin ma'lumotlarini yangilaydi
// @Tags         Admins
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string  true  "Admin ID"
// @Param        body  body      dto.UpdateAdminRequest  true  "Yangilash ma'lumotlari"
// @Success      200   {object}  dto.AdminResponse
// @Failure      400   {object}  response.ErrorBody
// @Failure      401   {object}  response.ErrorBody
// @Failure      404   {object}  response.ErrorBody
// @Failure      409   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /admins/{id} [put]
func (h *AdminHandler) Update(c *gin.Context) {
	id, err := parseID(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid admin id")
		return
	}

	var req dto.UpdateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	admin, err := h.service.Update(c.Request.Context(), id, req)
	if err != nil {
		if errors.Is(err, repository.ErrAdminNotFound) {
			response.NotFound(c, "admin not found")
			return
		}
		if errors.Is(err, service.ErrAdminExists) {
			response.Conflict(c, err.Error())
			return
		}
		response.InternalError(c, "failed to update admin", err)
		return
	}

	response.OK(c, admin)
}

// UpdateStatus godoc
// @Summary      Admin statusini yangilash
// @Description  Admin statusini active yoki inactive qiladi
// @Tags         Admins
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string  true  "Admin ID"
// @Param        body  body      dto.UpdateStatusRequest  true  "Status ma'lumotlari"
// @Success      200   {object}  dto.AdminResponse
// @Failure      400   {object}  response.ErrorBody
// @Failure      401   {object}  response.ErrorBody
// @Failure      404   {object}  response.ErrorBody
// @Failure      500   {object}  response.ErrorBody
// @Router       /admins/{id}/status [patch]
func (h *AdminHandler) UpdateStatus(c *gin.Context) {
	id, err := parseID(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid admin id")
		return
	}

	var req dto.UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	admin, err := h.service.UpdateStatus(c.Request.Context(), id, req.Status)
	if err != nil {
		if errors.Is(err, repository.ErrAdminNotFound) {
			response.NotFound(c, "admin not found")
			return
		}
		response.InternalError(c, "failed to update admin status", err)
		return
	}

	response.OK(c, admin)
}

// Delete godoc
// @Summary      Adminni o'chirish
// @Description  Adminni tizimdan o'chiradi
// @Tags         Admins
// @Produce      json
// @Security     BearerAuth
// @Param        id   path  string  true  "Admin ID (UUID)"
// @Success      204
// @Failure      401  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Failure      500  {object}  response.ErrorBody
// @Router       /admins/{id} [delete]
func (h *AdminHandler) Delete(c *gin.Context) {
	id, err := parseID(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid admin id")
		return
	}

	if err := h.service.Delete(c.Request.Context(), id); err != nil {
		if errors.Is(err, repository.ErrAdminNotFound) {
			response.NotFound(c, "admin not found")
			return
		}
		response.InternalError(c, "failed to delete admin", err)
		return
	}

	response.NoContent(c)
}

func parseID(idStr string) (string, error) {
	if _, err := strconv.ParseInt(idStr, 10, 64); err != nil {
		return "", err
	}
	return idStr, nil
}
