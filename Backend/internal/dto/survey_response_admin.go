package dto

import "encoding/json"

type AdminSurveyResponseItem struct {
	ID          string          `json:"id"`
	SurveyID    string          `json:"surveyId"`
	SurveySlug  string          `json:"surveySlug"`
	SurveyTitle string          `json:"surveyTitle"`
	Answers     json.RawMessage `json:"answers"`
	CreatedAt   string          `json:"createdAt"`
}

type AdminSurveyResponseListResponse struct {
	Data  []AdminSurveyResponseItem `json:"data"`
	Total int                       `json:"total"`
	Page  int                       `json:"page"`
	Limit int                       `json:"limit"`
}

type AdminSurveyResponseDetailResponse struct {
	ID          string          `json:"id"`
	SurveyID    string          `json:"surveyId"`
	SurveySlug  string          `json:"surveySlug"`
	SurveyTitle string          `json:"surveyTitle"`
	SurveyStatus string         `json:"surveyStatus"`
	Questions   json.RawMessage `json:"questions,omitempty"`
	Answers     json.RawMessage `json:"answers"`
	CreatedAt   string          `json:"createdAt"`
}

type AdminSurveyResponseSummaryResponse struct {
	SurveyID         string `json:"surveyId"`
	SurveySlug       string `json:"surveySlug"`
	SurveyTitle      string `json:"surveyTitle"`
	SurveyStatus     string `json:"surveyStatus"`
	TotalResponses   int    `json:"totalResponses"`
	TodayResponses   int    `json:"todayResponses"`
	WeekResponses    int    `json:"weekResponses"`
	FirstResponseAt  string `json:"firstResponseAt,omitempty"`
	LastResponseAt   string `json:"lastResponseAt,omitempty"`
}

type AdminSurveyResponseFilter struct {
	SurveyRef  string
	From       string
	To         string
	Search     string
	QuestionID string
	Page       int
	Limit      int
	Sort       string
}
