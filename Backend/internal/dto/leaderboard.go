package dto

type XPReward struct {
	XPReward int `json:"xp_reward"`
	XP       int `json:"xp"`
	Level    int `json:"level"`
}

type LeaderboardEntryResponse struct {
	Rank  int    `json:"rank"`
	Name  string `json:"name"`
	XP    int    `json:"xp"`
	Level int    `json:"level"`
	IsMe  bool   `json:"is_me,omitempty"`
}

type LeaderboardResponse struct {
	Data            []LeaderboardEntryResponse `json:"data"`
	CurrentUserRank int                        `json:"current_user_rank"`
}
