package dto

type BotRuntimeConfigResponse struct {
	IsActive    bool        `json:"is_active"`
	BotToken    string      `json:"bot_token"`
	BotUsername string      `json:"bot_username"`
	Start       BotStartDTO `json:"start"`
	UpdatedAt   string      `json:"updated_at"`
}

type BotStartUserRequest struct {
	TelegramID   int64  `json:"telegram_id" binding:"required"`
	FirstName    string `json:"first_name" binding:"max=100"`
	LastName     string `json:"last_name" binding:"max=100"`
	Username     string `json:"username" binding:"max=100"`
	Phone        string `json:"phone" binding:"max=20"`
	LanguageCode string `json:"language_code" binding:"max=10"`
	AvatarURL    string `json:"avatar_url" binding:"max=500"`
	IsBot        bool   `json:"is_bot"`
	IsPremium    bool   `json:"is_premium"`
}

type BotWebAppOpenRequest struct {
	TelegramID   int64  `json:"telegram_id" binding:"required"`
	FirstName    string `json:"first_name" binding:"max=100"`
	LastName     string `json:"last_name" binding:"max=100"`
	Username     string `json:"username" binding:"max=100"`
	Phone        string `json:"phone" binding:"max=20"`
	LanguageCode string `json:"language_code" binding:"max=10"`
	AvatarURL    string `json:"avatar_url" binding:"max=500"`
	IsBot        bool   `json:"is_bot"`
	IsPremium    bool   `json:"is_premium"`
}

type BotMeRequest struct {
	TelegramID int64 `json:"telegram_id" binding:"required"`
}
