package domain

import "time"

type BotSettings struct {
	ID          int
	BotToken    string
	BotUsername string
	IsActive    bool

	StartMessage         string
	StartButtonEnabled   bool
	StartButtonText      string
	StartButtonWebAppURL string

	CreatedAt time.Time
	UpdatedAt time.Time
}

type BotUser struct {
	ID           int64
	TelegramID   int64
	FirstName    string
	LastName     string
	Username     string
	Phone        string
	LanguageCode string
	AvatarURL    string
	IsBot        bool
	IsPremium    bool
	XP           int
	Level        int
	StartedAt    time.Time
	LastStartAt  time.Time
}
