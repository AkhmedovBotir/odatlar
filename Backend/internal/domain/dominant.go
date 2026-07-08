package domain

import "time"

type UserDominant struct {
	ID                int64
	BotUserID         int64
	Title             string
	Type              string
	Cue               string
	Reward            string
	Pros              []string
	Cons              []string
	Notes             string
	SessionsCompleted int
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

type DominantSession struct {
	ID          int64
	DominantID  int64
	BotUserID   int64
	Type        string
	CompletedAt time.Time
}
