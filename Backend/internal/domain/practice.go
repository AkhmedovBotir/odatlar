package domain

import "time"

type UserPractice struct {
	ID        int64
	BotUserID int64
	Name      string
	Benefits  []string
	Streak    int
	CreatedAt time.Time
	UpdatedAt time.Time
}

type PracticeCompletion struct {
	ID          int64
	PracticeID  int64
	BotUserID   int64
	CompletedAt time.Time
	Date        time.Time
}
