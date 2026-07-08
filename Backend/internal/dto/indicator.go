package dto

type CreateIndicatorRequest struct {
	Name     string   `json:"name" binding:"required,min=1,max=255"`
	Benefits []string `json:"benefits" binding:"max=20,dive,max=500"`
}

type UpdateIndicatorRequest struct {
	Name     string   `json:"name" binding:"required,min=1,max=255"`
	Benefits []string `json:"benefits" binding:"max=20,dive,max=500"`
}

type LogIndicatorRequest struct {
	ValueID    string `json:"value_id" binding:"required,max=100"`
	ValueLabel string `json:"value_label" binding:"required,max=255"`
	IsEmpty    bool   `json:"is_empty"`
}

type IndicatorResponse struct {
	ID                  string   `json:"id"`
	Name                string   `json:"name"`
	Benefits            []string `json:"benefits"`
	Kind                string   `json:"kind"`
	CompletedToday      bool     `json:"completedToday"`
	Streak              int      `json:"streak"`
	TodayIndicatorValue *string  `json:"todayIndicatorValue"`
	CreatedAt           string   `json:"createdAt"`
	XPReward            int      `json:"xp_reward,omitempty"`
	XP                  int      `json:"xp,omitempty"`
	Level               int      `json:"level,omitempty"`
}

type IndicatorListResponse struct {
	Data []IndicatorResponse `json:"data"`
}

type IndicatorHistoryEntryResponse struct {
	ID           string   `json:"id"`
	HabitID      string   `json:"habitId"`
	HabitName    string   `json:"habitName"`
	Date         string   `json:"date"`
	CompletedAt  string   `json:"completedAt"`
	Kind         string   `json:"kind"`
	ValueID      string   `json:"valueId,omitempty"`
	ValueLabel   string   `json:"valueLabel,omitempty"`
	NumericValue *float64 `json:"numericValue,omitempty"`
	IsEmpty      bool     `json:"isEmpty,omitempty"`
}

type IndicatorHistoryResponse struct {
	Data []IndicatorHistoryEntryResponse `json:"data"`
}
