package dto

import "encoding/json"

type CreateSurveyRequest struct {
	Slug        string          `json:"slug" binding:"required,min=1,max=100"`
	Title       string          `json:"title" binding:"required,min=1,max=255"`
	Description string          `json:"description" binding:"max=10000"`
	Settings    json.RawMessage `json:"settings"`
	Questions   json.RawMessage `json:"questions" binding:"required"`
	SortOrder   int             `json:"sortOrder"`
}

type UpdateSurveyRequest struct {
	Slug        string          `json:"slug" binding:"required,min=1,max=100"`
	Title       string          `json:"title" binding:"required,min=1,max=255"`
	Description string          `json:"description" binding:"max=10000"`
	Settings    json.RawMessage `json:"settings"`
	Questions   json.RawMessage `json:"questions" binding:"required"`
	SortOrder   int             `json:"sortOrder"`
}

type SurveyResponse struct {
	ID            string          `json:"id"`
	Title         string          `json:"title"`
	Description   string          `json:"description"`
	Settings      json.RawMessage `json:"settings,omitempty"`
	Questions     json.RawMessage `json:"questions,omitempty"`
	QuestionCount int             `json:"questionCount,omitempty"`
	Status        string          `json:"status"`
	SortOrder     int             `json:"sortOrder,omitempty"`
	CreatedAt     string          `json:"createdAt,omitempty"`
	UpdatedAt     string          `json:"updatedAt,omitempty"`
	PublishedAt   string          `json:"publishedAt,omitempty"`
	ClosedAt      string          `json:"closedAt,omitempty"`
	ResponseURL   string          `json:"responseUrl,omitempty"`
}

type SurveyListResponse struct {
	Data []SurveyResponse `json:"data"`
}

type SurveyFileFormatResponse struct {
	QuestionType     string   `json:"questionType"`
	Category         string   `json:"category"`
	LabelUz          string   `json:"labelUz"`
	MIMETypes        []string `json:"mimeTypes"`
	Extensions       []string `json:"extensions"`
	DefaultMaxSizeMB int      `json:"defaultMaxSizeMb"`
	DefaultMaxFiles  int      `json:"defaultMaxFiles"`
}

type SurveyFileFormatListResponse struct {
	Data []SurveyFileFormatResponse `json:"data"`
}

type PublicSurveyListItem struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	QuestionCount int    `json:"questionCount"`
}

type PublicSurveyListResponse struct {
	Data []PublicSurveyListItem `json:"data"`
}

type PublicSurveyResponse struct {
	ID          string          `json:"id"`
	Title       string          `json:"title"`
	Description string          `json:"description"`
	Settings    json.RawMessage `json:"settings,omitempty"`
	Questions   json.RawMessage `json:"questions"`
	Status      string          `json:"status"`
}

type SubmitSurveyResponseRequest struct {
	Answers json.RawMessage `json:"answers" binding:"required"`
}

type SubmitSurveyResponseResult struct {
	ID                  string `json:"id"`
	ConfirmationMessage string `json:"confirmationMessage,omitempty"`
	CreatedAt           string `json:"createdAt"`
}

type SurveyUploadRequest struct {
	QuestionID string `form:"questionId" binding:"required"`
}
