package dto

type ArchiveDayItemResponse struct {
	ID          string  `json:"id"`
	HabitID     string  `json:"habitId"`
	HabitName   string  `json:"habitName"`
	Status      string  `json:"status"`
	CompletedAt *string `json:"completedAt,omitempty"`
	Date        string  `json:"date"`
	Kind        string  `json:"kind,omitempty"`
	ValueLabel  *string `json:"valueLabel,omitempty"`
}

type ArchiveDayResponse struct {
	Date  string                   `json:"date"`
	Items []ArchiveDayItemResponse `json:"items"`
}

type ArchiveResponse struct {
	Days           []ArchiveDayResponse `json:"days"`
	CompletedCount int                  `json:"completedCount"`
	MissedCount    int                  `json:"missedCount"`
}
