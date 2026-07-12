package dto

type CreateGuideFileRequest struct {
	Slug        string `json:"slug" binding:"required,min=1,max=100"`
	Title       string `json:"title" binding:"required,min=1,max=255"`
	Description string `json:"description" binding:"max=5000"`
	URL         string `json:"url" binding:"required"`
	Ext         string `json:"ext" binding:"required,min=1,max=20"`
	SizeBytes   int64  `json:"size_bytes" binding:"min=0"`
	SortOrder   int    `json:"sort_order"`
	IsPublished *bool  `json:"is_published"`
}

type UpdateGuideFileRequest struct {
	Slug        string `json:"slug" binding:"required,min=1,max=100"`
	Title       string `json:"title" binding:"required,min=1,max=255"`
	Description string `json:"description" binding:"max=5000"`
	URL         string `json:"url" binding:"required"`
	Ext         string `json:"ext" binding:"required,min=1,max=20"`
	SizeBytes   int64  `json:"size_bytes" binding:"min=0"`
	SortOrder   int    `json:"sort_order"`
	IsPublished bool   `json:"is_published"`
}

type GuideFileResponse struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	URL         string `json:"url"`
	Ext         string `json:"ext"`
	SizeLabel   string `json:"sizeLabel"`
	SizeBytes   int64  `json:"sizeBytes,omitempty"`
	SortOrder   int    `json:"sortOrder,omitempty"`
	IsPublished bool   `json:"isPublished,omitempty"`
	CreatedAt   string `json:"createdAt,omitempty"`
	UpdatedAt   string `json:"updatedAt,omitempty"`
}

type GuideFileListResponse struct {
	Data []GuideFileResponse `json:"data"`
}
