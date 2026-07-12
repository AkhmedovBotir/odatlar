package upload

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

const (
	GuideVideoPublicPrefix  = "/api/v1/uploads/guides/videos/"
	GuidePosterPublicPrefix = "/api/v1/uploads/guides/posters/"
	GuideFilePublicPrefix   = "/api/v1/uploads/guides/files/"
	SurveyResponsePublicPrefix = "/api/v1/uploads/surveys/responses/"
)

var (
	ErrFileTooLarge      = errors.New("file too large")
	ErrInvalidFileType   = errors.New("invalid file type")
	ErrEmptyFile         = errors.New("empty file")
	ErrInvalidVideoSrc   = errors.New("video src must be a URL or uploaded file path")
	ErrInvalidPosterPath = errors.New("poster must be an uploaded image file path")
	ErrInvalidGuideURL   = errors.New("guide file url must be a URL or uploaded file path")
)

var posterAllowedExt = map[string]struct{}{
	".jpg": {}, ".jpeg": {}, ".png": {}, ".webp": {}, ".gif": {},
}

var videoAllowedExt = map[string]struct{}{
	".mp4": {}, ".webm": {}, ".mov": {}, ".m4v": {},
}

var guideFileAllowedExt = map[string]struct{}{
	".txt": {}, ".pdf": {}, ".doc": {}, ".docx": {}, ".zip": {},
	".xls": {}, ".xlsx": {}, ".ppt": {}, ".pptx": {}, ".csv": {}, ".md": {},
}

type Storage struct {
	rootDir          string
	publicBaseURL    string
	maxPosterBytes   int64
	maxVideoBytes    int64
	maxGuideFileBytes int64
}

func NewStorage(rootDir, publicBaseURL string, maxPosterBytes, maxVideoBytes, maxGuideFileBytes int64) *Storage {
	return &Storage{
		rootDir:           rootDir,
		publicBaseURL:     strings.TrimRight(publicBaseURL, "/"),
		maxPosterBytes:    maxPosterBytes,
		maxVideoBytes:     maxVideoBytes,
		maxGuideFileBytes: maxGuideFileBytes,
	}
}

func (s *Storage) EnsureDirs() error {
	for _, dir := range []string{
		filepath.Join(s.rootDir, "guides", "videos"),
		filepath.Join(s.rootDir, "guides", "posters"),
		filepath.Join(s.rootDir, "guides", "files"),
		filepath.Join(s.rootDir, "surveys", "responses"),
	} {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return fmt.Errorf("create upload dir %s: %w", dir, err)
		}
	}
	return nil
}

func (s *Storage) RootDir() string {
	return s.rootDir
}

func (s *Storage) MaxGuideFileBytes() int64 {
	return s.maxGuideFileBytes
}

type SavedFile struct {
	Path      string `json:"path"`
	URL       string `json:"url"`
	Ext       string `json:"ext,omitempty"`
	SizeLabel string `json:"sizeLabel,omitempty"`
	SizeBytes int64  `json:"sizeBytes,omitempty"`
}

func (s *Storage) SavePoster(fileHeader *multipart.FileHeader) (*SavedFile, error) {
	return s.save(fileHeader, "guides/posters", posterAllowedExt, s.maxPosterBytes, GuidePosterPublicPrefix, true, nil)
}

func (s *Storage) SaveVideo(fileHeader *multipart.FileHeader) (*SavedFile, error) {
	return s.save(fileHeader, "guides/videos", videoAllowedExt, s.maxVideoBytes, GuideVideoPublicPrefix, true, nil)
}

func (s *Storage) SaveGuideFile(fileHeader *multipart.FileHeader) (*SavedFile, error) {
	saved, err := s.save(fileHeader, "guides/files", guideFileAllowedExt, s.maxGuideFileBytes, GuideFilePublicPrefix, false, nil)
	if err != nil {
		return nil, err
	}
	ext := strings.TrimPrefix(strings.ToLower(filepath.Ext(fileHeader.Filename)), ".")
	saved.Ext = ext
	saved.SizeBytes = fileHeader.Size
	saved.SizeLabel = FormatSizeLabel(fileHeader.Size)
	return saved, nil
}

func (s *Storage) SaveSurveyResponseFile(fileHeader *multipart.FileHeader, allowed map[string]struct{}, maxBytes int64) (*SavedFile, error) {
	if maxBytes < 1 {
		maxBytes = s.maxGuideFileBytes
	}
	saved, err := s.save(fileHeader, "surveys/responses", allowed, maxBytes, SurveyResponsePublicPrefix, false, isAllowedSurveyFileContent)
	if err != nil {
		return nil, err
	}
	ext := strings.TrimPrefix(strings.ToLower(filepath.Ext(fileHeader.Filename)), ".")
	saved.Ext = ext
	saved.SizeBytes = fileHeader.Size
	saved.SizeLabel = FormatSizeLabel(fileHeader.Size)
	return saved, nil
}

func ValidateSurveyResponseFilePath(path string) error {
	path = strings.TrimSpace(path)
	if path == "" {
		return ErrInvalidGuideURL
	}
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") {
		return nil
	}
	if strings.HasPrefix(path, SurveyResponsePublicPrefix) {
		return nil
	}
	return ErrInvalidGuideURL
}

func (s *Storage) save(
	fileHeader *multipart.FileHeader,
	subdir string,
	allowed map[string]struct{},
	maxBytes int64,
	publicPrefix string,
	strictMIME bool,
	contentValidator func(string, string, map[string]struct{}) bool,
) (*SavedFile, error) {
	if fileHeader == nil || fileHeader.Size == 0 {
		return nil, ErrEmptyFile
	}
	if fileHeader.Size > maxBytes {
		return nil, ErrFileTooLarge
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if _, ok := allowed[ext]; !ok {
		return nil, ErrInvalidFileType
	}

	src, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("open upload: %w", err)
	}
	defer src.Close()

	sniff := make([]byte, 512)
	n, err := src.Read(sniff)
	if err != nil && err != io.EOF {
		return nil, fmt.Errorf("read upload: %w", err)
	}
	contentType := http.DetectContentType(sniff[:n])
	if strictMIME && !isAllowedContent(contentType, allowed) {
		return nil, ErrInvalidFileType
	}
	if !strictMIME {
		if contentValidator != nil {
			if !contentValidator(contentType, ext, allowed) {
				return nil, ErrInvalidFileType
			}
		} else if !isAllowedGuideFileContent(contentType, ext) {
			return nil, ErrInvalidFileType
		}
	}
	if _, err := src.Seek(0, io.SeekStart); err != nil {
		return nil, fmt.Errorf("rewind upload: %w", err)
	}

	filename := uuid.NewString() + ext
	absPath := filepath.Join(s.rootDir, subdir, filename)
	dst, err := os.Create(absPath)
	if err != nil {
		return nil, fmt.Errorf("create file: %w", err)
	}
	defer dst.Close()

	limited := io.LimitReader(src, maxBytes+1)
	written, err := io.Copy(dst, limited)
	if err != nil {
		_ = os.Remove(absPath)
		return nil, fmt.Errorf("write file: %w", err)
	}
	if written > maxBytes {
		_ = os.Remove(absPath)
		return nil, ErrFileTooLarge
	}

	publicPath := publicPrefix + filename
	return &SavedFile{
		Path: publicPath,
		URL:  s.publicBaseURL + publicPath,
	}, nil
}

func isAllowedContent(contentType string, allowed map[string]struct{}) bool {
	switch {
	case strings.HasPrefix(contentType, "image/"):
		return hasExt(allowed, ".jpg", ".jpeg", ".png", ".webp", ".gif")
	case strings.HasPrefix(contentType, "video/"):
		return hasExt(allowed, ".mp4", ".webm", ".mov", ".m4v")
	default:
		return false
	}
}

func hasExt(allowed map[string]struct{}, exts ...string) bool {
	for _, ext := range exts {
		if _, ok := allowed[ext]; ok {
			return true
		}
	}
	return false
}

func ValidateVideoSrc(src string) error {
	src = strings.TrimSpace(src)
	if src == "" {
		return ErrInvalidVideoSrc
	}
	if strings.HasPrefix(src, "http://") || strings.HasPrefix(src, "https://") {
		return nil
	}
	if strings.HasPrefix(src, GuideVideoPublicPrefix) {
		return nil
	}
	return ErrInvalidVideoSrc
}

func ValidatePosterPath(poster string) error {
	poster = strings.TrimSpace(poster)
	if poster == "" {
		return nil
	}
	if strings.HasPrefix(poster, "http://") || strings.HasPrefix(poster, "https://") {
		return ErrInvalidPosterPath
	}
	if !strings.HasPrefix(poster, GuidePosterPublicPrefix) {
		return ErrInvalidPosterPath
	}
	return nil
}

func isAllowedGuideFileContent(contentType, ext string) bool {
	if _, ok := guideFileAllowedExt[ext]; !ok {
		return false
	}
	switch {
	case strings.HasPrefix(contentType, "text/"):
		return true
	case contentType == "application/pdf":
		return ext == ".pdf"
	case contentType == "application/zip":
		return ext == ".zip" || ext == ".docx" || ext == ".xlsx" || ext == ".pptx"
	case strings.HasPrefix(contentType, "application/vnd."):
		return true
	case contentType == "application/msword":
		return ext == ".doc"
	case contentType == "application/octet-stream":
		return true
	default:
		return contentType == "application/pdf"
	}
}

func isAllowedSurveyFileContent(contentType, ext string, allowed map[string]struct{}) bool {
	if _, ok := allowed[ext]; !ok {
		return false
	}
	switch {
	case strings.HasPrefix(contentType, "image/"),
		strings.HasPrefix(contentType, "video/"),
		strings.HasPrefix(contentType, "audio/"):
		return true
	case strings.HasPrefix(contentType, "text/"):
		return true
	case contentType == "application/pdf":
		return ext == ".pdf"
	case contentType == "application/zip":
		return ext == ".zip" || ext == ".docx" || ext == ".xlsx" || ext == ".pptx" || ext == ".7z"
	case strings.HasPrefix(contentType, "application/vnd."):
		return true
	case contentType == "application/msword":
		return ext == ".doc"
	case contentType == "application/gzip":
		return ext == ".gz" || ext == ".tgz"
	case contentType == "application/x-rar-compressed":
		return ext == ".rar"
	case contentType == "application/x-7z-compressed":
		return ext == ".7z"
	case contentType == "application/octet-stream":
		return true
	default:
		return false
	}
}

func ValidateGuideFileURL(url string) error {
	url = strings.TrimSpace(url)
	if url == "" {
		return ErrInvalidGuideURL
	}
	if strings.HasPrefix(url, "http://") || strings.HasPrefix(url, "https://") {
		return nil
	}
	if strings.HasPrefix(url, GuideFilePublicPrefix) {
		return nil
	}
	return ErrInvalidGuideURL
}

func FormatSizeLabel(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	value := float64(bytes) / float64(div)
	if value < 10 {
		return fmt.Sprintf("%.1f %cB", value, "KMGTPE"[exp])
	}
	return fmt.Sprintf("%.0f %cB", value, "KMGTPE"[exp])
}

func DeleteLocalFile(rootDir, publicPath string) error {
	publicPath = strings.TrimSpace(publicPath)
	if publicPath == "" {
		return nil
	}
	const prefix = "/api/v1/uploads/"
	if !strings.HasPrefix(publicPath, prefix) {
		return nil
	}
	rel := strings.TrimPrefix(publicPath, prefix)
	abs := filepath.Join(rootDir, filepath.FromSlash(rel))
	if err := os.Remove(abs); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}
