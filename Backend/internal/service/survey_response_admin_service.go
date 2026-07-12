package service

import (
	"context"
	"strconv"
	"strings"
	"time"

	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
)

func (s *SurveyService) AdminListResponses(ctx context.Context, filter dto.AdminSurveyResponseFilter) (*dto.AdminSurveyResponseListResponse, error) {
	repoFilter, err := s.toRepoResponseFilter(ctx, filter)
	if err != nil {
		return nil, err
	}
	rows, total, err := s.surveyRepo.ListResponses(ctx, repoFilter)
	if err != nil {
		return nil, err
	}
	data := make([]dto.AdminSurveyResponseItem, 0, len(rows))
	for i := range rows {
		data = append(data, toAdminResponseItem(&rows[i]))
	}
	return &dto.AdminSurveyResponseListResponse{
		Data:  data,
		Total: total,
		Page:  repoFilter.Page,
		Limit: repoFilter.Limit,
	}, nil
}

func (s *SurveyService) AdminListSurveyResponses(ctx context.Context, surveyRef string, filter dto.AdminSurveyResponseFilter) (*dto.AdminSurveyResponseListResponse, error) {
	survey, err := s.resolveSurveyRef(ctx, surveyRef)
	if err != nil {
		return nil, err
	}
	filter.SurveyRef = survey.Slug
	return s.AdminListResponses(ctx, filter)
}

func (s *SurveyService) AdminGetResponse(ctx context.Context, responseID int64) (*dto.AdminSurveyResponseDetailResponse, error) {
	row, survey, err := s.surveyRepo.GetResponseDetail(ctx, responseID)
	if err != nil {
		return nil, err
	}
	return &dto.AdminSurveyResponseDetailResponse{
		ID:           formatResponseID(row.ID),
		SurveyID:     survey.Slug,
		SurveySlug:   survey.Slug,
		SurveyTitle:  survey.Title,
		SurveyStatus: survey.Status,
		Questions:    survey.Questions,
		Answers:      row.Answers,
		CreatedAt:    row.CreatedAt.UTC().Format(time.RFC3339),
	}, nil
}

func (s *SurveyService) AdminGetSurveyResponseSummary(ctx context.Context, surveyRef string) (*dto.AdminSurveyResponseSummaryResponse, error) {
	survey, err := s.resolveSurveyRef(ctx, surveyRef)
	if err != nil {
		return nil, err
	}
	summary, err := s.surveyRepo.GetResponseSummary(ctx, survey.ID)
	if err != nil {
		return nil, err
	}
	resp := &dto.AdminSurveyResponseSummaryResponse{
		SurveyID:       survey.Slug,
		SurveySlug:     survey.Slug,
		SurveyTitle:    survey.Title,
		SurveyStatus:   survey.Status,
		TotalResponses: summary.Total,
		TodayResponses: summary.Today,
		WeekResponses:  summary.Week,
	}
	if summary.FirstAt != nil {
		resp.FirstResponseAt = summary.FirstAt.UTC().Format(time.RFC3339)
	}
	if summary.LastAt != nil {
		resp.LastResponseAt = summary.LastAt.UTC().Format(time.RFC3339)
	}
	return resp, nil
}

func (s *SurveyService) AdminDeleteResponse(ctx context.Context, responseID int64) error {
	return s.surveyRepo.DeleteResponse(ctx, responseID)
}

func (s *SurveyService) toRepoResponseFilter(ctx context.Context, filter dto.AdminSurveyResponseFilter) (repository.SurveyResponseListFilter, error) {
	out := repository.SurveyResponseListFilter{
		Search:     strings.TrimSpace(filter.Search),
		QuestionID: strings.TrimSpace(filter.QuestionID),
		Page:       filter.Page,
		Limit:      filter.Limit,
		SortDesc:   filter.Sort != "created_at_asc",
	}
	if out.Page < 1 {
		out.Page = 1
	}
	if out.Limit < 1 {
		out.Limit = 20
	}
	if out.Limit > 100 {
		out.Limit = 100
	}
	if ref := strings.TrimSpace(filter.SurveyRef); ref != "" {
		survey, err := s.resolveSurveyRef(ctx, ref)
		if err != nil {
			return out, err
		}
		out.SurveyID = survey.ID
	}
	if from := strings.TrimSpace(filter.From); from != "" {
		t, err := time.Parse("2006-01-02", from)
		if err != nil {
			return out, ErrInvalidSurveyResponseFilter
		}
		out.From = &t
	}
	if to := strings.TrimSpace(filter.To); to != "" {
		t, err := time.Parse("2006-01-02", to)
		if err != nil {
			return out, ErrInvalidSurveyResponseFilter
		}
		out.To = &t
	}
	return out, nil
}

func toAdminResponseItem(row *repository.SurveyResponseListRow) dto.AdminSurveyResponseItem {
	return dto.AdminSurveyResponseItem{
		ID:          formatResponseID(row.ID),
		SurveyID:    row.SurveySlug,
		SurveySlug:  row.SurveySlug,
		SurveyTitle: row.SurveyTitle,
		Answers:     row.Answers,
		CreatedAt:   row.CreatedAt.UTC().Format(time.RFC3339),
	}
}

func parseSurveyResponseID(raw string) (int64, error) {
	id, err := strconv.ParseInt(strings.TrimSpace(raw), 10, 64)
	if err != nil || id < 1 {
		return 0, ErrSurveyResponseNotFound
	}
	return id, nil
}
