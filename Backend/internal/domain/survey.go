package domain

import (
	"encoding/json"
	"time"
)

const (
	SurveyStatusDraft     = "draft"
	SurveyStatusPublished = "published"
	SurveyStatusClosed    = "closed"
)

var SurveyStatuses = map[string]bool{
	SurveyStatusDraft:     true,
	SurveyStatusPublished: true,
	SurveyStatusClosed:    true,
}

// --- Matn ---

const (
	SurveyTypeShortText = "short_text" // qisqa bir qatorli matn
	SurveyTypeLongText  = "long_text"  // ko'p qatorli matn (paragraph)
)

// --- Tanlov ---

const (
	SurveyTypeMultipleChoice = "multiple_choice" // bitta variant (radio)
	SurveyTypeCheckbox       = "checkbox"        // bir nechta variant
	SurveyTypeDropdown       = "dropdown"        // ro'yxatdan bitta tanlov
)

// --- Shkala va reyting ---

const (
	SurveyTypeLinearScale = "linear_scale" // raqamli shkala (masalan 1–5)
	SurveyTypeRating      = "rating"       // yulduzcha reyting
)

// --- Sana va vaqt ---

const (
	SurveyTypeDate     = "date"     // sana (YYYY-MM-DD)
	SurveyTypeTime     = "time"     // vaqt (HH:MM)
	SurveyTypeDateTime = "datetime" // sana + vaqt (ISO 8601)
)

// --- Aloqa va havola ---

const (
	SurveyTypeEmail  = "email"  // email manzil
	SurveyTypePhone  = "phone"  // telefon raqam
	SurveyTypeURL    = "url"    // veb-havola
	SurveyTypeNumber = "number" // raqam
)

// --- Fayl yuklash (format bo'yicha aniq turlar) ---

const (
	SurveyTypeFileImage        = "file_image"        // rasm (JPG, PNG, GIF, WebP, SVG, …)
	SurveyTypeFileVideo        = "file_video"        // video (MP4, WebM, MOV, …)
	SurveyTypeFileAudio        = "file_audio"        // audio (MP3, WAV, OGG, …)
	SurveyTypeFilePDF          = "file_pdf"          // PDF hujjat
	SurveyTypeFileDocument     = "file_document"     // matn hujjat (DOC, DOCX, TXT, RTF, ODT)
	SurveyTypeFileSpreadsheet  = "file_spreadsheet"  // jadval (XLS, XLSX, CSV, ODS)
	SurveyTypeFilePresentation = "file_presentation" // taqdimot (PPT, PPTX, ODP)
	SurveyTypeFileArchive      = "file_archive"      // arxiv (ZIP, RAR, 7Z, TAR, GZ)
	SurveyTypeFileAny          = "file_any"          // istalgan fayl (config.accept orqali cheklash)
	SurveyTypeFile             = "file"              // eski nom — file_any bilan bir xil (moslik)
)

// --- Tuzilma va jadval ---

const (
	SurveyTypeSection      = "section"       // bo'lim sarlavhasi (javobsiz)
	SurveyTypeGridChoice   = "grid_choice"   // jadval — har qator uchun bitta tanlov
	SurveyTypeGridCheckbox = "grid_checkbox" // jadval — har qator uchun ko'p tanlov
)

// SurveyQuestionTypes — barcha ruxsat etilgan savol turlari.
var SurveyQuestionTypes = map[string]bool{
	SurveyTypeShortText:      true,
	SurveyTypeLongText:       true,
	SurveyTypeMultipleChoice: true,
	SurveyTypeCheckbox:       true,
	SurveyTypeDropdown:       true,
	SurveyTypeLinearScale:    true,
	SurveyTypeRating:         true,
	SurveyTypeDate:           true,
	SurveyTypeTime:           true,
	SurveyTypeDateTime:       true,
	SurveyTypeEmail:          true,
	SurveyTypePhone:          true,
	SurveyTypeURL:            true,
	SurveyTypeNumber:         true,
	SurveyTypeFileImage:        true,
	SurveyTypeFileVideo:        true,
	SurveyTypeFileAudio:        true,
	SurveyTypeFilePDF:          true,
	SurveyTypeFileDocument:     true,
	SurveyTypeFileSpreadsheet:  true,
	SurveyTypeFilePresentation: true,
	SurveyTypeFileArchive:      true,
	SurveyTypeFileAny:          true,
	SurveyTypeFile:             true,
	SurveyTypeSection:          true,
	SurveyTypeGridChoice:       true,
	SurveyTypeGridCheckbox:     true,
}

// SurveyFileFormats — fayl savol turlari uchun ruxsat etilgan formatlar.
type SurveyFileFormat struct {
	QuestionType     string
	Category         string
	LabelUz          string
	MIMETypes        []string
	Extensions       []string
	DefaultMaxSizeMB int
	DefaultMaxFiles  int
}

var SurveyFileFormats = map[string]SurveyFileFormat{
	SurveyTypeFileImage: {
		QuestionType: SurveyTypeFileImage, Category: "image", LabelUz: "Rasm",
		MIMETypes: []string{
			"image/jpeg", "image/png", "image/gif", "image/webp",
			"image/bmp", "image/svg+xml", "image/heic", "image/heif", "image/tiff",
		},
		Extensions:       []string{"jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "heic", "heif", "tif", "tiff"},
		DefaultMaxSizeMB: 10, DefaultMaxFiles: 1,
	},
	SurveyTypeFileVideo: {
		QuestionType: SurveyTypeFileVideo, Category: "video", LabelUz: "Video",
		MIMETypes: []string{
			"video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
			"video/x-matroska", "video/x-m4v", "video/mpeg", "video/ogg",
		},
		Extensions:       []string{"mp4", "webm", "mov", "avi", "mkv", "m4v", "mpeg", "mpg", "ogv"},
		DefaultMaxSizeMB: 100, DefaultMaxFiles: 1,
	},
	SurveyTypeFileAudio: {
		QuestionType: SurveyTypeFileAudio, Category: "audio", LabelUz: "Audio",
		MIMETypes: []string{
			"audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4",
			"audio/aac", "audio/flac", "audio/webm", "audio/x-m4a",
		},
		Extensions:       []string{"mp3", "wav", "ogg", "m4a", "aac", "flac", "weba"},
		DefaultMaxSizeMB: 25, DefaultMaxFiles: 1,
	},
	SurveyTypeFilePDF: {
		QuestionType: SurveyTypeFilePDF, Category: "pdf", LabelUz: "PDF",
		MIMETypes:        []string{"application/pdf"},
		Extensions:       []string{"pdf"},
		DefaultMaxSizeMB: 20, DefaultMaxFiles: 1,
	},
	SurveyTypeFileDocument: {
		QuestionType: SurveyTypeFileDocument, Category: "document", LabelUz: "Matn hujjat",
		MIMETypes: []string{
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"application/vnd.oasis.opendocument.text",
			"application/rtf", "text/plain", "text/markdown",
		},
		Extensions:       []string{"doc", "docx", "odt", "rtf", "txt", "md"},
		DefaultMaxSizeMB: 15, DefaultMaxFiles: 1,
	},
	SurveyTypeFileSpreadsheet: {
		QuestionType: SurveyTypeFileSpreadsheet, Category: "spreadsheet", LabelUz: "Jadval / spreadsheet",
		MIMETypes: []string{
			"application/vnd.ms-excel",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"application/vnd.oasis.opendocument.spreadsheet",
			"text/csv", "text/tab-separated-values",
		},
		Extensions:       []string{"xls", "xlsx", "ods", "csv", "tsv"},
		DefaultMaxSizeMB: 15, DefaultMaxFiles: 1,
	},
	SurveyTypeFilePresentation: {
		QuestionType: SurveyTypeFilePresentation, Category: "presentation", LabelUz: "Taqdimot",
		MIMETypes: []string{
			"application/vnd.ms-powerpoint",
			"application/vnd.openxmlformats-officedocument.presentationml.presentation",
			"application/vnd.oasis.opendocument.presentation",
		},
		Extensions:       []string{"ppt", "pptx", "odp"},
		DefaultMaxSizeMB: 30, DefaultMaxFiles: 1,
	},
	SurveyTypeFileArchive: {
		QuestionType: SurveyTypeFileArchive, Category: "archive", LabelUz: "Arxiv",
		MIMETypes: []string{
			"application/zip", "application/x-rar-compressed", "application/x-7z-compressed",
			"application/gzip", "application/x-tar",
		},
		Extensions:       []string{"zip", "rar", "7z", "gz", "tar", "tgz"},
		DefaultMaxSizeMB: 50, DefaultMaxFiles: 1,
	},
	SurveyTypeFileAny: {
		QuestionType: SurveyTypeFileAny, Category: "any", LabelUz: "Istalgan fayl",
		MIMETypes:        []string{"*/*"},
		Extensions:       []string{},
		DefaultMaxSizeMB: 25, DefaultMaxFiles: 1,
	},
}

// IsSurveyFileType — savol turi fayl yuklash turimi.
func IsSurveyFileType(qType string) bool {
	if qType == SurveyTypeFile {
		return true
	}
	_, ok := SurveyFileFormats[qType]
	return ok
}

// NormalizeSurveyQuestionType — eski `file` ni `file_any` ga moslashtiradi.
func NormalizeSurveyQuestionType(qType string) string {
	if qType == SurveyTypeFile {
		return SurveyTypeFileAny
	}
	return qType
}

type Survey struct {
	ID          int64
	Slug        string
	Title       string
	Description string
	Settings    json.RawMessage
	Questions   json.RawMessage
	Status      string
	SortOrder   int
	CreatedAt   time.Time
	UpdatedAt   time.Time
	PublishedAt *time.Time
	ClosedAt    *time.Time
}
