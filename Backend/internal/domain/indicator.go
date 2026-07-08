package domain

import "time"

type UserIndicator struct {
	ID                  int64
	BotUserID           int64
	Name                string
	Benefits            []string
	TodayIndicatorValue string
	CreatedAt           time.Time
	UpdatedAt           time.Time
}

type IndicatorLog struct {
	ID           int64
	IndicatorID  int64
	BotUserID    int64
	CompletedAt  time.Time
	Date         time.Time
	ValueID      string
	ValueLabel   string
	NumericValue *float64
	IsEmpty      bool
}
