package bot

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/internal/service"
)

var (
	openPTagRegex    = regexp.MustCompile(`(?i)<\s*p[^>]*>`)
	closePTagRegex   = regexp.MustCompile(`(?i)</\s*p\s*>`)
	breakTagRegex    = regexp.MustCompile(`(?i)<\s*br\s*/?\s*>`)
	openDivTagRegex  = regexp.MustCompile(`(?i)<\s*div[^>]*>`)
	closeDivTagRegex = regexp.MustCompile(`(?i)</\s*div\s*>`)
)

type Runner struct {
	settingsRepo *repository.BotSettingsRepository
	runtimeSvc   *service.BotRuntimeService
	httpClient   *http.Client
}

func NewRunner(settingsRepo *repository.BotSettingsRepository, runtimeSvc *service.BotRuntimeService) *Runner {
	return &Runner{
		settingsRepo: settingsRepo,
		runtimeSvc:   runtimeSvc,
		httpClient: &http.Client{
			Timeout: 65 * time.Second,
		},
	}
}

func (r *Runner) Start(ctx context.Context) {
	token, config, err := r.waitForSettings(ctx)
	if err != nil {
		log.Printf("[ERROR] telegram bot failed to load admin settings: %v", err)
		return
	}

	if config.Start.Message == "" {
		log.Println("[INFO] telegram bot start message is empty; default greeting will be used")
		config.Start.Message = "Assalomu alaykum!"
	}

	log.Printf("[INFO] telegram bot started successfully (username: @%s)", config.BotUsername)
	r.pollUpdates(ctx, token, config)
}

func (r *Runner) waitForSettings(ctx context.Context) (string, *runtimeConfig, error) {
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	for {
		settings, err := r.settingsRepo.Get(ctx)
		if err == nil {
			token := strings.TrimSpace(settings.BotToken)
			if settings.IsActive && token != "" {
				return token, &runtimeConfig{
					BotUsername: settings.BotUsername,
					Start: runtimeStart{
						Message: settings.StartMessage,
						Button: runtimeButton{
							Enabled:   settings.StartButtonEnabled,
							Text:      settings.StartButtonText,
							WebAppURL: settings.StartButtonWebAppURL,
						},
					},
				}, nil
			}
			err = fmt.Errorf("token is empty or bot inactive")
		}

		log.Printf("[WARN] telegram bot admin settings not ready yet: %v", err)
		select {
		case <-ctx.Done():
			return "", nil, ctx.Err()
		case <-ticker.C:
		}
	}
}

func (r *Runner) pollUpdates(ctx context.Context, token string, cfg *runtimeConfig) {
	var offset int64
	for {
		select {
		case <-ctx.Done():
			log.Println("[INFO] telegram bot stopped")
			return
		default:
		}

		latestToken, latestCfg, err := r.loadActiveSettings(ctx)
		if err != nil {
			log.Printf("[WARN] telegram bot settings reload failed: %v", err)
			time.Sleep(2 * time.Second)
			continue
		}
		if latestToken != token || !sameRuntimeConfig(cfg, latestCfg) {
			token = latestToken
			cfg = latestCfg
			log.Printf("[INFO] telegram bot config reloaded (username: @%s)", cfg.BotUsername)
		}

		updates, err := r.getUpdates(ctx, token, offset)
		if err != nil {
			log.Printf("[WARN] telegram getUpdates failed: %v", err)
			time.Sleep(2 * time.Second)
			continue
		}

		for _, upd := range updates {
			if upd.UpdateID >= offset {
				offset = upd.UpdateID + 1
			}
			avatarURL, avatarErr := r.getAvatarURL(ctx, token, upd.Message.From.ID)
			if avatarErr != nil {
				log.Printf("[WARN] failed to fetch avatar for %d: %v", upd.Message.From.ID, avatarErr)
			}

			if upd.Message.Contact != nil {
				user, err := r.registerStart(ctx, upd.Message.From, upd.Message.Contact.PhoneNumber, avatarURL)
				if err != nil {
					log.Printf("[WARN] failed to save contact for %d: %v", upd.Message.From.ID, err)
					continue
				}
				log.Printf("[INFO] phone number saved for user %d", user.TelegramID)
				if err := r.sendStartMessage(ctx, token, cfg, upd.Message.Chat.ID); err != nil {
					log.Printf("[WARN] failed to send start message to %d: %v", upd.Message.Chat.ID, err)
				}
				continue
			}

			if upd.Message.Text != "/start" {
				continue
			}

			user, err := r.registerStart(ctx, upd.Message.From, "", avatarURL)
			if err != nil {
				log.Printf("[WARN] failed to register /start for %d: %v", upd.Message.From.ID, err)
				continue
			}

			if strings.TrimSpace(user.Phone) == "" {
				if err := r.sendPhoneRequest(ctx, token, upd.Message.Chat.ID); err != nil {
					log.Printf("[WARN] failed to ask phone number from %d: %v", upd.Message.Chat.ID, err)
				}
				continue
			}

			if err := r.sendStartMessage(ctx, token, cfg, upd.Message.Chat.ID); err != nil {
				log.Printf("[WARN] failed to send start message to %d: %v", upd.Message.Chat.ID, err)
			}
		}
	}
}

func (r *Runner) loadActiveSettings(ctx context.Context) (string, *runtimeConfig, error) {
	settings, err := r.settingsRepo.Get(ctx)
	if err != nil {
		return "", nil, err
	}

	token := strings.TrimSpace(settings.BotToken)
	if !settings.IsActive || token == "" {
		return "", nil, fmt.Errorf("token is empty or bot inactive")
	}

	return token, &runtimeConfig{
		BotUsername: settings.BotUsername,
		Start: runtimeStart{
			Message: settings.StartMessage,
			Button: runtimeButton{
				Enabled:   settings.StartButtonEnabled,
				Text:      settings.StartButtonText,
				WebAppURL: settings.StartButtonWebAppURL,
			},
		},
	}, nil
}

func sameRuntimeConfig(a, b *runtimeConfig) bool {
	if a == nil || b == nil {
		return false
	}

	return a.BotUsername == b.BotUsername &&
		a.Start.Message == b.Start.Message &&
		a.Start.Button.Enabled == b.Start.Button.Enabled &&
		a.Start.Button.Text == b.Start.Button.Text &&
		a.Start.Button.WebAppURL == b.Start.Button.WebAppURL
}

func (r *Runner) getUpdates(ctx context.Context, token string, offset int64) ([]telegramUpdate, error) {
	url := fmt.Sprintf("https://api.telegram.org/bot%s/getUpdates", token)
	payload := map[string]any{
		"offset":          offset,
		"timeout":         30,
		"allowed_updates": []string{"message"},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := r.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var parsed telegramResponse[[]telegramUpdate]
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, err
	}
	if !parsed.OK {
		return nil, fmt.Errorf("telegram error: %s", parsed.Description)
	}
	return parsed.Result, nil
}

func (r *Runner) registerStart(ctx context.Context, from telegramUser, phone, avatarURL string) (*dto.BotUserResponse, error) {
	return r.runtimeSvc.RegisterStart(ctx, dto.BotStartUserRequest{
		TelegramID:   from.ID,
		FirstName:    from.FirstName,
		LastName:     from.LastName,
		Username:     from.Username,
		Phone:        strings.TrimSpace(phone),
		LanguageCode: from.LanguageCode,
		AvatarURL:    strings.TrimSpace(avatarURL),
		IsBot:        from.IsBot,
		IsPremium:    from.IsPremium,
	})
}

func (r *Runner) sendStartMessage(ctx context.Context, token string, cfg *runtimeConfig, chatID int64) error {
	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", token)
	payload := map[string]any{
		"chat_id": chatID,
		"text":    normalizeStartMessage(cfg.Start.Message),
	}

	if cfg.Start.Button.Enabled && cfg.Start.Button.Text != "" && cfg.Start.Button.WebAppURL != "" {
		payload["reply_markup"] = map[string]any{
			"inline_keyboard": [][]map[string]any{
				{
					{
						"text": cfg.Start.Button.Text,
						"web_app": map[string]string{
							"url": cfg.Start.Button.WebAppURL,
						},
					},
				},
			},
		}
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := r.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var parsed telegramResponse[json.RawMessage]
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return err
	}
	if !parsed.OK {
		return fmt.Errorf("telegram error: %s", parsed.Description)
	}
	return nil
}

func (r *Runner) sendPhoneRequest(ctx context.Context, token string, chatID int64) error {
	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", token)
	payload := map[string]any{
		"chat_id": chatID,
		"text":    "Telefon raqamingizni yuboring:",
		"reply_markup": map[string]any{
			"keyboard": [][]map[string]any{
				{
					{
						"text":            "Telefon raqamni yuborish",
						"request_contact": true,
					},
				},
			},
			"resize_keyboard":   true,
			"one_time_keyboard": true,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := r.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var parsed telegramResponse[json.RawMessage]
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return err
	}
	if !parsed.OK {
		return fmt.Errorf("telegram error: %s", parsed.Description)
	}
	return nil
}

func normalizeStartMessage(message string) string {
	msg := strings.TrimSpace(message)
	if msg == "" {
		return message
	}

	// Admin text editor can wrap plain text into <p> or <div>; Telegram shows them literally.
	msg = openPTagRegex.ReplaceAllString(msg, "")
	msg = closePTagRegex.ReplaceAllString(msg, "\n\n")
	msg = openDivTagRegex.ReplaceAllString(msg, "")
	msg = closeDivTagRegex.ReplaceAllString(msg, "\n")
	msg = breakTagRegex.ReplaceAllString(msg, "\n")
	msg = strings.TrimSpace(msg)
	return strings.TrimSpace(strings.ReplaceAll(msg, "\r\n", "\n"))
}

type runtimeConfig struct {
	BotUsername string       `json:"bot_username"`
	Start       runtimeStart `json:"start"`
}

type runtimeStart struct {
	Message string        `json:"message"`
	Button  runtimeButton `json:"button"`
}

type runtimeButton struct {
	Enabled   bool   `json:"enabled"`
	Text      string `json:"text"`
	WebAppURL string `json:"web_app_url"`
}

type telegramResponse[T any] struct {
	OK          bool   `json:"ok"`
	Result      T      `json:"result"`
	Description string `json:"description"`
}

type telegramUpdate struct {
	UpdateID int64 `json:"update_id"`
	Message  struct {
		Text string `json:"text"`
		Chat struct {
			ID int64 `json:"id"`
		} `json:"chat"`
		From    telegramUser     `json:"from"`
		Contact *telegramContact `json:"contact"`
	} `json:"message"`
}

type telegramUser struct {
	ID           int64  `json:"id"`
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	Username     string `json:"username"`
	LanguageCode string `json:"language_code"`
	IsBot        bool   `json:"is_bot"`
	IsPremium    bool   `json:"is_premium"`
}

type telegramContact struct {
	PhoneNumber string `json:"phone_number"`
	UserID      int64  `json:"user_id"`
}

func (r *Runner) getAvatarURL(ctx context.Context, token string, userID int64) (string, error) {
	photoURL := fmt.Sprintf("https://api.telegram.org/bot%s/getUserProfilePhotos", token)
	photoPayload := map[string]any{
		"user_id": userID,
		"limit":   1,
	}
	photoBody, err := json.Marshal(photoPayload)
	if err != nil {
		return "", err
	}

	photoReq, err := http.NewRequestWithContext(ctx, http.MethodPost, photoURL, bytes.NewReader(photoBody))
	if err != nil {
		return "", err
	}
	photoReq.Header.Set("Content-Type", "application/json")

	photoResp, err := r.httpClient.Do(photoReq)
	if err != nil {
		return "", err
	}
	defer photoResp.Body.Close()

	var photosResult telegramResponse[telegramUserPhotos]
	if err := json.NewDecoder(photoResp.Body).Decode(&photosResult); err != nil {
		return "", err
	}
	if !photosResult.OK {
		return "", fmt.Errorf("telegram error: %s", photosResult.Description)
	}
	if photosResult.Result.TotalCount == 0 || len(photosResult.Result.Photos) == 0 || len(photosResult.Result.Photos[0]) == 0 {
		return "", nil
	}

	fileID := photosResult.Result.Photos[0][len(photosResult.Result.Photos[0])-1].FileID
	filePath, err := r.getFilePath(ctx, token, fileID)
	if err != nil {
		return "", err
	}
	if filePath == "" {
		return "", nil
	}

	return fmt.Sprintf("https://api.telegram.org/file/bot%s/%s", token, filePath), nil
}

func (r *Runner) getFilePath(ctx context.Context, token, fileID string) (string, error) {
	url := fmt.Sprintf("https://api.telegram.org/bot%s/getFile", token)
	payload := map[string]any{"file_id": fileID}
	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := r.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var parsed telegramResponse[telegramFile]
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return "", err
	}
	if !parsed.OK {
		return "", fmt.Errorf("telegram error: %s", parsed.Description)
	}

	return parsed.Result.FilePath, nil
}

type telegramUserPhotos struct {
	TotalCount int               `json:"total_count"`
	Photos     [][]telegramPhoto `json:"photos"`
}

type telegramPhoto struct {
	FileID string `json:"file_id"`
}

type telegramFile struct {
	FilePath string `json:"file_path"`
}
