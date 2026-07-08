package dto

// UserMonitoringResponse — bitta foydalanuvchini to'liq kuzatish uchun snapshot.
type UserMonitoringResponse struct {
	User        BotUserResponse       `json:"user"`
	Summary     UserMonitoringSummary `json:"summary"`
	Practices   []MonitoredPractice   `json:"practices"`
	Indicators  []MonitoredIndicator  `json:"indicators"`
	Dominants   []MonitoredDominant   `json:"dominants"`
	Activity    []UserActivityEntry   `json:"recent_activity"`
	GeneratedAt string                `json:"generated_at"`
}

type UserMonitoringSummary struct {
	Rank           int `json:"rank"`
	XP             int `json:"xp"`
	Level          int `json:"level"`
	LevelUpXP      int `json:"level_up_xp"`
	DaysSinceStart int `json:"days_since_start"`

	PracticeCount            int `json:"practice_count"`
	PracticeCompletionsTotal int `json:"practice_completions_total"`
	PracticeCompletionsToday int `json:"practice_completions_today"`
	PracticeCompletionsWeek  int `json:"practice_completions_week"`
	BestStreak               int `json:"best_streak"`

	IndicatorCount     int `json:"indicator_count"`
	IndicatorLogsTotal int `json:"indicator_logs_total"`
	IndicatorLogsToday int `json:"indicator_logs_today"`
	IndicatorLogsWeek  int `json:"indicator_logs_week"`

	DominantCount         int `json:"dominant_count"`
	DominantSessionsTotal int `json:"dominant_sessions_total"`
	DominantSessionsToday int `json:"dominant_sessions_today"`
	DominantSessionsWeek  int `json:"dominant_sessions_week"`
}

type MonitoredPractice struct {
	ID               string `json:"id"`
	Name             string `json:"name"`
	Streak           int    `json:"streak"`
	CompletionsTotal int    `json:"completions_total"`
	LastCompletedAt  string `json:"last_completed_at,omitempty"`
	CreatedAt        string `json:"created_at"`
}

type MonitoredIndicator struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	LogsTotal      int    `json:"logs_total"`
	LastValueLabel string `json:"last_value_label,omitempty"`
	LastLoggedAt   string `json:"last_logged_at,omitempty"`
	CreatedAt      string `json:"created_at"`
}

type MonitoredDominant struct {
	ID                string `json:"id"`
	Title             string `json:"title"`
	Type              string `json:"type"`
	SessionsCompleted int    `json:"sessions_completed"`
	LastSessionAt     string `json:"last_session_at,omitempty"`
	CreatedAt         string `json:"created_at"`
}

// UserActivityEntry — yagona xronologik faoliyat lentasidagi bitta yozuv.
type UserActivityEntry struct {
	Kind   string `json:"kind"` // practice_complete | indicator_log | dominant_session
	Title  string `json:"title"`
	Detail string `json:"detail,omitempty"`
	At     string `json:"at"`
}

type UserActivityResponse struct {
	Data  []UserActivityEntry `json:"data"`
	Limit int                 `json:"limit"`
	From  string              `json:"from"`
	To    string              `json:"to"`
}
