package dto

type CreatePracticeRequest struct {
	Name     string   `json:"name" binding:"required,min=1,max=255"`
	Benefits []string `json:"benefits" binding:"max=20,dive,max=500"`
}

type UpdatePracticeRequest struct {
	Name     string   `json:"name" binding:"required,min=1,max=255"`
	Benefits []string `json:"benefits" binding:"max=20,dive,max=500"`
}

type PracticeResponse struct {
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	Benefits       []string `json:"benefits"`
	Kind           string   `json:"kind"`
	CompletedToday bool     `json:"completedToday"`
	Streak         int      `json:"streak"`
	CreatedAt      string   `json:"createdAt"`
	XPReward       int      `json:"xp_reward,omitempty"`
	XP             int      `json:"xp,omitempty"`
	Level          int      `json:"level,omitempty"`
}

type PracticeListResponse struct {
	Data []PracticeResponse `json:"data"`
}

type PracticeHistoryEntryResponse struct {
	ID          string `json:"id"`
	HabitID     string `json:"habitId"`
	HabitName   string `json:"habitName"`
	Date        string `json:"date"`
	CompletedAt string `json:"completedAt"`
	Kind        string `json:"kind"`
}

type PracticeHistoryResponse struct {
	Data []PracticeHistoryEntryResponse `json:"data"`
}
