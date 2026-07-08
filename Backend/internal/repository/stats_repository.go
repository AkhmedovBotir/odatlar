package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type StatsRepository struct {
	pool *pgxpool.Pool
}

func NewStatsRepository(pool *pgxpool.Pool) *StatsRepository {
	return &StatsRepository{pool: pool}
}

type UserStats struct {
	Total          int64
	NewToday       int64
	NewThisWeek    int64
	ActiveThisWeek int64
	WithPhone      int64
	Premium        int64
}

type ActivityStats struct {
	TotalItems   int64
	TotalEntries int64
	EntriesToday int64
}

type XPStats struct {
	TotalXP  int64
	AvgXP    float64
	MaxXP    int64
	MaxLevel int64
	AvgLevel float64
}

// GetUserStats aggregates bot_users metrics. dayStart is the start of "today"
// and weekStart the start of the 7-day window (both in the app timezone).
func (r *StatsRepository) GetUserStats(ctx context.Context, dayStart, weekStart time.Time) (UserStats, error) {
	var s UserStats
	err := r.pool.QueryRow(ctx, `
		SELECT
			COUNT(*),
			COUNT(*) FILTER (WHERE started_at >= $1),
			COUNT(*) FILTER (WHERE started_at >= $2),
			COUNT(*) FILTER (WHERE last_start_at >= $2),
			COUNT(*) FILTER (WHERE phone IS NOT NULL AND phone <> ''),
			COUNT(*) FILTER (WHERE is_premium = true)
		FROM bot_users`,
		dayStart, weekStart,
	).Scan(&s.Total, &s.NewToday, &s.NewThisWeek, &s.ActiveThisWeek, &s.WithPhone, &s.Premium)
	if err != nil {
		return UserStats{}, fmt.Errorf("user stats: %w", err)
	}
	return s, nil
}

func (r *StatsRepository) GetPracticeStats(ctx context.Context, today time.Time) (ActivityStats, error) {
	return r.activityStats(ctx,
		`SELECT COUNT(*) FROM user_practices`,
		`SELECT COUNT(*) FROM practice_completions`,
		`SELECT COUNT(*) FROM practice_completions WHERE date = $1`,
		today,
	)
}

func (r *StatsRepository) GetIndicatorStats(ctx context.Context, today time.Time) (ActivityStats, error) {
	return r.activityStats(ctx,
		`SELECT COUNT(*) FROM user_indicators`,
		`SELECT COUNT(*) FROM indicator_logs WHERE is_empty = false`,
		`SELECT COUNT(*) FROM indicator_logs WHERE is_empty = false AND date = $1`,
		today,
	)
}

func (r *StatsRepository) GetDominantStats(ctx context.Context, dayStart time.Time) (ActivityStats, error) {
	var s ActivityStats
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM user_dominants`).Scan(&s.TotalItems); err != nil {
		return ActivityStats{}, fmt.Errorf("dominant items: %w", err)
	}
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM dominant_sessions`).Scan(&s.TotalEntries); err != nil {
		return ActivityStats{}, fmt.Errorf("dominant sessions: %w", err)
	}
	if err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM dominant_sessions WHERE completed_at >= $1`, dayStart,
	).Scan(&s.EntriesToday); err != nil {
		return ActivityStats{}, fmt.Errorf("dominant sessions today: %w", err)
	}
	return s, nil
}

func (r *StatsRepository) activityStats(ctx context.Context, itemsQuery, entriesQuery, todayQuery string, today time.Time) (ActivityStats, error) {
	var s ActivityStats
	if err := r.pool.QueryRow(ctx, itemsQuery).Scan(&s.TotalItems); err != nil {
		return ActivityStats{}, fmt.Errorf("activity items: %w", err)
	}
	if err := r.pool.QueryRow(ctx, entriesQuery).Scan(&s.TotalEntries); err != nil {
		return ActivityStats{}, fmt.Errorf("activity entries: %w", err)
	}
	if err := r.pool.QueryRow(ctx, todayQuery, today).Scan(&s.EntriesToday); err != nil {
		return ActivityStats{}, fmt.Errorf("activity entries today: %w", err)
	}
	return s, nil
}

func (r *StatsRepository) GetXPStats(ctx context.Context) (XPStats, error) {
	var s XPStats
	err := r.pool.QueryRow(ctx, `
		SELECT
			COALESCE(SUM(xp), 0),
			COALESCE(AVG(xp), 0),
			COALESCE(MAX(xp), 0),
			COALESCE(MAX(level), 0),
			COALESCE(AVG(level), 0)
		FROM bot_users`,
	).Scan(&s.TotalXP, &s.AvgXP, &s.MaxXP, &s.MaxLevel, &s.AvgLevel)
	if err != nil {
		return XPStats{}, fmt.Errorf("xp stats: %w", err)
	}
	return s, nil
}
