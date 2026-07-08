package dto

type CreateDominantRequest struct {
	Title  string   `json:"title" binding:"required,min=1,max=255"`
	Type   string   `json:"type" binding:"required,oneof=fikrlash ma'lumot"`
	Cue    string   `json:"cue" binding:"max=1000"`
	Reward string   `json:"reward" binding:"max=1000"`
	Pros   []string `json:"pros" binding:"max=50,dive,max=500"`
	Cons   []string `json:"cons" binding:"max=50,dive,max=500"`
	Notes  string   `json:"notes" binding:"max=5000"`
}

type UpdateDominantRequest struct {
	Title  string `json:"title" binding:"required,min=1,max=255"`
	Cue    string `json:"cue" binding:"max=1000"`
	Reward string `json:"reward" binding:"max=1000"`
}

type CompleteDominantSessionRequest struct {
	Type  string   `json:"type" binding:"required,oneof=fikrlash ma'lumot"`
	Pros  []string `json:"pros" binding:"max=50,dive,max=500"`
	Cons  []string `json:"cons" binding:"max=50,dive,max=500"`
	Notes string   `json:"notes" binding:"max=5000"`
}

type DominantResponse struct {
	ID                string   `json:"id"`
	Title             string   `json:"title"`
	Type              string   `json:"type"`
	Cue               string   `json:"cue"`
	Reward            string   `json:"reward"`
	Pros              []string `json:"pros"`
	Cons              []string `json:"cons"`
	Notes             string   `json:"notes"`
	SessionsCompleted int      `json:"sessionsCompleted"`
	CreatedAt         string   `json:"createdAt"`
	XPReward          int      `json:"xp_reward,omitempty"`
	XP                int      `json:"xp,omitempty"`
	Level             int      `json:"level,omitempty"`
}

type DominantListResponse struct {
	Data []DominantResponse `json:"data"`
}
