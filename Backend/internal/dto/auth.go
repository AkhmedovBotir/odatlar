package dto

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string        `json:"token"`
	Admin AdminResponse `json:"admin"`
}

type ProfileResponse struct {
	Admin AdminResponse `json:"admin"`
}
