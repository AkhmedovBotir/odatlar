package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/odatlar-bot/backend/internal/domain"
)

type BotUserRepository struct {
	pool *pgxpool.Pool
}

func NewBotUserRepository(pool *pgxpool.Pool) *BotUserRepository {
	return &BotUserRepository{pool: pool}
}

func (r *BotUserRepository) List(ctx context.Context, page, limit int, search string) ([]domain.BotUser, int64, error) {
	offset := (page - 1) * limit
	search = strings.TrimSpace(search)

	var total int64
	var err error

	if search != "" {
		pattern := "%" + search + "%"
		err = r.pool.QueryRow(ctx, `
			SELECT COUNT(*) FROM bot_users
			WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR username ILIKE $1
				OR phone ILIKE $1 OR CAST(telegram_id AS TEXT) ILIKE $1`,
			pattern,
		).Scan(&total)
	} else {
		err = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM bot_users`).Scan(&total)
	}
	if err != nil {
		return nil, 0, fmt.Errorf("count bot users: %w", err)
	}

	var rows interface {
		Next() bool
		Scan(dest ...any) error
		Close()
	}

	if search != "" {
		pattern := "%" + search + "%"
		rows, err = r.pool.Query(ctx, `
			SELECT id, telegram_id, first_name, last_name, username, phone, language_code, avatar_url, is_bot, is_premium, xp, level, started_at, last_start_at
			FROM bot_users
			WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR username ILIKE $1
				OR phone ILIKE $1 OR CAST(telegram_id AS TEXT) ILIKE $1
			ORDER BY last_start_at DESC
			LIMIT $2 OFFSET $3`, pattern, limit, offset)
	} else {
		rows, err = r.pool.Query(ctx, `
			SELECT id, telegram_id, first_name, last_name, username, phone, language_code, avatar_url, is_bot, is_premium, xp, level, started_at, last_start_at
			FROM bot_users
			ORDER BY last_start_at DESC
			LIMIT $1 OFFSET $2`, limit, offset)
	}
	if err != nil {
		return nil, 0, fmt.Errorf("list bot users: %w", err)
	}
	defer rows.Close()

	var users []domain.BotUser
	for rows.Next() {
		var u domain.BotUser
		var username, phone, lang, avatarURL *string
		var isBot, isPremium *bool
		if err := rows.Scan(
			&u.ID, &u.TelegramID, &u.FirstName, &u.LastName,
			&username, &phone, &lang, &avatarURL, &isBot, &isPremium, &u.XP, &u.Level, &u.StartedAt, &u.LastStartAt,
		); err != nil {
			return nil, 0, fmt.Errorf("scan bot user: %w", err)
		}
		if username != nil {
			u.Username = *username
		}
		if phone != nil {
			u.Phone = *phone
		}
		if lang != nil {
			u.LanguageCode = *lang
		}
		if avatarURL != nil {
			u.AvatarURL = *avatarURL
		}
		if isBot != nil {
			u.IsBot = *isBot
		}
		if isPremium != nil {
			u.IsPremium = *isPremium
		}
		users = append(users, u)
	}

	if users == nil {
		users = []domain.BotUser{}
	}

	return users, total, nil
}

func (r *BotUserRepository) UpsertOnStart(ctx context.Context, user *domain.BotUser) (*domain.BotUser, error) {
	query := `
		INSERT INTO bot_users (telegram_id, first_name, last_name, username, phone, language_code, avatar_url, is_bot, is_premium)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (telegram_id) DO UPDATE SET
			first_name = EXCLUDED.first_name,
			last_name = EXCLUDED.last_name,
			username = EXCLUDED.username,
			phone = COALESCE(NULLIF(EXCLUDED.phone, ''), bot_users.phone),
			language_code = EXCLUDED.language_code,
			avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), bot_users.avatar_url),
			is_bot = EXCLUDED.is_bot,
			is_premium = EXCLUDED.is_premium,
			last_start_at = NOW()
		RETURNING id, telegram_id, first_name, last_name, username, phone, language_code, avatar_url, is_bot, is_premium, xp, level, started_at, last_start_at`

	var username, phone, lang, avatarURL *string
	var isBot, isPremium *bool
	err := r.pool.QueryRow(ctx, query,
		user.TelegramID,
		user.FirstName,
		user.LastName,
		nullIfEmpty(user.Username),
		nullIfEmpty(user.Phone),
		nullIfEmpty(user.LanguageCode),
		nullIfEmpty(user.AvatarURL),
		user.IsBot,
		user.IsPremium,
	).Scan(
		&user.ID, &user.TelegramID, &user.FirstName, &user.LastName,
		&username, &phone, &lang, &avatarURL, &isBot, &isPremium, &user.XP, &user.Level, &user.StartedAt, &user.LastStartAt,
	)
	if err != nil {
		return nil, fmt.Errorf("upsert bot user: %w", err)
	}

	if username != nil {
		user.Username = *username
	}
	if phone != nil {
		user.Phone = *phone
	}
	if lang != nil {
		user.LanguageCode = *lang
	}
	if avatarURL != nil {
		user.AvatarURL = *avatarURL
	}
	if isBot != nil {
		user.IsBot = *isBot
	}
	if isPremium != nil {
		user.IsPremium = *isPremium
	}

	return user, nil
}

func (r *BotUserRepository) GetByID(ctx context.Context, id int64) (*domain.BotUser, error) {
	var u domain.BotUser
	var username, phone, lang, avatarURL *string
	var isBot, isPremium *bool

	err := r.pool.QueryRow(ctx, `
		SELECT id, telegram_id, first_name, last_name, username, phone, language_code, avatar_url, is_bot, is_premium, xp, level, started_at, last_start_at
		FROM bot_users
		WHERE id = $1`, id,
	).Scan(
		&u.ID, &u.TelegramID, &u.FirstName, &u.LastName,
		&username, &phone, &lang, &avatarURL, &isBot, &isPremium, &u.XP, &u.Level, &u.StartedAt, &u.LastStartAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get bot user by id: %w", err)
	}

	if username != nil {
		u.Username = *username
	}
	if phone != nil {
		u.Phone = *phone
	}
	if lang != nil {
		u.LanguageCode = *lang
	}
	if avatarURL != nil {
		u.AvatarURL = *avatarURL
	}
	if isBot != nil {
		u.IsBot = *isBot
	}
	if isPremium != nil {
		u.IsPremium = *isPremium
	}

	return &u, nil
}

// AddXP increments (or decrements) the user's XP by amount, clamping at 0,
// and recomputes level from levelUpXP. Returns the new xp and level.
func (r *BotUserRepository) AddXP(ctx context.Context, botUserID int64, amount, levelUpXP int) (int, int, error) {
	if levelUpXP < 1 {
		levelUpXP = 1
	}
	var xp, level int
	err := r.pool.QueryRow(ctx, `
		UPDATE bot_users
		SET xp = GREATEST(xp + $2, 0),
			level = (GREATEST(xp + $2, 0) / $3) + 1,
			last_start_at = last_start_at
		WHERE id = $1
		RETURNING xp, level`,
		botUserID, amount, levelUpXP,
	).Scan(&xp, &level)
	if err != nil {
		return 0, 0, fmt.Errorf("add xp: %w", err)
	}
	return xp, level, nil
}

func (r *BotUserRepository) GetByTelegramID(ctx context.Context, telegramID int64) (*domain.BotUser, error) {
	var u domain.BotUser
	var username, phone, lang, avatarURL *string
	var isBot, isPremium *bool

	err := r.pool.QueryRow(ctx, `
		SELECT id, telegram_id, first_name, last_name, username, phone, language_code, avatar_url, is_bot, is_premium, xp, level, started_at, last_start_at
		FROM bot_users
		WHERE telegram_id = $1`, telegramID,
	).Scan(
		&u.ID, &u.TelegramID, &u.FirstName, &u.LastName,
		&username, &phone, &lang, &avatarURL, &isBot, &isPremium, &u.XP, &u.Level, &u.StartedAt, &u.LastStartAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get bot user by telegram id: %w", err)
	}

	if username != nil {
		u.Username = *username
	}
	if phone != nil {
		u.Phone = *phone
	}
	if lang != nil {
		u.LanguageCode = *lang
	}
	if avatarURL != nil {
		u.AvatarURL = *avatarURL
	}
	if isBot != nil {
		u.IsBot = *isBot
	}
	if isPremium != nil {
		u.IsPremium = *isPremium
	}

	return &u, nil
}

func (r *BotUserRepository) ListTopByXP(ctx context.Context, limit int) ([]domain.BotUser, error) {
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	rows, err := r.pool.Query(ctx, `
		SELECT id, telegram_id, first_name, last_name, username, phone, language_code, avatar_url, is_bot, is_premium, xp, level, started_at, last_start_at
		FROM bot_users
		ORDER BY xp DESC, level DESC, last_start_at DESC
		LIMIT $1`, limit)
	if err != nil {
		return nil, fmt.Errorf("list top by xp: %w", err)
	}
	defer rows.Close()

	return scanBotUsers(rows)
}

func (r *BotUserRepository) CountAll(ctx context.Context) (int64, error) {
	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM bot_users`).Scan(&total); err != nil {
		return 0, fmt.Errorf("count bot users: %w", err)
	}
	return total, nil
}

func (r *BotUserRepository) GetRankByXP(ctx context.Context, botUserID int64) (int, error) {
	var rank int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*) + 1
		FROM bot_users
		WHERE xp > (SELECT xp FROM bot_users WHERE id = $1)`, botUserID,
	).Scan(&rank)
	if err != nil {
		return 0, fmt.Errorf("get rank by xp: %w", err)
	}
	return rank, nil
}

func (r *BotUserRepository) ListAllIDs(ctx context.Context) ([]int64, error) {
	rows, err := r.pool.Query(ctx, `SELECT id FROM bot_users ORDER BY id`)
	if err != nil {
		return nil, fmt.Errorf("list bot user ids: %w", err)
	}
	defer rows.Close()
	ids := make([]int64, 0)
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func scanBotUsers(rows interface {
	Next() bool
	Scan(dest ...any) error
}) ([]domain.BotUser, error) {
	var users []domain.BotUser
	for rows.Next() {
		var u domain.BotUser
		var username, phone, lang, avatarURL *string
		var isBot, isPremium *bool
		if err := rows.Scan(
			&u.ID, &u.TelegramID, &u.FirstName, &u.LastName,
			&username, &phone, &lang, &avatarURL, &isBot, &isPremium, &u.XP, &u.Level, &u.StartedAt, &u.LastStartAt,
		); err != nil {
			return nil, fmt.Errorf("scan bot user: %w", err)
		}
		if username != nil {
			u.Username = *username
		}
		if phone != nil {
			u.Phone = *phone
		}
		if lang != nil {
			u.LanguageCode = *lang
		}
		if avatarURL != nil {
			u.AvatarURL = *avatarURL
		}
		if isBot != nil {
			u.IsBot = *isBot
		}
		if isPremium != nil {
			u.IsPremium = *isPremium
		}
		users = append(users, u)
	}
	if users == nil {
		users = []domain.BotUser{}
	}
	return users, nil
}
