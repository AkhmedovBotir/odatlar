package telegram

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"time"
)

var tokenPattern = regexp.MustCompile(`^\d+:[A-Za-z0-9_-]+$`)

type BotInfo struct {
	ID        int64  `json:"id"`
	Username  string `json:"username"`
	FirstName string `json:"first_name"`
}

type apiResponse struct {
	OK     bool `json:"ok"`
	Result struct {
		ID        int64  `json:"id"`
		Username  string `json:"username"`
		FirstName string `json:"first_name"`
	} `json:"result"`
	Description string `json:"description"`
}

func ValidateTokenFormat(token string) error {
	if !tokenPattern.MatchString(token) {
		return fmt.Errorf("invalid bot token format")
	}
	return nil
}

func GetBotInfo(ctx context.Context, token string) (*BotInfo, error) {
	if err := ValidateTokenFormat(token); err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 10 * time.Second}
	url := fmt.Sprintf("https://api.telegram.org/bot%s/getMe", token)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("telegram api request failed: %w", err)
	}
	defer resp.Body.Close()

	var result apiResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode telegram response: %w", err)
	}

	if !result.OK {
		if result.Description != "" {
			return nil, fmt.Errorf("telegram api: %s", result.Description)
		}
		return nil, fmt.Errorf("invalid bot token")
	}

	return &BotInfo{
		ID:        result.Result.ID,
		Username:  result.Result.Username,
		FirstName: result.Result.FirstName,
	}, nil
}

func MaskToken(token string) string {
	if token == "" {
		return ""
	}
	if len(token) <= 12 {
		return "****"
	}
	return token[:6] + "..." + token[len(token)-4:]
}
