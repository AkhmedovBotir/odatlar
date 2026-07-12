package dto

import "encoding/json"

type CreateGuideCourseRequest struct {
	Slug        string          `json:"slug" binding:"required,min=1,max=100"`
	Title       string          `json:"title" binding:"required,min=1,max=255"`
	Description string          `json:"description" binding:"max=5000"`
	Children    json.RawMessage `json:"children" binding:"required"`
	SortOrder   int             `json:"sort_order"`
	IsPublished *bool           `json:"is_published"`
}

type UpdateGuideCourseRequest struct {
	Slug        string          `json:"slug" binding:"required,min=1,max=100"`
	Title       string          `json:"title" binding:"required,min=1,max=255"`
	Description string          `json:"description" binding:"max=5000"`
	Children    json.RawMessage `json:"children" binding:"required"`
	SortOrder   int             `json:"sort_order"`
	IsPublished bool            `json:"is_published"`
}

type GuideCourseResponse struct {
	ID            string          `json:"id"`
	Title         string          `json:"title"`
	Description   string          `json:"description"`
	Children      json.RawMessage `json:"children,omitempty"`
	LessonCount   int             `json:"lessonCount,omitempty"`
	SectionCount  int             `json:"sectionCount,omitempty"`
	SortOrder     int             `json:"sortOrder,omitempty"`
	IsPublished   bool            `json:"isPublished,omitempty"`
	CreatedAt     string          `json:"createdAt,omitempty"`
	UpdatedAt     string          `json:"updatedAt,omitempty"`
}

type GuideCourseListResponse struct {
	Data []GuideCourseResponse `json:"data"`
}

type GuideCourseBreadcrumbItem struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Href  string `json:"href"`
}

type GuideCourseSummary struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type GuideLessonResponse struct {
	Lesson     json.RawMessage             `json:"lesson"`
	Breadcrumb []GuideCourseBreadcrumbItem `json:"breadcrumb"`
	Course     GuideCourseSummary          `json:"course"`
}
