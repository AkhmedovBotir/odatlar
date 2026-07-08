package repository

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/odatlar-bot/backend/internal/domain"
)

var ErrAdminNotFound = errors.New("admin not found")

const adminSelectColumns = `
	id, first_name, last_name, phone, username, password_hash, status, created_at, updated_at`

type AdminRepository struct {
	pool *pgxpool.Pool
}

func NewAdminRepository(pool *pgxpool.Pool) *AdminRepository {
	return &AdminRepository{pool: pool}
}

func (r *AdminRepository) Create(ctx context.Context, admin *domain.Admin) error {
	query := `
		INSERT INTO admins (first_name, last_name, phone, username, password_hash, status)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at`

	var id int64
	err := r.pool.QueryRow(ctx, query,
		admin.FirstName,
		admin.LastName,
		admin.Phone,
		admin.Username,
		admin.Password,
		admin.Status,
	).Scan(&id, &admin.CreatedAt, &admin.UpdatedAt)

	if err != nil {
		if isUniqueViolation(err) {
			return fmt.Errorf("username or phone already exists")
		}
		return fmt.Errorf("create admin: %w", err)
	}

	admin.ID = formatID(id)
	return nil
}

func (r *AdminRepository) GetByID(ctx context.Context, id string) (*domain.Admin, error) {
	query := `SELECT ` + adminSelectColumns + ` FROM admins WHERE id = $1`

	admin, err := r.scanAdmin(r.pool.QueryRow(ctx, query, parseIDArg(id)))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAdminNotFound
		}
		return nil, fmt.Errorf("get admin by id: %w", err)
	}

	return admin, nil
}

func (r *AdminRepository) GetByUsername(ctx context.Context, username string) (*domain.Admin, error) {
	query := `SELECT ` + adminSelectColumns + ` FROM admins WHERE username = $1`

	admin, err := r.scanAdmin(r.pool.QueryRow(ctx, query, username))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAdminNotFound
		}
		return nil, fmt.Errorf("get admin by username: %w", err)
	}

	return admin, nil
}

func (r *AdminRepository) List(ctx context.Context, page, limit int) ([]domain.Admin, int64, error) {
	offset := (page - 1) * limit

	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM admins`).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count admins: %w", err)
	}

	query := `SELECT ` + adminSelectColumns + `
		FROM admins
		ORDER BY id DESC
		LIMIT $1 OFFSET $2`

	rows, err := r.pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list admins: %w", err)
	}
	defer rows.Close()

	var admins []domain.Admin
	for rows.Next() {
		admin, err := r.scanAdminFromRows(rows)
		if err != nil {
			return nil, 0, err
		}
		admins = append(admins, *admin)
	}

	if admins == nil {
		admins = []domain.Admin{}
	}

	return admins, total, nil
}

func (r *AdminRepository) Update(ctx context.Context, admin *domain.Admin) error {
	query := `
		UPDATE admins
		SET first_name = $1, last_name = $2, phone = $3, username = $4,
		    password_hash = $5, updated_at = NOW()
		WHERE id = $6
		RETURNING updated_at`

	err := r.pool.QueryRow(ctx, query,
		admin.FirstName,
		admin.LastName,
		admin.Phone,
		admin.Username,
		admin.Password,
		parseIDArg(admin.ID),
	).Scan(&admin.UpdatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrAdminNotFound
		}
		if isUniqueViolation(err) {
			return fmt.Errorf("username or phone already exists")
		}
		return fmt.Errorf("update admin: %w", err)
	}

	return nil
}

func (r *AdminRepository) UpdateStatus(ctx context.Context, id string, status domain.AdminStatus) (*domain.Admin, error) {
	query := `
		UPDATE admins
		SET status = $1, updated_at = NOW()
		WHERE id = $2
		RETURNING ` + adminSelectColumns

	admin, err := r.scanAdmin(r.pool.QueryRow(ctx, query, status, parseIDArg(id)))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrAdminNotFound
		}
		return nil, fmt.Errorf("update admin status: %w", err)
	}

	return admin, nil
}

func (r *AdminRepository) Delete(ctx context.Context, id string) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM admins WHERE id = $1`, parseIDArg(id))
	if err != nil {
		return fmt.Errorf("delete admin: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrAdminNotFound
	}

	return nil
}

func (r *AdminRepository) scanAdmin(row pgx.Row) (*domain.Admin, error) {
	var admin domain.Admin
	var id int64
	err := row.Scan(
		&id,
		&admin.FirstName,
		&admin.LastName,
		&admin.Phone,
		&admin.Username,
		&admin.Password,
		&admin.Status,
		&admin.CreatedAt,
		&admin.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	admin.ID = formatID(id)
	return &admin, nil
}

func (r *AdminRepository) scanAdminFromRows(rows pgx.Rows) (*domain.Admin, error) {
	var admin domain.Admin
	var id int64
	err := rows.Scan(
		&id,
		&admin.FirstName,
		&admin.LastName,
		&admin.Phone,
		&admin.Username,
		&admin.Password,
		&admin.Status,
		&admin.CreatedAt,
		&admin.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("scan admin: %w", err)
	}
	admin.ID = formatID(id)
	return &admin, nil
}

func formatID(id int64) string {
	return strconv.FormatInt(id, 10)
}

func parseIDArg(id string) int64 {
	n, _ := strconv.ParseInt(id, 10, 64)
	return n
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return strings.Contains(err.Error(), "duplicate key")
}
