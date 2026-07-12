package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"mime/multipart"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/odatlar-bot/backend/internal/domain"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/pkg/upload"
)

var (
	ErrInvalidSurveySlug           = errors.New("invalid survey slug")
	ErrDuplicateSurveySlug         = errors.New("duplicate survey slug")
	ErrInvalidSurveyQuestions      = errors.New("invalid survey questions")
	ErrInvalidSurveySettings       = errors.New("invalid survey settings")
	ErrInvalidSurveyAnswers        = errors.New("invalid survey answers")
	ErrSurveyNotDraft              = errors.New("survey is not draft")
	ErrSurveyNotPublished          = errors.New("survey is not published")
	ErrSurveyClosed                = errors.New("survey is closed")
	ErrSurveyNotAcceptingResponses = errors.New("survey is not accepting responses")
	ErrSurveyQuestionNotFound      = errors.New("survey question not found")
	ErrInvalidSurveyFileQuestion   = errors.New("question is not a file upload type")
	ErrSurveyResponseNotFound      = errors.New("survey response not found")
	ErrInvalidSurveyResponseFilter = errors.New("invalid survey response filter")
)

var surveySlugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type SurveyService struct {
	surveyRepo        *repository.SurveyRepository
	storage           *upload.Storage
	surveyFrontendURL string
}

func NewSurveyService(surveyRepo *repository.SurveyRepository, storage *upload.Storage, surveyFrontendURL string) *SurveyService {
	return &SurveyService{
		surveyRepo:        surveyRepo,
		storage:           storage,
		surveyFrontendURL: strings.TrimRight(strings.TrimSpace(surveyFrontendURL), "/"),
	}
}

func (s *SurveyService) AdminList(ctx context.Context) (*dto.SurveyListResponse, error) {
	items, err := s.surveyRepo.ListAll(ctx)
	if err != nil {
		return nil, err
	}
	data := make([]dto.SurveyResponse, 0, len(items))
	for i := range items {
		data = append(data, s.toListItem(&items[i]))
	}
	return &dto.SurveyListResponse{Data: data}, nil
}

func (s *SurveyService) AdminGet(ctx context.Context, ref string) (*dto.SurveyResponse, error) {
	survey, err := s.resolveSurveyRef(ctx, ref)
	if err != nil {
		return nil, err
	}
	item := s.toFullResponse(survey)
	return &item, nil
}

func (s *SurveyService) AdminCreate(ctx context.Context, req dto.CreateSurveyRequest) (*dto.SurveyResponse, error) {
	slug, err := normalizeSurveySlug(req.Slug)
	if err != nil {
		return nil, err
	}
	settings, err := normalizeSurveySettings(req.Settings)
	if err != nil {
		return nil, err
	}
	questions, err := validateSurveyQuestions(req.Questions)
	if err != nil {
		return nil, err
	}
	exists, err := s.surveyRepo.SlugExists(ctx, slug, 0)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrDuplicateSurveySlug
	}
	created, err := s.surveyRepo.Create(ctx, &domain.Survey{
		Slug:        slug,
		Title:       strings.TrimSpace(req.Title),
		Description: strings.TrimSpace(req.Description),
		Settings:    settings,
		Questions:   questions,
		Status:      domain.SurveyStatusDraft,
		SortOrder:   req.SortOrder,
	})
	if err != nil {
		return nil, err
	}
	item := s.toFullResponse(created)
	return &item, nil
}

func (s *SurveyService) AdminUpdate(ctx context.Context, ref string, req dto.UpdateSurveyRequest) (*dto.SurveyResponse, error) {
	existing, err := s.resolveSurveyRef(ctx, ref)
	if err != nil {
		return nil, err
	}
	if existing.Status == domain.SurveyStatusClosed {
		return nil, ErrSurveyClosed
	}
	slug, err := normalizeSurveySlug(req.Slug)
	if err != nil {
		return nil, err
	}
	settings, err := normalizeSurveySettings(req.Settings)
	if err != nil {
		return nil, err
	}
	questions, err := validateSurveyQuestions(req.Questions)
	if err != nil {
		return nil, err
	}
	exists, err := s.surveyRepo.SlugExists(ctx, slug, existing.ID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrDuplicateSurveySlug
	}
	updated, err := s.surveyRepo.Update(ctx, &domain.Survey{
		ID:          existing.ID,
		Slug:        slug,
		Title:       strings.TrimSpace(req.Title),
		Description: strings.TrimSpace(req.Description),
		Settings:    settings,
		Questions:   questions,
		SortOrder:   req.SortOrder,
		Status:      existing.Status,
	})
	if err != nil {
		return nil, err
	}
	item := s.toFullResponse(updated)
	return &item, nil
}

func (s *SurveyService) AdminDelete(ctx context.Context, ref string) error {
	existing, err := s.resolveSurveyRef(ctx, ref)
	if err != nil {
		return err
	}
	return s.surveyRepo.Delete(ctx, existing.ID)
}

func (s *SurveyService) AdminPublish(ctx context.Context, ref string) (*dto.SurveyResponse, error) {
	existing, err := s.resolveSurveyRef(ctx, ref)
	if err != nil {
		return nil, err
	}
	if existing.Status != domain.SurveyStatusDraft {
		return nil, ErrSurveyNotDraft
	}
	if countAnswerableQuestions(existing.Questions) == 0 {
		return nil, fmt.Errorf("%w: at least one answerable question required", ErrInvalidSurveyQuestions)
	}
	published, err := s.surveyRepo.Publish(ctx, existing.ID)
	if err != nil {
		return nil, err
	}
	item := s.toFullResponse(published)
	return &item, nil
}

func (s *SurveyService) AdminClose(ctx context.Context, ref string) (*dto.SurveyResponse, error) {
	existing, err := s.resolveSurveyRef(ctx, ref)
	if err != nil {
		return nil, err
	}
	if existing.Status != domain.SurveyStatusPublished {
		return nil, ErrSurveyNotPublished
	}
	closed, err := s.surveyRepo.Close(ctx, existing.ID)
	if err != nil {
		return nil, err
	}
	item := s.toFullResponse(closed)
	return &item, nil
}

func (s *SurveyService) AdminListFileFormats(ctx context.Context) (*dto.SurveyFileFormatListResponse, error) {
	formats, err := s.surveyRepo.ListFileFormats(ctx)
	if err != nil {
		return nil, err
	}
	if len(formats) == 0 {
		return s.fileFormatsFromDomain(), nil
	}
	data := make([]dto.SurveyFileFormatResponse, 0, len(formats))
	for i := range formats {
		data = append(data, toFileFormatResponse(&formats[i]))
	}
	return &dto.SurveyFileFormatListResponse{Data: data}, nil
}

func (s *SurveyService) fileFormatsFromDomain() *dto.SurveyFileFormatListResponse {
	order := []string{
		domain.SurveyTypeFileImage, domain.SurveyTypeFileVideo, domain.SurveyTypeFileAudio,
		domain.SurveyTypeFilePDF, domain.SurveyTypeFileDocument, domain.SurveyTypeFileSpreadsheet,
		domain.SurveyTypeFilePresentation, domain.SurveyTypeFileArchive, domain.SurveyTypeFileAny,
	}
	data := make([]dto.SurveyFileFormatResponse, 0, len(order))
	for _, key := range order {
		if f, ok := domain.SurveyFileFormats[key]; ok {
			ff := f
			data = append(data, toFileFormatResponse(&ff))
		}
	}
	return &dto.SurveyFileFormatListResponse{Data: data}
}

func toFileFormatResponse(f *domain.SurveyFileFormat) dto.SurveyFileFormatResponse {
	return dto.SurveyFileFormatResponse{
		QuestionType:     f.QuestionType,
		Category:         f.Category,
		LabelUz:          f.LabelUz,
		MIMETypes:        f.MIMETypes,
		Extensions:       f.Extensions,
		DefaultMaxSizeMB: f.DefaultMaxSizeMB,
		DefaultMaxFiles:  f.DefaultMaxFiles,
	}
}

func (s *SurveyService) ListPublished(ctx context.Context) (*dto.PublicSurveyListResponse, error) {
	items, err := s.surveyRepo.ListPublished(ctx)
	if err != nil {
		return nil, err
	}
	data := make([]dto.PublicSurveyListItem, 0, len(items))
	for i := range items {
		data = append(data, dto.PublicSurveyListItem{
			ID:            items[i].Slug,
			Title:         items[i].Title,
			Description:   items[i].Description,
			QuestionCount: countAnswerableQuestions(items[i].Questions),
		})
	}
	return &dto.PublicSurveyListResponse{Data: data}, nil
}

func (s *SurveyService) GetPublic(ctx context.Context, ref string) (*dto.PublicSurveyResponse, error) {
	survey, err := s.surveyRepo.GetPublicByRef(ctx, ref)
	if err != nil {
		return nil, err
	}
	return &dto.PublicSurveyResponse{
		ID:          survey.Slug,
		Title:       survey.Title,
		Description: survey.Description,
		Settings:    filterPublicSettings(survey.Settings),
		Questions:   survey.Questions,
		Status:      survey.Status,
	}, nil
}

func (s *SurveyService) SubmitResponse(ctx context.Context, ref string, req dto.SubmitSurveyResponseRequest) (*dto.SubmitSurveyResponseResult, error) {
	survey, err := s.surveyRepo.GetPublicByRef(ctx, ref)
	if err != nil {
		return nil, err
	}
	if survey.Status != domain.SurveyStatusPublished {
		return nil, ErrSurveyNotAcceptingResponses
	}
	answers, err := validateSurveyAnswers(survey.Questions, req.Answers)
	if err != nil {
		return nil, err
	}
	created, err := s.surveyRepo.CreateResponse(ctx, survey.ID, answers)
	if err != nil {
		return nil, err
	}
	return &dto.SubmitSurveyResponseResult{
		ID:                  formatResponseID(created.ID),
		ConfirmationMessage: extractConfirmationMessage(survey.Settings),
		CreatedAt:           created.CreatedAt.UTC().Format(time.RFC3339),
	}, nil
}

func (s *SurveyService) UploadResponseFile(ctx context.Context, ref, questionID string, fileHeader *multipart.FileHeader) (*upload.SavedFile, error) {
	if s.storage == nil {
		return nil, fmt.Errorf("upload storage not configured")
	}
	survey, err := s.surveyRepo.GetPublicByRef(ctx, ref)
	if err != nil {
		return nil, err
	}
	if survey.Status != domain.SurveyStatusPublished {
		return nil, ErrSurveyNotAcceptingResponses
	}
	questionID = strings.TrimSpace(questionID)
	if questionID == "" {
		return nil, ErrSurveyQuestionNotFound
	}
	raw, ok := findSurveyQuestion(survey.Questions, questionID)
	if !ok {
		return nil, ErrSurveyQuestionNotFound
	}
	qType := parseQuestionTypeFromRaw(raw)
	if !domain.IsSurveyFileType(qType) {
		return nil, ErrInvalidSurveyFileQuestion
	}
	config := parseQuestionConfigFromRaw(raw)
	allowed := fileAllowedExtensions(qType, config)
	if len(allowed) == 0 && qType != domain.SurveyTypeFileAny {
		return nil, ErrInvalidSurveyFileQuestion
	}
	if len(allowed) == 0 {
		allowed = guideFileAllowedExtMap()
	}
	maxBytes := fileMaxBytes(qType, config, s.storage.MaxGuideFileBytes())
	return s.storage.SaveSurveyResponseFile(fileHeader, allowed, maxBytes)
}

func guideFileAllowedExtMap() map[string]struct{} {
	exts := []string{".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".mp4", ".webm", ".mov",
		".mp3", ".wav", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip", ".txt", ".csv"}
	out := make(map[string]struct{}, len(exts))
	for _, ext := range exts {
		out[ext] = struct{}{}
	}
	return out
}

func (s *SurveyService) resolveSurveyRef(ctx context.Context, ref string) (*domain.Survey, error) {
	ref = strings.TrimSpace(ref)
	if ref == "" {
		return nil, repository.ErrSurveyNotFound
	}
	if id, err := strconv.ParseInt(ref, 10, 64); err == nil && id > 0 {
		return s.surveyRepo.GetByID(ctx, id)
	}
	return s.surveyRepo.GetBySlug(ctx, ref)
}

func (s *SurveyService) toListItem(survey *domain.Survey) dto.SurveyResponse {
	return dto.SurveyResponse{
		ID:            survey.Slug,
		Title:         survey.Title,
		Description:   survey.Description,
		QuestionCount: countAnswerableQuestions(survey.Questions),
		Status:        survey.Status,
		SortOrder:     survey.SortOrder,
		ResponseURL:   s.buildResponseURL(survey.Slug),
		CreatedAt:     survey.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:     survey.UpdatedAt.UTC().Format(time.RFC3339),
		PublishedAt:   formatOptionalTime(survey.PublishedAt),
		ClosedAt:      formatOptionalTime(survey.ClosedAt),
	}
}

func (s *SurveyService) buildResponseURL(slug string) string {
	if s.surveyFrontendURL == "" || strings.TrimSpace(slug) == "" {
		return ""
	}
	return s.surveyFrontendURL + "/surveys/" + slug
}

func (s *SurveyService) toFullResponse(survey *domain.Survey) dto.SurveyResponse {
	item := s.toListItem(survey)
	item.Settings = survey.Settings
	item.Questions = survey.Questions
	return item
}

func normalizeSurveySlug(raw string) (string, error) {
	slug := strings.ToLower(strings.TrimSpace(raw))
	if slug == "" || len(slug) > 100 || !surveySlugPattern.MatchString(slug) {
		return "", ErrInvalidSurveySlug
	}
	return slug, nil
}

func normalizeSurveySettings(settings json.RawMessage) (json.RawMessage, error) {
	if len(settings) == 0 {
		return json.RawMessage(`{}`), nil
	}
	if !json.Valid(settings) {
		return nil, ErrInvalidSurveySettings
	}
	var obj map[string]json.RawMessage
	if err := json.Unmarshal(settings, &obj); err != nil {
		return nil, ErrInvalidSurveySettings
	}
	return settings, nil
}

func validateSurveyQuestions(questions json.RawMessage) (json.RawMessage, error) {
	if len(questions) == 0 {
		return nil, fmt.Errorf("%w: questions required", ErrInvalidSurveyQuestions)
	}
	var items []json.RawMessage
	if err := json.Unmarshal(questions, &items); err != nil {
		return nil, fmt.Errorf("%w: questions must be an array", ErrInvalidSurveyQuestions)
	}
	if len(items) == 0 {
		return nil, fmt.Errorf("%w: at least one question required", ErrInvalidSurveyQuestions)
	}
	seenIDs := make(map[string]struct{}, len(items))
	for i, q := range items {
		if err := validateSurveyQuestion(q, fmt.Sprintf("questions[%d]", i), seenIDs); err != nil {
			return nil, err
		}
	}
	return questions, nil
}

func validateSurveyQuestion(q json.RawMessage, path string, seenIDs map[string]struct{}) error {
	var meta struct {
		ID          string            `json:"id"`
		Type        string            `json:"type"`
		Title       string            `json:"title"`
		Options     []json.RawMessage `json:"options"`
		Config      json.RawMessage   `json:"config"`
		Validation  json.RawMessage   `json:"validation"`
	}
	if err := json.Unmarshal(q, &meta); err != nil {
		return fmt.Errorf("%w: invalid question at %s", ErrInvalidSurveyQuestions, path)
	}
	meta.ID = strings.TrimSpace(meta.ID)
	meta.Type = strings.TrimSpace(meta.Type)
	meta.Title = strings.TrimSpace(meta.Title)
	if meta.ID == "" {
		return fmt.Errorf("%w: missing id at %s", ErrInvalidSurveyQuestions, path)
	}
	if _, dup := seenIDs[meta.ID]; dup {
		return fmt.Errorf("%w: duplicate question id %q at %s", ErrInvalidSurveyQuestions, meta.ID, path)
	}
	seenIDs[meta.ID] = struct{}{}
	if !domain.SurveyQuestionTypes[meta.Type] {
		return fmt.Errorf("%w: unknown type %q at %s", ErrInvalidSurveyQuestions, meta.Type, path)
	}
	normalizedType := domain.NormalizeSurveyQuestionType(meta.Type)
	if meta.Type != domain.SurveyTypeSection && meta.Title == "" {
		return fmt.Errorf("%w: title required at %s", ErrInvalidSurveyQuestions, path)
	}
	if meta.Validation != nil && !json.Valid(meta.Validation) {
		return fmt.Errorf("%w: invalid validation at %s", ErrInvalidSurveyQuestions, path)
	}
	if meta.Config != nil && !json.Valid(meta.Config) {
		return fmt.Errorf("%w: invalid config at %s", ErrInvalidSurveyQuestions, path)
	}

	switch normalizedType {
	case domain.SurveyTypeSection:
		return nil
	case domain.SurveyTypeMultipleChoice, domain.SurveyTypeCheckbox, domain.SurveyTypeDropdown:
		return validateChoiceOptions(meta.Options, path, normalizedType == domain.SurveyTypeCheckbox)
	case domain.SurveyTypeGridChoice, domain.SurveyTypeGridCheckbox:
		return validateGridConfig(meta.Config, path)
	case domain.SurveyTypeLinearScale, domain.SurveyTypeRating:
		return validateScaleConfig(meta.Config, path, normalizedType)
	case domain.SurveyTypeShortText, domain.SurveyTypeLongText, domain.SurveyTypeEmail,
		domain.SurveyTypePhone, domain.SurveyTypeURL, domain.SurveyTypeNumber,
		domain.SurveyTypeDate, domain.SurveyTypeTime, domain.SurveyTypeDateTime:
		return nil
	default:
		if domain.IsSurveyFileType(normalizedType) {
			return validateFileConfig(meta.Config, path, normalizedType)
		}
		return fmt.Errorf("%w: unsupported type %q at %s", ErrInvalidSurveyQuestions, meta.Type, path)
	}
}

func validateChoiceOptions(options []json.RawMessage, path string, allowMultiple bool) error {
	if len(options) < 1 {
		return fmt.Errorf("%w: options required at %s", ErrInvalidSurveyQuestions, path)
	}
	seen := make(map[string]struct{}, len(options))
	for i, opt := range options {
		var item struct {
			ID    string `json:"id"`
			Label string `json:"label"`
		}
		if err := json.Unmarshal(opt, &item); err != nil {
			return fmt.Errorf("%w: invalid option at %s.options[%d]", ErrInvalidSurveyQuestions, path, i)
		}
		item.ID = strings.TrimSpace(item.ID)
		item.Label = strings.TrimSpace(item.Label)
		if item.ID == "" || item.Label == "" {
			return fmt.Errorf("%w: option id and label required at %s.options[%d]", ErrInvalidSurveyQuestions, path, i)
		}
		if _, dup := seen[item.ID]; dup {
			return fmt.Errorf("%w: duplicate option id %q at %s", ErrInvalidSurveyQuestions, item.ID, path)
		}
		seen[item.ID] = struct{}{}
	}
	if allowMultiple {
		return nil
	}
	return nil
}

func validateGridConfig(config json.RawMessage, path string) error {
	if len(config) == 0 {
		return fmt.Errorf("%w: config.rows and config.columns required at %s", ErrInvalidSurveyQuestions, path)
	}
	var cfg struct {
		Rows    []json.RawMessage `json:"rows"`
		Columns []json.RawMessage `json:"columns"`
	}
	if err := json.Unmarshal(config, &cfg); err != nil {
		return fmt.Errorf("%w: invalid config at %s", ErrInvalidSurveyQuestions, path)
	}
	if len(cfg.Rows) < 1 || len(cfg.Columns) < 1 {
		return fmt.Errorf("%w: config.rows and config.columns required at %s", ErrInvalidSurveyQuestions, path)
	}
	if err := validateGridItems(cfg.Rows, path+".config.rows"); err != nil {
		return err
	}
	return validateGridItems(cfg.Columns, path+".config.columns")
}

func validateGridItems(items []json.RawMessage, path string) error {
	seen := make(map[string]struct{}, len(items))
	for i, item := range items {
		var row struct {
			ID    string `json:"id"`
			Label string `json:"label"`
		}
		if err := json.Unmarshal(item, &row); err != nil {
			return fmt.Errorf("%w: invalid item at %s[%d]", ErrInvalidSurveyQuestions, path, i)
		}
		row.ID = strings.TrimSpace(row.ID)
		row.Label = strings.TrimSpace(row.Label)
		if row.ID == "" || row.Label == "" {
			return fmt.Errorf("%w: id and label required at %s[%d]", ErrInvalidSurveyQuestions, path, i)
		}
		if _, dup := seen[row.ID]; dup {
			return fmt.Errorf("%w: duplicate id %q at %s", ErrInvalidSurveyQuestions, row.ID, path)
		}
		seen[row.ID] = struct{}{}
	}
	return nil
}

func validateFileConfig(config json.RawMessage, path string, qType string) error {
	normalized := domain.NormalizeSurveyQuestionType(qType)
	format, ok := domain.SurveyFileFormats[normalized]
	if !ok {
		return fmt.Errorf("%w: unknown file type %q at %s", ErrInvalidSurveyQuestions, qType, path)
	}
	if len(config) == 0 {
		return nil
	}
	var cfg struct {
		MaxFileSizeMb     int      `json:"maxFileSizeMb"`
		MaxFiles          int      `json:"maxFiles"`
		Accept            []string `json:"accept"`
		AllowedExtensions []string `json:"allowedExtensions"`
	}
	if err := json.Unmarshal(config, &cfg); err != nil {
		return fmt.Errorf("%w: invalid config at %s", ErrInvalidSurveyQuestions, path)
	}
	if cfg.MaxFileSizeMb > 0 && (cfg.MaxFileSizeMb < 1 || cfg.MaxFileSizeMb > 500) {
		return fmt.Errorf("%w: config.maxFileSizeMb must be between 1 and 500 at %s", ErrInvalidSurveyQuestions, path)
	}
	if cfg.MaxFiles > 0 && (cfg.MaxFiles < 1 || cfg.MaxFiles > 20) {
		return fmt.Errorf("%w: config.maxFiles must be between 1 and 20 at %s", ErrInvalidSurveyQuestions, path)
	}
	for i, mime := range cfg.Accept {
		mime = strings.TrimSpace(mime)
		if mime == "" {
			return fmt.Errorf("%w: config.accept[%d] must not be empty at %s", ErrInvalidSurveyQuestions, i, path)
		}
	}
	for i, ext := range cfg.AllowedExtensions {
		ext = strings.TrimSpace(strings.TrimPrefix(ext, "."))
		if ext == "" {
			return fmt.Errorf("%w: config.allowedExtensions[%d] must not be empty at %s", ErrInvalidSurveyQuestions, i, path)
		}
	}
	if normalized == domain.SurveyTypeFileAny && len(cfg.Accept) == 0 && len(cfg.AllowedExtensions) == 0 {
		_ = format // file_any allows any file without explicit accept
	}
	return nil
}

func validateScaleConfig(config json.RawMessage, path string, qType string) error {
	if len(config) == 0 {
		if qType == domain.SurveyTypeRating {
			return nil
		}
		return fmt.Errorf("%w: config.scaleMin and config.scaleMax required at %s", ErrInvalidSurveyQuestions, path)
	}
	var cfg struct {
		ScaleMin int `json:"scaleMin"`
		ScaleMax int `json:"scaleMax"`
		MaxStars int `json:"maxStars"`
	}
	if err := json.Unmarshal(config, &cfg); err != nil {
		return fmt.Errorf("%w: invalid config at %s", ErrInvalidSurveyQuestions, path)
	}
	if qType == domain.SurveyTypeRating {
		if cfg.MaxStars > 0 && (cfg.MaxStars < 1 || cfg.MaxStars > 10) {
			return fmt.Errorf("%w: config.maxStars must be between 1 and 10 at %s", ErrInvalidSurveyQuestions, path)
		}
		return nil
	}
	if cfg.ScaleMin == 0 && cfg.ScaleMax == 0 {
		return fmt.Errorf("%w: config.scaleMin and config.scaleMax required at %s", ErrInvalidSurveyQuestions, path)
	}
	if cfg.ScaleMin >= cfg.ScaleMax {
		return fmt.Errorf("%w: config.scaleMax must be greater than config.scaleMin at %s", ErrInvalidSurveyQuestions, path)
	}
	return nil
}

func countAnswerableQuestions(questions json.RawMessage) int {
	var items []json.RawMessage
	if err := json.Unmarshal(questions, &items); err != nil {
		return 0
	}
	count := 0
	for _, q := range items {
		var meta struct {
			Type string `json:"type"`
		}
		if err := json.Unmarshal(q, &meta); err != nil {
			continue
		}
		if strings.TrimSpace(meta.Type) != domain.SurveyTypeSection {
			count++
		}
	}
	return count
}

func formatOptionalTime(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}
