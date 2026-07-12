package domain

import "time"

type GuideFile struct {
	ID          int64
	Slug        string
	Title       string
	Description string
	URL         string
	Ext         string
	SizeBytes   int64
	SortOrder   int
	IsPublished bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
