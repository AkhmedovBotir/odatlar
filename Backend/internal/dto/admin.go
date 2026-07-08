package dto

import "github.com/odatlar-bot/backend/internal/domain"

type CreateAdminRequest struct {
	FirstName string `json:"first_name" binding:"required,min=2,max=100"`
	LastName  string `json:"last_name" binding:"required,min=2,max=100"`
	Phone     string `json:"phone" binding:"required,min=9,max=20"`
	Username  string `json:"username" binding:"required,min=3,max=50,alphanum"`
	Password  string `json:"password" binding:"required,min=8,max=72"`
}

type UpdateAdminRequest struct {
	FirstName string `json:"first_name" binding:"omitempty,min=2,max=100"`
	LastName  string `json:"last_name" binding:"omitempty,min=2,max=100"`
	Phone     string `json:"phone" binding:"omitempty,min=9,max=20"`
	Username  string `json:"username" binding:"omitempty,min=3,max=50,alphanum"`
	Password  string `json:"password" binding:"omitempty,min=8,max=72"`
}

type UpdateStatusRequest struct {
	Status domain.AdminStatus `json:"status" binding:"required,oneof=active inactive"`
}

type AdminResponse struct {
	ID        string             `json:"id"`
	FirstName string             `json:"first_name"`
	LastName  string             `json:"last_name"`
	Phone     string             `json:"phone"`
	Username  string             `json:"username"`
	Status    domain.AdminStatus `json:"status"`
	CreatedAt string             `json:"created_at"`
	UpdatedAt string             `json:"updated_at"`
}

type AdminListResponse struct {
	Data  []AdminResponse `json:"data"`
	Total int64           `json:"total"`
	Page  int             `json:"page"`
	Limit int             `json:"limit"`
}
