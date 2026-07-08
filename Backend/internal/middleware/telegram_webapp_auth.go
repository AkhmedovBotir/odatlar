package middleware

import (
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/pkg/response"
	"github.com/odatlar-bot/backend/pkg/telegram"
)

const TelegramWebAppUserKey = "telegram_webapp_user"

func TelegramWebAppAuth(repo *repository.BotSettingsRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		initData := extractTelegramInitData(c)
		if initData == "" {
			response.Unauthorized(c, "telegram init data required")
			c.Abort()
			return
		}

		settings, err := repo.Get(c.Request.Context())
		if err != nil || settings.BotToken == "" {
			response.Unauthorized(c, "bot is not configured")
			c.Abort()
			return
		}
		if !settings.IsActive {
			response.Forbidden(c, "bot is not active")
			c.Abort()
			return
		}

		parsed, err := telegram.ValidateInitData(initData, settings.BotToken, 24*time.Hour)
		if err != nil {
			response.Unauthorized(c, "invalid telegram init data")
			c.Abort()
			return
		}

		user, err := telegram.ParseWebAppUser(parsed)
		if err != nil {
			response.Unauthorized(c, "telegram user missing in init data")
			c.Abort()
			return
		}

		c.Set(TelegramWebAppUserKey, user)
		c.Next()
	}
}

func extractTelegramInitData(c *gin.Context) string {
	if initData := strings.TrimSpace(c.GetHeader("X-Telegram-Init-Data")); initData != "" {
		return initData
	}
	if initData := strings.TrimSpace(c.GetHeader("Authorization")); strings.HasPrefix(initData, "tma ") {
		return strings.TrimSpace(strings.TrimPrefix(initData, "tma "))
	}
	return ""
}
