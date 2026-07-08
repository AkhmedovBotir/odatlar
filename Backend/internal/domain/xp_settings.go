package domain

import "time"

type XPSettings struct {
	ID                 int
	PracticeCompleteXP int
	IndicatorLogXP     int
	DominantCreateXP   int
	DominantSessionXP  int
	LevelUpXP          int
	CreatedAt          time.Time
	UpdatedAt          time.Time
}
