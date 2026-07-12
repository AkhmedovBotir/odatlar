package service

import (
	"context"
	"encoding/json"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/odatlar-bot/backend/internal/domain"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/pkg/telegram"
	"github.com/odatlar-bot/backend/pkg/ws"
)

var (
	ErrInvalidNotificationType   = errors.New("invalid notification type")
	ErrInvalidNotificationTarget = errors.New("invalid notification target")
	ErrNotificationNotDraft      = errors.New("notification is not draft")
	ErrNotificationEmptyTargets  = errors.New("no target users")
)

type NotificationService struct {
	notifRepo *repository.NotificationRepository
	userRepo  *repository.BotUserRepository
	hub       *ws.Hub
}

func NewNotificationService(
	notifRepo *repository.NotificationRepository,
	userRepo *repository.BotUserRepository,
	hub *ws.Hub,
) *NotificationService {
	return &NotificationService{notifRepo: notifRepo, userRepo: userRepo, hub: hub}
}

func (s *NotificationService) AdminList(ctx context.Context) (*dto.NotificationListResponse, error) {
	items, err := s.notifRepo.ListAll(ctx)
	if err != nil {
		return nil, err
	}
	data := make([]dto.NotificationResponse, 0, len(items))
	for i := range items {
		resp, err := s.toAdminResponse(ctx, &items[i])
		if err != nil {
			return nil, err
		}
		data = append(data, resp)
	}
	return &dto.NotificationListResponse{Data: data}, nil
}

func (s *NotificationService) AdminGet(ctx context.Context, id int64) (*dto.NotificationResponse, error) {
	n, err := s.notifRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	resp, err := s.toAdminResponse(ctx, n)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

func (s *NotificationService) AdminCreate(ctx context.Context, req dto.CreateNotificationRequest) (*dto.NotificationResponse, error) {
	if err := validateNotificationInput(req.Type, req.Target, req.TargetUserIDs); err != nil {
		return nil, err
	}
	payload := normalizePayload(req.Payload)
	target := req.Target
	if target == "" {
		target = domain.NotificationTargetAll
	}
	created, err := s.notifRepo.Create(ctx, &domain.Notification{
		Type:      strings.TrimSpace(req.Type),
		Title:     strings.TrimSpace(req.Title),
		Preview:   strings.TrimSpace(req.Preview),
		Payload:   payload,
		Target:    target,
		TargetIDs: req.TargetUserIDs,
		Status:    domain.NotificationStatusDraft,
	})
	if err != nil {
		return nil, err
	}
	resp, err := s.toAdminResponse(ctx, created)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

func (s *NotificationService) AdminUpdate(ctx context.Context, id int64, req dto.UpdateNotificationRequest) (*dto.NotificationResponse, error) {
	existing, err := s.notifRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing.Status != domain.NotificationStatusDraft {
		return nil, ErrNotificationNotDraft
	}
	if err := validateNotificationInput(req.Type, req.Target, req.TargetUserIDs); err != nil {
		return nil, err
	}
	updated, err := s.notifRepo.Update(ctx, &domain.Notification{
		ID:        id,
		Type:      strings.TrimSpace(req.Type),
		Title:     strings.TrimSpace(req.Title),
		Preview:   strings.TrimSpace(req.Preview),
		Payload:   normalizePayload(req.Payload),
		Target:    req.Target,
		TargetIDs: req.TargetUserIDs,
		Status:    existing.Status,
	})
	if err != nil {
		return nil, err
	}
	resp, err := s.toAdminResponse(ctx, updated)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

func (s *NotificationService) AdminDelete(ctx context.Context, id int64) error {
	existing, err := s.notifRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if existing.Status != domain.NotificationStatusDraft {
		return ErrNotificationNotDraft
	}
	return s.notifRepo.Delete(ctx, id)
}

func (s *NotificationService) AdminSend(ctx context.Context, id int64) (*dto.NotificationResponse, error) {
	existing, err := s.notifRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing.Status != domain.NotificationStatusDraft {
		return nil, ErrNotificationNotDraft
	}

	userIDs, err := s.resolveTargetUserIDs(ctx, existing.Target, existing.TargetIDs)
	if err != nil {
		return nil, err
	}
	if len(userIDs) == 0 {
		return nil, ErrNotificationEmptyTargets
	}

	deliveries, err := s.notifRepo.CreateDeliveries(ctx, id, userIDs)
	if err != nil {
		return nil, err
	}
	sent, err := s.notifRepo.MarkSent(ctx, id)
	if err != nil {
		return nil, err
	}

	for i := range deliveries {
		d := deliveries[i]
		d.Notification = *sent
		item := toUserNotification(&d)
		s.pushNotification(ctx, d.BotUserID, item)
	}

	resp, err := s.toAdminResponse(ctx, sent)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

func (s *NotificationService) ListForUser(ctx context.Context, tgUser *telegram.WebAppUser) (*dto.UserNotificationListResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}
	deliveries, err := s.notifRepo.ListDeliveriesByUser(ctx, botUser.ID)
	if err != nil {
		return nil, err
	}
	unread, err := s.notifRepo.CountUnread(ctx, botUser.ID)
	if err != nil {
		return nil, err
	}
	data := make([]dto.UserNotificationResponse, 0, len(deliveries))
	for i := range deliveries {
		data = append(data, toUserNotification(&deliveries[i]))
	}
	return &dto.UserNotificationListResponse{Data: data, UnreadCount: unread}, nil
}

func (s *NotificationService) MarkRead(ctx context.Context, tgUser *telegram.WebAppUser, deliveryID int64) (*dto.UnreadCountResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}
	if err := s.notifRepo.MarkDeliveryRead(ctx, deliveryID, botUser.ID); err != nil {
		return nil, err
	}
	unread, err := s.notifRepo.CountUnread(ctx, botUser.ID)
	if err != nil {
		return nil, err
	}
	s.pushUnreadCount(botUser.ID, unread)
	return &dto.UnreadCountResponse{UnreadCount: unread}, nil
}

func (s *NotificationService) MarkAllRead(ctx context.Context, tgUser *telegram.WebAppUser) (*dto.UnreadCountResponse, error) {
	botUser, err := s.resolveBotUser(ctx, tgUser.ID)
	if err != nil {
		return nil, err
	}
	if err := s.notifRepo.MarkAllRead(ctx, botUser.ID); err != nil {
		return nil, err
	}
	s.pushUnreadCount(botUser.ID, 0)
	return &dto.UnreadCountResponse{UnreadCount: 0}, nil
}

func (s *NotificationService) Hub() *ws.Hub {
	return s.hub
}

func (s *NotificationService) resolveBotUser(ctx context.Context, telegramID int64) (*domain.BotUser, error) {
	user, err := s.userRepo.GetByTelegramID(ctx, telegramID)
	if err != nil {
		return nil, ErrRuntimeBotUserNotFound
	}
	return user, nil
}

func (s *NotificationService) resolveTargetUserIDs(ctx context.Context, target string, selected []int64) ([]int64, error) {
	switch target {
	case domain.NotificationTargetAll:
		return s.userRepo.ListAllIDs(ctx)
	case domain.NotificationTargetSelected:
		if len(selected) == 0 {
			return nil, ErrNotificationEmptyTargets
		}
		return selected, nil
	default:
		return nil, ErrInvalidNotificationTarget
	}
}

func (s *NotificationService) toAdminResponse(ctx context.Context, n *domain.Notification) (dto.NotificationResponse, error) {
	count, err := s.notifRepo.CountDeliveries(ctx, n.ID)
	if err != nil {
		return dto.NotificationResponse{}, err
	}
	resp := dto.NotificationResponse{
		ID:            strconv.FormatInt(n.ID, 10),
		Type:          n.Type,
		Title:         n.Title,
		Preview:       n.Preview,
		Payload:       n.Payload,
		Target:        n.Target,
		TargetUserIDs: n.TargetIDs,
		Status:        n.Status,
		DeliveryCount: count,
		CreatedAt:     n.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:     n.UpdatedAt.UTC().Format(time.RFC3339),
	}
	if n.SentAt != nil {
		resp.SentAt = n.SentAt.UTC().Format(time.RFC3339)
	}
	return resp, nil
}

func (s *NotificationService) pushNotification(ctx context.Context, botUserID int64, item dto.UserNotificationResponse) {
	if s.hub == nil {
		return
	}
	s.hub.BroadcastEvent(botUserID, "notification", item)
	unread, err := s.notifRepo.CountUnread(ctx, botUserID)
	if err == nil {
		s.hub.BroadcastEvent(botUserID, "unread_count", dto.UnreadCountResponse{UnreadCount: unread})
	}
}

func (s *NotificationService) pushUnreadCount(botUserID int64, unread int) {
	if s.hub == nil {
		return
	}
	s.hub.BroadcastEvent(botUserID, "unread_count", dto.UnreadCountResponse{UnreadCount: unread})
}

func toUserNotification(d *domain.NotificationDelivery) dto.UserNotificationResponse {
	createdAt := d.CreatedAt
	if d.Notification.SentAt != nil {
		createdAt = *d.Notification.SentAt
	}
	return dto.UserNotificationResponse{
		ID:        strconv.FormatInt(d.ID, 10),
		Type:      d.Notification.Type,
		Title:     d.Notification.Title,
		Preview:   d.Notification.Preview,
		CreatedAt: createdAt.UTC().Format(time.RFC3339),
		IsRead:    d.IsRead,
		Payload:   d.Notification.Payload,
	}
}

func validateNotificationInput(notifType, target string, targetIDs []int64) error {
	if _, ok := domain.NotificationTypes[notifType]; !ok {
		return ErrInvalidNotificationType
	}
	if target == "" {
		target = domain.NotificationTargetAll
	}
	switch target {
	case domain.NotificationTargetAll:
		return nil
	case domain.NotificationTargetSelected:
		if len(targetIDs) == 0 {
			return ErrNotificationEmptyTargets
		}
		return nil
	default:
		return ErrInvalidNotificationTarget
	}
}

func normalizePayload(payload json.RawMessage) json.RawMessage {
	if len(payload) == 0 {
		return json.RawMessage(`{}`)
	}
	if !json.Valid(payload) {
		return json.RawMessage(`{}`)
	}
	return payload
}
