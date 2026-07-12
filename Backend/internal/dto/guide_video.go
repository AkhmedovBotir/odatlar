package dto

type CreateGuideVideoRequest struct {
	Title       string `json:"title" binding:"required,min=1,max=255"`
	Description string `json:"description" binding:"max=5000"`
	Src         string `json:"src" binding:"required"`
	Poster      string `json:"poster"`
	DurationMin int    `json:"duration_min" binding:"min=0"`
	SortOrder   int    `json:"sort_order"`
	IsPublished *bool  `json:"is_published"`
}

type UpdateGuideVideoRequest struct {
	Title       string `json:"title" binding:"required,min=1,max=255"`
	Description string `json:"description" binding:"max=5000"`
	Src         string `json:"src" binding:"required"`
	Poster      string `json:"poster"`
	DurationMin int    `json:"duration_min" binding:"min=0"`
	SortOrder   int    `json:"sort_order"`
	IsPublished bool   `json:"is_published"`
}

type GuideVideoResponse struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	Src           string `json:"src"`
	Poster        string `json:"poster,omitempty"`
	DurationMin   int    `json:"durationMin,omitempty"`
	SortOrder     int    `json:"sortOrder,omitempty"`
	IsPublished   bool   `json:"isPublished,omitempty"`
	LikesCount    int    `json:"likesCount,omitempty"`
	CommentsCount int    `json:"commentsCount,omitempty"`
	LikedByMe     bool   `json:"likedByMe,omitempty"`
	CreatedAt     string `json:"createdAt,omitempty"`
	UpdatedAt     string `json:"updatedAt,omitempty"`
}

type GuideVideoListResponse struct {
	Data []GuideVideoResponse `json:"data"`
}

type GuideVideoLikeResponse struct {
	LikedByMe  bool `json:"likedByMe"`
	LikesCount int  `json:"likesCount"`
}

type CreateGuideVideoCommentRequest struct {
	Text string `json:"text" binding:"required,min=1,max=2000"`
}

type GuideVideoCommentResponse struct {
	ID              string `json:"id"`
	AuthorName      string `json:"authorName"`
	AuthorAvatarURL string `json:"authorAvatarUrl,omitempty"`
	Text            string `json:"text"`
	CreatedAt       string `json:"createdAt"`
	IsMine          bool   `json:"isMine,omitempty"`
}

type GuideVideoCommentListResponse struct {
	Data []GuideVideoCommentResponse `json:"data"`
}
