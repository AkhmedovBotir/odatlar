package dto

import "encoding/json"

type CreateNotificationRequest struct {
	Type          string          `json:"type" binding:"required"`
	Title         string          `json:"title" binding:"required,min=1,max=255"`
	Preview       string          `json:"preview" binding:"max=2000"`
	Payload       json.RawMessage `json:"payload"`
	Target        string          `json:"target" binding:"omitempty,oneof=all selected"`
	TargetUserIDs []int64         `json:"target_user_ids"`
}

type UpdateNotificationRequest struct {
	Type          string          `json:"type" binding:"required"`
	Title         string          `json:"title" binding:"required,min=1,max=255"`
	Preview       string          `json:"preview" binding:"max=2000"`
	Payload       json.RawMessage `json:"payload"`
	Target        string          `json:"target" binding:"required,oneof=all selected"`
	TargetUserIDs []int64         `json:"target_user_ids"`
}

type NotificationResponse struct {
	ID            string          `json:"id"`
	Type          string          `json:"type"`
	Title         string          `json:"title"`
	Preview       string          `json:"preview"`
	Payload       json.RawMessage `json:"payload,omitempty"`
	Target        string          `json:"target,omitempty"`
	TargetUserIDs []int64         `json:"targetUserIds,omitempty"`
	Status        string          `json:"status,omitempty"`
	DeliveryCount int             `json:"deliveryCount,omitempty"`
	SentAt        string          `json:"sentAt,omitempty"`
	CreatedAt     string          `json:"createdAt,omitempty"`
	UpdatedAt     string          `json:"updatedAt,omitempty"`
}

type NotificationListResponse struct {
	Data []NotificationResponse `json:"data"`
}

type UserNotificationResponse struct {
	ID        string          `json:"id"`
	Type      string          `json:"type"`
	Title     string          `json:"title"`
	Preview   string          `json:"preview"`
	CreatedAt string          `json:"createdAt"`
	IsRead    bool            `json:"isRead"`
	Payload   json.RawMessage `json:"payload"`
}

type UserNotificationListResponse struct {
	Data        []UserNotificationResponse `json:"data"`
	UnreadCount int                        `json:"unreadCount"`
}

type UnreadCountResponse struct {
	UnreadCount int `json:"unreadCount"`
}
