package domain

import (
	"encoding/json"
	"time"
)

const (
	NotificationStatusDraft = "draft"
	NotificationStatusSent  = "sent"

	NotificationTargetAll      = "all"
	NotificationTargetSelected = "selected"
)

var NotificationTypes = map[string]struct{}{
	"mukofot": {},
	"reyting": {},
	"eslatma": {},
	"tizim":   {},
	"yutuq":   {},
	"mashq":   {},
}

type Notification struct {
	ID        int64
	Type      string
	Title     string
	Preview   string
	Payload   json.RawMessage
	Target    string
	TargetIDs []int64
	Status    string
	SentAt    *time.Time
	CreatedAt time.Time
	UpdatedAt time.Time
}

type NotificationDelivery struct {
	ID             int64
	NotificationID int64
	BotUserID      int64
	IsRead         bool
	ReadAt         *time.Time
	CreatedAt      time.Time
	Notification   Notification
}
