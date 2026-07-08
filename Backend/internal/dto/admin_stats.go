package dto

type AdminUserStats struct {
	Total          int64 `json:"total"`
	NewToday       int64 `json:"new_today"`
	NewThisWeek    int64 `json:"new_this_week"`
	ActiveThisWeek int64 `json:"active_this_week"`
	WithPhone      int64 `json:"with_phone"`
	Premium        int64 `json:"premium"`
}

type AdminActivityStats struct {
	TotalItems   int64 `json:"total_items"`
	TotalEntries int64 `json:"total_entries"`
	EntriesToday int64 `json:"entries_today"`
}

type AdminXPStats struct {
	TotalXP  int64   `json:"total_xp"`
	AvgXP    float64 `json:"avg_xp"`
	MaxXP    int64   `json:"max_xp"`
	MaxLevel int64   `json:"max_level"`
	AvgLevel float64 `json:"avg_level"`
	LevelUp  int     `json:"level_up_xp"`
}

type AdminStatsResponse struct {
	Users       AdminUserStats     `json:"users"`
	Practices   AdminActivityStats `json:"practices"`
	Indicators  AdminActivityStats `json:"indicators"`
	Dominants   AdminActivityStats `json:"dominants"`
	XP          AdminXPStats       `json:"xp"`
	GeneratedAt string             `json:"generated_at"`
}

type AdminLeaderboardEntry struct {
	Rank       int    `json:"rank"`
	BotUserID  int64  `json:"bot_user_id"`
	TelegramID int64  `json:"telegram_id"`
	Name       string `json:"name"`
	Username   string `json:"username,omitempty"`
	XP         int    `json:"xp"`
	Level      int    `json:"level"`
}

type AdminLeaderboardResponse struct {
	Data  []AdminLeaderboardEntry `json:"data"`
	Total int64                   `json:"total"`
	Limit int                     `json:"limit"`
}
