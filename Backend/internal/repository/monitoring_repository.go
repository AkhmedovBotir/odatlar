package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type MonitoringRepository struct {
	pool *pgxpool.Pool
}

func NewMonitoringRepository(pool *pgxpool.Pool) *MonitoringRepository {
	return &MonitoringRepository{pool: pool}
}

type UserMonitoringAggregates struct {
	PracticeCount            int
	PracticeCompletionsTotal int
	PracticeCompletionsToday int
	PracticeCompletionsWeek  int
	BestStreak               int

	IndicatorCount     int
	IndicatorLogsTotal int
	IndicatorLogsToday int
	IndicatorLogsWeek  int

	DominantCount         int
	DominantSessionsTotal int
	DominantSessionsToday int
	DominantSessionsWeek  int
}

type MonitoredPracticeRow struct {
	ID               int64
	Name             string
	Streak           int
	CompletionsTotal int
	LastCompletedAt  *time.Time
	CreatedAt        time.Time
}

type MonitoredIndicatorRow struct {
	ID             int64
	Name           string
	LogsTotal      int
	LastValueLabel *string
	LastLoggedAt   *time.Time
	CreatedAt      time.Time
}

type MonitoredDominantRow struct {
	ID                int64
	Title             string
	Type              string
	SessionsCompleted int
	LastSessionAt     *time.Time
	CreatedAt         time.Time
}

type ActivityRow struct {
	Kind   string
	Title  string
	Detail string
	At     time.Time
}

// GetAggregates returns per-user activity counters. today/weekStart are DATE
// boundaries; dayStartTS/weekStartTS are timestamp boundaries for sessions.
func (r *MonitoringRepository) GetAggregates(ctx context.Context, botUserID int64, today, weekStart time.Time, dayStartTS, weekStartTS time.Time) (UserMonitoringAggregates, error) {
	var a UserMonitoringAggregates
	err := r.pool.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM user_practices WHERE bot_user_id = $1),
			(SELECT COUNT(*) FROM practice_completions WHERE bot_user_id = $1),
			(SELECT COUNT(*) FROM practice_completions WHERE bot_user_id = $1 AND date = $2),
			(SELECT COUNT(*) FROM practice_completions WHERE bot_user_id = $1 AND date >= $3),
			(SELECT COALESCE(MAX(streak), 0) FROM user_practices WHERE bot_user_id = $1),
			(SELECT COUNT(*) FROM user_indicators WHERE bot_user_id = $1),
			(SELECT COUNT(*) FROM indicator_logs WHERE bot_user_id = $1 AND is_empty = false),
			(SELECT COUNT(*) FROM indicator_logs WHERE bot_user_id = $1 AND is_empty = false AND date = $2),
			(SELECT COUNT(*) FROM indicator_logs WHERE bot_user_id = $1 AND is_empty = false AND date >= $3),
			(SELECT COUNT(*) FROM user_dominants WHERE bot_user_id = $1),
			(SELECT COUNT(*) FROM dominant_sessions WHERE bot_user_id = $1),
			(SELECT COUNT(*) FROM dominant_sessions WHERE bot_user_id = $1 AND completed_at >= $4),
			(SELECT COUNT(*) FROM dominant_sessions WHERE bot_user_id = $1 AND completed_at >= $5)`,
		botUserID, today, weekStart, dayStartTS, weekStartTS,
	).Scan(
		&a.PracticeCount, &a.PracticeCompletionsTotal, &a.PracticeCompletionsToday, &a.PracticeCompletionsWeek, &a.BestStreak,
		&a.IndicatorCount, &a.IndicatorLogsTotal, &a.IndicatorLogsToday, &a.IndicatorLogsWeek,
		&a.DominantCount, &a.DominantSessionsTotal, &a.DominantSessionsToday, &a.DominantSessionsWeek,
	)
	if err != nil {
		return UserMonitoringAggregates{}, fmt.Errorf("monitoring aggregates: %w", err)
	}
	return a, nil
}

func (r *MonitoringRepository) ListPracticeStats(ctx context.Context, botUserID int64) ([]MonitoredPracticeRow, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT p.id, p.name, p.streak, p.created_at,
			COUNT(pc.id) AS completions_total,
			MAX(pc.completed_at) AS last_completed_at
		FROM user_practices p
		LEFT JOIN practice_completions pc ON pc.practice_id = p.id
		WHERE p.bot_user_id = $1
		GROUP BY p.id
		ORDER BY p.created_at ASC`, botUserID)
	if err != nil {
		return nil, fmt.Errorf("practice stats: %w", err)
	}
	defer rows.Close()

	items := make([]MonitoredPracticeRow, 0)
	for rows.Next() {
		var it MonitoredPracticeRow
		if err := rows.Scan(&it.ID, &it.Name, &it.Streak, &it.CreatedAt, &it.CompletionsTotal, &it.LastCompletedAt); err != nil {
			return nil, fmt.Errorf("scan practice stat: %w", err)
		}
		items = append(items, it)
	}
	return items, nil
}

func (r *MonitoringRepository) ListIndicatorStats(ctx context.Context, botUserID int64) ([]MonitoredIndicatorRow, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT i.id, i.name, i.created_at,
			(SELECT COUNT(*) FROM indicator_logs l WHERE l.indicator_id = i.id AND l.is_empty = false) AS logs_total,
			last.value_label, last.completed_at
		FROM user_indicators i
		LEFT JOIN LATERAL (
			SELECT value_label, completed_at
			FROM indicator_logs
			WHERE indicator_id = i.id AND is_empty = false
			ORDER BY completed_at DESC
			LIMIT 1
		) last ON true
		WHERE i.bot_user_id = $1
		ORDER BY i.created_at ASC`, botUserID)
	if err != nil {
		return nil, fmt.Errorf("indicator stats: %w", err)
	}
	defer rows.Close()

	items := make([]MonitoredIndicatorRow, 0)
	for rows.Next() {
		var it MonitoredIndicatorRow
		if err := rows.Scan(&it.ID, &it.Name, &it.CreatedAt, &it.LogsTotal, &it.LastValueLabel, &it.LastLoggedAt); err != nil {
			return nil, fmt.Errorf("scan indicator stat: %w", err)
		}
		items = append(items, it)
	}
	return items, nil
}

func (r *MonitoringRepository) ListDominantStats(ctx context.Context, botUserID int64) ([]MonitoredDominantRow, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT d.id, d.title, d.type, d.sessions_completed, d.created_at,
			(SELECT MAX(completed_at) FROM dominant_sessions s WHERE s.dominant_id = d.id) AS last_session_at
		FROM user_dominants d
		WHERE d.bot_user_id = $1
		ORDER BY d.created_at ASC`, botUserID)
	if err != nil {
		return nil, fmt.Errorf("dominant stats: %w", err)
	}
	defer rows.Close()

	items := make([]MonitoredDominantRow, 0)
	for rows.Next() {
		var it MonitoredDominantRow
		if err := rows.Scan(&it.ID, &it.Title, &it.Type, &it.SessionsCompleted, &it.CreatedAt, &it.LastSessionAt); err != nil {
			return nil, fmt.Errorf("scan dominant stat: %w", err)
		}
		items = append(items, it)
	}
	return items, nil
}

func (r *MonitoringRepository) ListActivity(ctx context.Context, botUserID int64, from, to time.Time, limit int) ([]ActivityRow, error) {
	if limit < 1 {
		limit = 50
	}
	if limit > 500 {
		limit = 500
	}

	rows, err := r.pool.Query(ctx, `
		SELECT kind, title, detail, at FROM (
			SELECT 'practice_complete' AS kind, p.name AS title, '' AS detail, pc.completed_at AS at
			FROM practice_completions pc
			JOIN user_practices p ON p.id = pc.practice_id
			WHERE pc.bot_user_id = $1 AND pc.completed_at BETWEEN $2 AND $3
			UNION ALL
			SELECT 'indicator_log', i.name, COALESCE(l.value_label, ''), l.completed_at
			FROM indicator_logs l
			JOIN user_indicators i ON i.id = l.indicator_id
			WHERE l.bot_user_id = $1 AND l.is_empty = false AND l.completed_at BETWEEN $2 AND $3
			UNION ALL
			SELECT 'dominant_session', d.title, s.type, s.completed_at
			FROM dominant_sessions s
			JOIN user_dominants d ON d.id = s.dominant_id
			WHERE s.bot_user_id = $1 AND s.completed_at BETWEEN $2 AND $3
		) feed
		ORDER BY at DESC
		LIMIT $4`, botUserID, from, to, limit)
	if err != nil {
		return nil, fmt.Errorf("list activity: %w", err)
	}
	defer rows.Close()

	items := make([]ActivityRow, 0)
	for rows.Next() {
		var it ActivityRow
		if err := rows.Scan(&it.Kind, &it.Title, &it.Detail, &it.At); err != nil {
			return nil, fmt.Errorf("scan activity: %w", err)
		}
		items = append(items, it)
	}
	return items, nil
}
