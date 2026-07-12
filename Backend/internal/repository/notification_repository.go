package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/odatlar-bot/backend/internal/domain"
)

var ErrNotificationNotFound = errors.New("notification not found")
var ErrNotificationDeliveryNotFound = errors.New("notification delivery not found")

type NotificationRepository struct {
	pool *pgxpool.Pool
}

func NewNotificationRepository(pool *pgxpool.Pool) *NotificationRepository {
	return &NotificationRepository{pool: pool}
}

func (r *NotificationRepository) ListAll(ctx context.Context) ([]domain.Notification, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, type, title, preview, payload, target, target_ids, status, sent_at, created_at, updated_at
		FROM notifications
		ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("list notifications: %w", err)
	}
	return scanNotifications(rows)
}

func (r *NotificationRepository) GetByID(ctx context.Context, id int64) (*domain.Notification, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, type, title, preview, payload, target, target_ids, status, sent_at, created_at, updated_at
		FROM notifications WHERE id = $1`, id)
	n, err := scanNotification(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotificationNotFound
		}
		return nil, err
	}
	return n, nil
}

func (r *NotificationRepository) Create(ctx context.Context, n *domain.Notification) (*domain.Notification, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO notifications (type, title, preview, payload, target, target_ids, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, type, title, preview, payload, target, target_ids, status, sent_at, created_at, updated_at`,
		n.Type, n.Title, n.Preview, n.Payload, n.Target, normalizeTargetIDs(n.TargetIDs), n.Status,
	)
	return scanNotification(row)
}

func (r *NotificationRepository) Update(ctx context.Context, n *domain.Notification) (*domain.Notification, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE notifications
		SET type = $1, title = $2, preview = $3, payload = $4, target = $5, target_ids = $6, updated_at = NOW()
		WHERE id = $7 AND status = 'draft'
		RETURNING id, type, title, preview, payload, target, target_ids, status, sent_at, created_at, updated_at`,
		n.Type, n.Title, n.Preview, n.Payload, n.Target, normalizeTargetIDs(n.TargetIDs), n.ID,
	)
	item, err := scanNotification(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotificationNotFound
		}
		return nil, err
	}
	return item, nil
}

func (r *NotificationRepository) MarkSent(ctx context.Context, id int64) (*domain.Notification, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE notifications
		SET status = 'sent', sent_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND status = 'draft'
		RETURNING id, type, title, preview, payload, target, target_ids, status, sent_at, created_at, updated_at`, id)
	item, err := scanNotification(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotificationNotFound
		}
		return nil, err
	}
	return item, nil
}

func (r *NotificationRepository) Delete(ctx context.Context, id int64) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM notifications WHERE id = $1 AND status = 'draft'`, id)
	if err != nil {
		return fmt.Errorf("delete notification: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotificationNotFound
	}
	return nil
}

func (r *NotificationRepository) CountDeliveries(ctx context.Context, notificationID int64) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM notification_deliveries WHERE notification_id = $1`, notificationID).Scan(&count)
	return count, err
}

func (r *NotificationRepository) CreateDeliveries(ctx context.Context, notificationID int64, userIDs []int64) ([]domain.NotificationDelivery, error) {
	if len(userIDs) == 0 {
		return nil, nil
	}
	rows, err := r.pool.Query(ctx, `
		INSERT INTO notification_deliveries (notification_id, bot_user_id)
		SELECT $1, UNNEST($2::bigint[])
		ON CONFLICT (notification_id, bot_user_id) DO NOTHING
		RETURNING id, notification_id, bot_user_id, is_read, read_at, created_at`,
		notificationID, userIDs,
	)
	if err != nil {
		return nil, fmt.Errorf("create deliveries: %w", err)
	}
	defer rows.Close()

	items := make([]domain.NotificationDelivery, 0, len(userIDs))
	for rows.Next() {
		var d domain.NotificationDelivery
		if err := rows.Scan(&d.ID, &d.NotificationID, &d.BotUserID, &d.IsRead, &d.ReadAt, &d.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, d)
	}
	return items, rows.Err()
}

func (r *NotificationRepository) ListDeliveriesByUser(ctx context.Context, botUserID int64) ([]domain.NotificationDelivery, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT d.id, d.notification_id, d.bot_user_id, d.is_read, d.read_at, d.created_at,
			n.id, n.type, n.title, n.preview, n.payload, n.target, n.target_ids, n.status, n.sent_at, n.created_at, n.updated_at
		FROM notification_deliveries d
		JOIN notifications n ON n.id = d.notification_id
		WHERE d.bot_user_id = $1
		ORDER BY d.created_at DESC`, botUserID)
	if err != nil {
		return nil, fmt.Errorf("list user notifications: %w", err)
	}
	defer rows.Close()

	items := make([]domain.NotificationDelivery, 0)
	for rows.Next() {
		var d domain.NotificationDelivery
		var n domain.Notification
		if err := rows.Scan(
			&d.ID, &d.NotificationID, &d.BotUserID, &d.IsRead, &d.ReadAt, &d.CreatedAt,
			&n.ID, &n.Type, &n.Title, &n.Preview, &n.Payload, &n.Target, &n.TargetIDs, &n.Status, &n.SentAt, &n.CreatedAt, &n.UpdatedAt,
		); err != nil {
			return nil, err
		}
		d.Notification = n
		items = append(items, d)
	}
	return items, rows.Err()
}

func (r *NotificationRepository) CountUnread(ctx context.Context, botUserID int64) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM notification_deliveries
		WHERE bot_user_id = $1 AND is_read = false`, botUserID).Scan(&count)
	return count, err
}

func (r *NotificationRepository) MarkDeliveryRead(ctx context.Context, deliveryID, botUserID int64) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE notification_deliveries
		SET is_read = true, read_at = NOW()
		WHERE id = $1 AND bot_user_id = $2 AND is_read = false`, deliveryID, botUserID)
	if err != nil {
		return fmt.Errorf("mark delivery read: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotificationDeliveryNotFound
	}
	return nil
}

func (r *NotificationRepository) MarkAllRead(ctx context.Context, botUserID int64) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE notification_deliveries
		SET is_read = true, read_at = NOW()
		WHERE bot_user_id = $1 AND is_read = false`, botUserID)
	return err
}

func (r *NotificationRepository) GetDeliveryByID(ctx context.Context, deliveryID, botUserID int64) (*domain.NotificationDelivery, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT d.id, d.notification_id, d.bot_user_id, d.is_read, d.read_at, d.created_at,
			n.id, n.type, n.title, n.preview, n.payload, n.target, n.target_ids, n.status, n.sent_at, n.created_at, n.updated_at
		FROM notification_deliveries d
		JOIN notifications n ON n.id = d.notification_id
		WHERE d.id = $1 AND d.bot_user_id = $2`, deliveryID, botUserID)
	var d domain.NotificationDelivery
	var n domain.Notification
	if err := row.Scan(
		&d.ID, &d.NotificationID, &d.BotUserID, &d.IsRead, &d.ReadAt, &d.CreatedAt,
		&n.ID, &n.Type, &n.Title, &n.Preview, &n.Payload, &n.Target, &n.TargetIDs, &n.Status, &n.SentAt, &n.CreatedAt, &n.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotificationDeliveryNotFound
		}
		return nil, err
	}
	d.Notification = n
	return &d, nil
}

func scanNotifications(rows pgx.Rows) ([]domain.Notification, error) {
	defer rows.Close()
	items := make([]domain.Notification, 0)
	for rows.Next() {
		var n domain.Notification
		if err := rows.Scan(
			&n.ID, &n.Type, &n.Title, &n.Preview, &n.Payload, &n.Target, &n.TargetIDs,
			&n.Status, &n.SentAt, &n.CreatedAt, &n.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, n)
	}
	return items, rows.Err()
}

func scanNotification(row pgx.Row) (*domain.Notification, error) {
	var n domain.Notification
	if err := row.Scan(
		&n.ID, &n.Type, &n.Title, &n.Preview, &n.Payload, &n.Target, &n.TargetIDs,
		&n.Status, &n.SentAt, &n.CreatedAt, &n.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return &n, nil
}

func normalizeTargetIDs(ids []int64) []int64 {
	if ids == nil {
		return []int64{}
	}
	return ids
}
