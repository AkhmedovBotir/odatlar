package service

import "time"

func dateKeyFromTime(t time.Time) time.Time {
	local := t.In(tashkentTZ)
	y, m, d := local.Date()
	return time.Date(y, m, d, 0, 0, 0, 0, tashkentTZ)
}

func habitActiveOnDate(createdAt, date time.Time) bool {
	return !date.Before(dateKeyFromTime(createdAt))
}

func weekdayLabel(date, today time.Time) string {
	if date.Format("2006-01-02") == today.Format("2006-01-02") {
		return "B"
	}
	labels := []string{"Y", "D", "Se", "C", "P", "J", "Sh"}
	return labels[int(date.Weekday())]
}

func dayCompletionRate(completed, total int) int {
	if total == 0 {
		return 0
	}
	return int((float64(completed)/float64(total))*100 + 0.5)
}
