package dto

type XPSettingsResponse struct {
	PracticeCompleteXP int    `json:"practice_complete_xp"`
	IndicatorLogXP     int    `json:"indicator_log_xp"`
	DominantCreateXP   int    `json:"dominant_create_xp"`
	DominantSessionXP  int    `json:"dominant_session_xp"`
	LevelUpXP          int    `json:"level_up_xp"`
	UpdatedAt          string `json:"updated_at"`
}

type UpdateXPSettingsRequest struct {
	PracticeCompleteXP int `json:"practice_complete_xp" binding:"min=0,max=100000"`
	IndicatorLogXP     int `json:"indicator_log_xp" binding:"min=0,max=100000"`
	DominantCreateXP   int `json:"dominant_create_xp" binding:"min=0,max=100000"`
	DominantSessionXP  int `json:"dominant_session_xp" binding:"min=0,max=100000"`
	LevelUpXP          int `json:"level_up_xp" binding:"min=1,max=1000000"`
}
