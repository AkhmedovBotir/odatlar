package domain

import "time"

type GuideVideo struct {
	ID          int64
	Title       string
	Description string
	Src         string
	Poster      string
	DurationMin int
	SortOrder   int
	IsPublished bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type GuideVideoComment struct {
	ID        int64
	VideoID   int64
	BotUserID int64
	Text      string
	CreatedAt time.Time
	FirstName string
	LastName  string
	Username  string
	AvatarURL string
}
