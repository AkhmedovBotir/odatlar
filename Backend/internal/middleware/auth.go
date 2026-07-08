package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/pkg/jwt"
	"github.com/odatlar-bot/backend/pkg/response"
)

const AdminIDKey = "admin_id"

func Auth(jwtManager *jwt.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, "authorization header required")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			response.Unauthorized(c, "invalid authorization header format")
			c.Abort()
			return
		}

		claims, err := jwtManager.Validate(parts[1])
		if err != nil {
			response.Unauthorized(c, "invalid or expired token")
			c.Abort()
			return
		}

		c.Set(AdminIDKey, claims.AdminID)
		c.Next()
	}
}

func GetAdminID(c *gin.Context) (string, bool) {
	val, exists := c.Get(AdminIDKey)
	if !exists {
		return "", false
	}
	adminID, ok := val.(string)
	return adminID, ok
}
