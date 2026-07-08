package telegram

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"
)

var (
	ErrInitDataMissing     = errors.New("init data is missing")
	ErrInitDataInvalid     = errors.New("init data is invalid")
	ErrInitDataExpired     = errors.New("init data expired")
	ErrInitDataUserMissing = errors.New("init data user is missing")
)

type WebAppUser struct {
	ID           int64  `json:"id"`
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	Username     string `json:"username"`
	LanguageCode string `json:"language_code"`
	IsPremium    bool   `json:"is_premium"`
	PhotoURL     string `json:"photo_url"`
}

func ValidateInitData(initData, botToken string, maxAge time.Duration) (map[string]string, error) {
	initData = strings.TrimSpace(initData)
	if initData == "" {
		return nil, ErrInitDataMissing
	}
	if strings.TrimSpace(botToken) == "" {
		return nil, fmt.Errorf("bot token is not configured")
	}

	values, err := url.ParseQuery(initData)
	if err != nil {
		return nil, fmt.Errorf("%w: parse query", ErrInitDataInvalid)
	}

	receivedHash := values.Get("hash")
	if receivedHash == "" {
		return nil, fmt.Errorf("%w: hash missing", ErrInitDataInvalid)
	}

	if maxAge > 0 {
		authDateRaw := values.Get("auth_date")
		authDate, err := strconv.ParseInt(authDateRaw, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("%w: auth_date invalid", ErrInitDataInvalid)
		}
		authTime := time.Unix(authDate, 0)
		if time.Since(authTime) > maxAge {
			return nil, ErrInitDataExpired
		}
	}

	var pairs []string
	flat := make(map[string]string, len(values))
	for key, vals := range values {
		if key == "hash" || len(vals) == 0 {
			continue
		}
		flat[key] = vals[0]
		pairs = append(pairs, key+"="+vals[0])
	}
	sort.Strings(pairs)
	dataCheckString := strings.Join(pairs, "\n")

	secretMAC := hmac.New(sha256.New, []byte("WebAppData"))
	secretMAC.Write([]byte(botToken))
	secretKey := secretMAC.Sum(nil)

	signMAC := hmac.New(sha256.New, secretKey)
	signMAC.Write([]byte(dataCheckString))
	calculatedHash := hex.EncodeToString(signMAC.Sum(nil))

	if !hmac.Equal([]byte(calculatedHash), []byte(receivedHash)) {
		return nil, ErrInitDataInvalid
	}

	return flat, nil
}

func ParseWebAppUser(initData map[string]string) (*WebAppUser, error) {
	rawUser := strings.TrimSpace(initData["user"])
	if rawUser == "" {
		return nil, ErrInitDataUserMissing
	}

	var user WebAppUser
	if err := json.Unmarshal([]byte(rawUser), &user); err != nil {
		return nil, fmt.Errorf("parse init data user: %w", err)
	}
	if user.ID == 0 {
		return nil, ErrInitDataUserMissing
	}

	return &user, nil
}
