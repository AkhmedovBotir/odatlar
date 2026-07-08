package dto

type UpdateBotTokenRequest struct {
	BotToken string `json:"bot_token" binding:"required,min=20"`
}

type BotTokenResponse struct {
	HasToken    bool   `json:"has_token"`
	MaskedToken string `json:"masked_token,omitempty"`
	BotUsername string `json:"bot_username,omitempty"`
	IsActive    bool   `json:"is_active"`
}

type StartButtonDTO struct {
	Enabled   bool   `json:"enabled"`
	Text      string `json:"text" binding:"omitempty,max=64"`
	WebAppURL string `json:"web_app_url,omitempty" binding:"omitempty,url"`
}

type BotStartDTO struct {
	Message string         `json:"message" binding:"required,max=4096"`
	Button  StartButtonDTO `json:"button"`
}

type BotSettingsResponse struct {
	Token     BotTokenResponse `json:"token"`
	Start     BotStartDTO      `json:"start"`
	UpdatedAt string           `json:"updated_at"`
}

type UpdateBotSettingsRequest struct {
	Start BotStartDTO `json:"start" binding:"required"`
}

type BotUserResponse struct {
	ID           int64  `json:"id"`
	TelegramID   int64  `json:"telegram_id"`
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	Username     string `json:"username"`
	Phone        string `json:"phone"`
	LanguageCode string `json:"language_code"`
	AvatarURL    string `json:"avatar_url,omitempty"`
	IsBot        bool   `json:"is_bot"`
	IsPremium    bool   `json:"is_premium"`
	XP           int    `json:"xp"`
	Level        int    `json:"level"`
	LevelUpXP    int    `json:"level_up_xp"`
	StartedAt    string `json:"started_at"`
	LastStartAt  string `json:"last_start_at"`
}

type BotUserListResponse struct {
	Data  []BotUserResponse `json:"data"`
	Total int64             `json:"total"`
	Page  int               `json:"page"`
	Limit int               `json:"limit"`
}
