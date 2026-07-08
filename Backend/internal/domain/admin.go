package domain

import "time"

type AdminStatus string

const (
	AdminStatusActive   AdminStatus = "active"
	AdminStatusInactive AdminStatus = "inactive"
)

type Admin struct {
	ID        string      `json:"id"`
	FirstName string      `json:"first_name"`
	LastName  string      `json:"last_name"`
	Phone     string      `json:"phone"`
	Username  string      `json:"username"`
	Password  string      `json:"-"`
	Status    AdminStatus `json:"status"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
}

func (s AdminStatus) IsValid() bool {
	return s == AdminStatusActive || s == AdminStatusInactive
}

func (s AdminStatus) IsActive() bool {
	return s == AdminStatusActive
}
