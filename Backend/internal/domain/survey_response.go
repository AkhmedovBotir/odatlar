package domain

import (
	"encoding/json"
	"time"
)

type SurveyResponse struct {
	ID        int64
	SurveyID  int64
	Answers   json.RawMessage
	CreatedAt time.Time
}
