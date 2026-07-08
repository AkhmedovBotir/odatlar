package dto

type HabitWeekDayResponse struct {
	Date    string `json:"date"`
	Label   string `json:"label"`
	Rate    int    `json:"rate"`
	IsToday bool   `json:"isToday"`
}

type HabitSummaryResponse struct {
	Completed int                    `json:"completed"`
	Total     int                    `json:"total"`
	Percent   int                    `json:"percent"`
	Week      []HabitWeekDayResponse `json:"week"`
}
