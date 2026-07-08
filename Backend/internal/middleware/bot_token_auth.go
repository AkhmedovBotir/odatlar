package middleware

import (
	"crypto/subtle"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/pkg/response"
)

func BotTokenAuth(repo *repository.BotSettingsRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractBotToken(c)
		if token == "" {
			response.Unauthorized(c, "bot token required")
			c.Abort()
			return
		}

		settings, err := repo.Get(c.Request.Context())
		if err != nil || settings.BotToken == "" {
			response.Unauthorized(c, "invalid bot token")
			c.Abort()
			return
		}

		if subtle.ConstantTimeCompare([]byte(token), []byte(settings.BotToken)) != 1 {
			response.Unauthorized(c, "invalid bot token")
			c.Abort()
			return
		}

		if !settings.IsActive {
			response.Forbidden(c, "bot is not active")
			c.Abort()
			return
		}

		c.Next()
	}
}

func extractBotToken(c *gin.Context) string {
	if token := c.GetHeader("X-Bot-Token"); token != "" {
		return token
	}

	auth := c.GetHeader("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}

	return ""
}
