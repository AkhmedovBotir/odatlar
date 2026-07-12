package domain

import (
	"encoding/json"
	"time"
)

type GuideCourse struct {
	ID          int64
	Slug        string
	Title       string
	Description string
	Content     json.RawMessage
	SortOrder   int
	IsPublished bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
