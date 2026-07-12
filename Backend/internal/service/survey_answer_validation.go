package service

import (
	"encoding/json"
	"fmt"
	"math"
	"strconv"
	"strings"

	"github.com/odatlar-bot/backend/internal/domain"
	"github.com/odatlar-bot/backend/pkg/upload"
)

type parsedSurveyQuestion struct {
	ID        string
	Type      string
	Required  bool
	OptionIDs map[string]struct{}
	GridRows  map[string]struct{}
	GridCols  map[string]struct{}
	MaxFiles  int
}

func parseSurveyQuestions(questions json.RawMessage) ([]parsedSurveyQuestion, error) {
	var items []json.RawMessage
	if err := json.Unmarshal(questions, &items); err != nil {
		return nil, fmt.Errorf("%w: invalid questions", ErrInvalidSurveyAnswers)
	}
	parsed := make([]parsedSurveyQuestion, 0, len(items))
	for i, raw := range items {
		q, err := parseOneSurveyQuestion(raw, fmt.Sprintf("questions[%d]", i))
		if err != nil {
			return nil, err
		}
		parsed = append(parsed, q)
	}
	return parsed, nil
}

func parseOneSurveyQuestion(raw json.RawMessage, path string) (parsedSurveyQuestion, error) {
	var meta struct {
		ID       string            `json:"id"`
		Type     string            `json:"type"`
		Required bool              `json:"required"`
		Options  []json.RawMessage `json:"options"`
		Config   json.RawMessage   `json:"config"`
	}
	if err := json.Unmarshal(raw, &meta); err != nil {
		return parsedSurveyQuestion{}, fmt.Errorf("%w: invalid question at %s", ErrInvalidSurveyAnswers, path)
	}
	qType := domain.NormalizeSurveyQuestionType(strings.TrimSpace(meta.Type))
	q := parsedSurveyQuestion{
		ID:       strings.TrimSpace(meta.ID),
		Type:     qType,
		Required: meta.Required,
		MaxFiles: 1,
	}
	if q.ID == "" {
		return parsedSurveyQuestion{}, fmt.Errorf("%w: missing question id at %s", ErrInvalidSurveyAnswers, path)
	}
	if meta.Type == domain.SurveyTypeSection {
		return q, nil
	}
	for _, opt := range meta.Options {
		var item struct {
			ID string `json:"id"`
		}
		_ = json.Unmarshal(opt, &item)
		item.ID = strings.TrimSpace(item.ID)
		if item.ID == "" {
			continue
		}
		if q.OptionIDs == nil {
			q.OptionIDs = make(map[string]struct{})
		}
		q.OptionIDs[item.ID] = struct{}{}
	}
	if len(meta.Config) > 0 {
		var cfg struct {
			Rows     []json.RawMessage `json:"rows"`
			Columns  []json.RawMessage `json:"columns"`
			MaxFiles int               `json:"maxFiles"`
		}
		_ = json.Unmarshal(meta.Config, &cfg)
		if cfg.MaxFiles > 0 {
			q.MaxFiles = cfg.MaxFiles
		}
		q.GridRows = gridIDs(cfg.Rows)
		q.GridCols = gridIDs(cfg.Columns)
	}
	return q, nil
}

func gridIDs(items []json.RawMessage) map[string]struct{} {
	if len(items) == 0 {
		return nil
	}
	out := make(map[string]struct{}, len(items))
	for _, item := range items {
		var row struct {
			ID string `json:"id"`
		}
		_ = json.Unmarshal(item, &row)
		row.ID = strings.TrimSpace(row.ID)
		if row.ID != "" {
			out[row.ID] = struct{}{}
		}
	}
	return out
}

func validateSurveyAnswers(questions json.RawMessage, answers json.RawMessage) (json.RawMessage, error) {
	parsed, err := parseSurveyQuestions(questions)
	if err != nil {
		return nil, err
	}
	var answerMap map[string]json.RawMessage
	if err := json.Unmarshal(answers, &answerMap); err != nil {
		return nil, fmt.Errorf("%w: answers must be an object", ErrInvalidSurveyAnswers)
	}
	if answerMap == nil {
		answerMap = map[string]json.RawMessage{}
	}
	clean := make(map[string]any, len(answerMap))
	seen := make(map[string]struct{}, len(answerMap))

	for _, q := range parsed {
		if q.Type == domain.SurveyTypeSection {
			continue
		}
		raw, ok := answerMap[q.ID]
		if !ok || isEmptyAnswer(raw) {
			if q.Required {
				return nil, fmt.Errorf("%w: answer required for question %q", ErrInvalidSurveyAnswers, q.ID)
			}
			continue
		}
		if _, dup := seen[q.ID]; dup {
			return nil, fmt.Errorf("%w: duplicate answer for question %q", ErrInvalidSurveyAnswers, q.ID)
		}
		value, err := validateAnswerValue(q, raw)
		if err != nil {
			return nil, err
		}
		clean[q.ID] = value
		seen[q.ID] = struct{}{}
	}

	for qID := range answerMap {
		if isEmptyAnswer(answerMap[qID]) {
			continue
		}
		if _, ok := seen[qID]; !ok {
			return nil, fmt.Errorf("%w: unknown question id %q", ErrInvalidSurveyAnswers, qID)
		}
	}

	out, err := json.Marshal(clean)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func isEmptyAnswer(raw json.RawMessage) bool {
	if len(raw) == 0 {
		return true
	}
	s := strings.TrimSpace(string(raw))
	return s == "" || s == "null"
}

func validateAnswerValue(q parsedSurveyQuestion, raw json.RawMessage) (any, error) {
	switch q.Type {
	case domain.SurveyTypeShortText, domain.SurveyTypeLongText,
		domain.SurveyTypeEmail, domain.SurveyTypePhone, domain.SurveyTypeURL,
		domain.SurveyTypeDate, domain.SurveyTypeTime, domain.SurveyTypeDateTime:
		var v string
		if err := json.Unmarshal(raw, &v); err != nil || strings.TrimSpace(v) == "" {
			return nil, fmt.Errorf("%w: question %q expects string", ErrInvalidSurveyAnswers, q.ID)
		}
		return strings.TrimSpace(v), nil
	case domain.SurveyTypeNumber, domain.SurveyTypeLinearScale, domain.SurveyTypeRating:
		var v float64
		if err := json.Unmarshal(raw, &v); err != nil {
			return nil, fmt.Errorf("%w: question %q expects number", ErrInvalidSurveyAnswers, q.ID)
		}
		if math.IsNaN(v) || math.IsInf(v, 0) {
			return nil, fmt.Errorf("%w: question %q has invalid number", ErrInvalidSurveyAnswers, q.ID)
		}
		return v, nil
	case domain.SurveyTypeMultipleChoice, domain.SurveyTypeDropdown:
		var v string
		if err := json.Unmarshal(raw, &v); err != nil || strings.TrimSpace(v) == "" {
			return nil, fmt.Errorf("%w: question %q expects option id", ErrInvalidSurveyAnswers, q.ID)
		}
		v = strings.TrimSpace(v)
		if _, ok := q.OptionIDs[v]; !ok {
			return nil, fmt.Errorf("%w: invalid option %q for question %q", ErrInvalidSurveyAnswers, v, q.ID)
		}
		return v, nil
	case domain.SurveyTypeCheckbox:
		var values []string
		if err := json.Unmarshal(raw, &values); err != nil || len(values) == 0 {
			return nil, fmt.Errorf("%w: question %q expects string array", ErrInvalidSurveyAnswers, q.ID)
		}
		uniq := make([]string, 0, len(values))
		used := make(map[string]struct{}, len(values))
		for _, v := range values {
			v = strings.TrimSpace(v)
			if v == "" {
				continue
			}
			if _, ok := q.OptionIDs[v]; !ok {
				return nil, fmt.Errorf("%w: invalid option %q for question %q", ErrInvalidSurveyAnswers, v, q.ID)
			}
			if _, dup := used[v]; dup {
				continue
			}
			used[v] = struct{}{}
			uniq = append(uniq, v)
		}
		if len(uniq) == 0 {
			return nil, fmt.Errorf("%w: question %q expects at least one option", ErrInvalidSurveyAnswers, q.ID)
		}
		return uniq, nil
	case domain.SurveyTypeGridChoice:
		values, err := decodeStringMap(raw)
		if err != nil {
			return nil, fmt.Errorf("%w: question %q expects object", ErrInvalidSurveyAnswers, q.ID)
		}
		for rowID, colID := range values {
			if _, ok := q.GridRows[rowID]; !ok {
				return nil, fmt.Errorf("%w: invalid row %q for question %q", ErrInvalidSurveyAnswers, rowID, q.ID)
			}
			if _, ok := q.GridCols[colID]; !ok {
				return nil, fmt.Errorf("%w: invalid column %q for question %q", ErrInvalidSurveyAnswers, colID, q.ID)
			}
		}
		if len(values) == 0 {
			return nil, fmt.Errorf("%w: question %q expects grid answers", ErrInvalidSurveyAnswers, q.ID)
		}
		return values, nil
	case domain.SurveyTypeGridCheckbox:
		rawMap, err := decodeRawMap(raw)
		if err != nil {
			return nil, fmt.Errorf("%w: question %q expects object", ErrInvalidSurveyAnswers, q.ID)
		}
		out := make(map[string][]string, len(rawMap))
		for rowID, colRaw := range rawMap {
			if _, ok := q.GridRows[rowID]; !ok {
				return nil, fmt.Errorf("%w: invalid row %q for question %q", ErrInvalidSurveyAnswers, rowID, q.ID)
			}
			var cols []string
			if err := json.Unmarshal(colRaw, &cols); err != nil || len(cols) == 0 {
				return nil, fmt.Errorf("%w: question %q row %q expects string array", ErrInvalidSurveyAnswers, q.ID, rowID)
			}
			uniq := make([]string, 0, len(cols))
			used := make(map[string]struct{})
			for _, colID := range cols {
				colID = strings.TrimSpace(colID)
				if _, ok := q.GridCols[colID]; !ok {
					return nil, fmt.Errorf("%w: invalid column %q for question %q", ErrInvalidSurveyAnswers, colID, q.ID)
				}
				if _, dup := used[colID]; dup {
					continue
				}
				used[colID] = struct{}{}
				uniq = append(uniq, colID)
			}
			out[rowID] = uniq
		}
		if len(out) == 0 {
			return nil, fmt.Errorf("%w: question %q expects grid answers", ErrInvalidSurveyAnswers, q.ID)
		}
		return out, nil
	default:
		if domain.IsSurveyFileType(q.Type) {
			return validateFileAnswer(q, raw)
		}
		return nil, fmt.Errorf("%w: unsupported question type %q", ErrInvalidSurveyAnswers, q.Type)
	}
}

func validateFileAnswer(q parsedSurveyQuestion, raw json.RawMessage) (any, error) {
	if q.MaxFiles <= 1 {
		var path string
		if err := json.Unmarshal(raw, &path); err != nil || strings.TrimSpace(path) == "" {
			return nil, fmt.Errorf("%w: question %q expects file path string", ErrInvalidSurveyAnswers, q.ID)
		}
		path = strings.TrimSpace(path)
		if err := upload.ValidateSurveyResponseFilePath(path); err != nil {
			return nil, fmt.Errorf("%w: invalid file path for question %q", ErrInvalidSurveyAnswers, q.ID)
		}
		return path, nil
	}
	var paths []string
	if err := json.Unmarshal(raw, &paths); err != nil || len(paths) == 0 {
		return nil, fmt.Errorf("%w: question %q expects file path array", ErrInvalidSurveyAnswers, q.ID)
	}
	if len(paths) > q.MaxFiles {
		return nil, fmt.Errorf("%w: question %q allows at most %d files", ErrInvalidSurveyAnswers, q.ID, q.MaxFiles)
	}
	uniq := make([]string, 0, len(paths))
	used := make(map[string]struct{})
	for _, path := range paths {
		path = strings.TrimSpace(path)
		if path == "" {
			continue
		}
		if err := upload.ValidateSurveyResponseFilePath(path); err != nil {
			return nil, fmt.Errorf("%w: invalid file path for question %q", ErrInvalidSurveyAnswers, q.ID)
		}
		if _, dup := used[path]; dup {
			continue
		}
		used[path] = struct{}{}
		uniq = append(uniq, path)
	}
	if len(uniq) == 0 {
		return nil, fmt.Errorf("%w: question %q expects at least one file", ErrInvalidSurveyAnswers, q.ID)
	}
	return uniq, nil
}

func decodeStringMap(raw json.RawMessage) (map[string]string, error) {
	rawMap, err := decodeRawMap(raw)
	if err != nil {
		return nil, err
	}
	out := make(map[string]string, len(rawMap))
	for k, v := range rawMap {
		var s string
		if err := json.Unmarshal(v, &s); err != nil {
			return nil, err
		}
		s = strings.TrimSpace(s)
		if s != "" {
			out[k] = s
		}
	}
	return out, nil
}

func decodeRawMap(raw json.RawMessage) (map[string]json.RawMessage, error) {
	var out map[string]json.RawMessage
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, err
	}
	return out, nil
}

func fileAllowedExtensions(qType string, config json.RawMessage) map[string]struct{} {
	normalized := domain.NormalizeSurveyQuestionType(qType)
	format, ok := domain.SurveyFileFormats[normalized]
	allowed := make(map[string]struct{})
	if ok {
		for _, ext := range format.Extensions {
			allowed["."+strings.ToLower(strings.TrimPrefix(ext, "."))] = struct{}{}
		}
	}
	if len(config) > 0 {
		var cfg struct {
			AllowedExtensions []string `json:"allowedExtensions"`
		}
		_ = json.Unmarshal(config, &cfg)
		if len(cfg.AllowedExtensions) > 0 {
			allowed = make(map[string]struct{}, len(cfg.AllowedExtensions))
			for _, ext := range cfg.AllowedExtensions {
				ext = strings.ToLower(strings.TrimPrefix(strings.TrimSpace(ext), "."))
				if ext != "" {
					allowed["."+ext] = struct{}{}
				}
			}
		}
	}
	return allowed
}

func fileMaxBytes(qType string, config json.RawMessage, fallback int64) int64 {
	normalized := domain.NormalizeSurveyQuestionType(qType)
	maxMB := 0
	if format, ok := domain.SurveyFileFormats[normalized]; ok {
		maxMB = format.DefaultMaxSizeMB
	}
	if len(config) > 0 {
		var cfg struct {
			MaxFileSizeMb int `json:"maxFileSizeMb"`
		}
		_ = json.Unmarshal(config, &cfg)
		if cfg.MaxFileSizeMb > 0 {
			maxMB = cfg.MaxFileSizeMb
		}
	}
	if maxMB < 1 {
		return fallback
	}
	return int64(maxMB) * 1024 * 1024
}

func findSurveyQuestion(questions json.RawMessage, questionID string) (json.RawMessage, bool) {
	var items []json.RawMessage
	if err := json.Unmarshal(questions, &items); err != nil {
		return nil, false
	}
	for _, raw := range items {
		var meta struct {
			ID string `json:"id"`
		}
		if err := json.Unmarshal(raw, &meta); err != nil {
			continue
		}
		if strings.TrimSpace(meta.ID) == questionID {
			return raw, true
		}
	}
	return nil, false
}

func extractConfirmationMessage(settings json.RawMessage) string {
	if len(settings) == 0 {
		return ""
	}
	var obj struct {
		ConfirmationMessage string `json:"confirmationMessage"`
	}
	_ = json.Unmarshal(settings, &obj)
	return strings.TrimSpace(obj.ConfirmationMessage)
}

func filterPublicSettings(settings json.RawMessage) json.RawMessage {
	if len(settings) == 0 {
		return json.RawMessage(`{}`)
	}
	var obj map[string]json.RawMessage
	if err := json.Unmarshal(settings, &obj); err != nil {
		return json.RawMessage(`{}`)
	}
	allowed := []string{"collectEmail", "shuffleQuestions", "showProgressBar"}
	out := make(map[string]json.RawMessage, len(allowed))
	for _, key := range allowed {
		if v, ok := obj[key]; ok {
			out[key] = v
		}
	}
	data, err := json.Marshal(out)
	if err != nil {
		return json.RawMessage(`{}`)
	}
	return data
}

func parseQuestionTypeFromRaw(raw json.RawMessage) string {
	var meta struct {
		Type string `json:"type"`
	}
	_ = json.Unmarshal(raw, &meta)
	return domain.NormalizeSurveyQuestionType(strings.TrimSpace(meta.Type))
}

func parseQuestionConfigFromRaw(raw json.RawMessage) json.RawMessage {
	var meta struct {
		Config json.RawMessage `json:"config"`
	}
	_ = json.Unmarshal(raw, &meta)
	return meta.Config
}

func formatResponseID(id int64) string {
	return strconv.FormatInt(id, 10)
}
