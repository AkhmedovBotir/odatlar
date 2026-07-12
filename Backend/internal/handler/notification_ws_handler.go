package handler

import (
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/internal/service"
	"github.com/odatlar-bot/backend/pkg/response"
	"github.com/odatlar-bot/backend/pkg/telegram"
	"github.com/odatlar-bot/backend/pkg/ws"
)

type NotificationWSHandler struct {
	service         *service.NotificationService
	botSettingsRepo *repository.BotSettingsRepository
	userRepo        *repository.BotUserRepository
}

func NewNotificationWSHandler(
	svc *service.NotificationService,
	botSettingsRepo *repository.BotSettingsRepository,
	userRepo *repository.BotUserRepository,
) *NotificationWSHandler {
	return &NotificationWSHandler{service: svc, botSettingsRepo: botSettingsRepo, userRepo: userRepo}
}

// Connect godoc
// @Summary      Bildirishnomalar WebSocket
// @Description  Real-time bildirishnomalar uchun WebSocket ulanishi. initData query parametr orqali autentifikatsiya.
// @Tags         Notifications
// @Param        initData  query  string  true  "Telegram WebApp initData"
// @Success      101
// @Failure      401  {object}  response.ErrorBody
// @Failure      403  {object}  response.ErrorBody
// @Failure      404  {object}  response.ErrorBody
// @Router       /bot-runtime/ws/notifications [get]
func (h *NotificationWSHandler) Connect(c *gin.Context) {
	initData := strings.TrimSpace(c.Query("initData"))
	if initData == "" {
		response.Unauthorized(c, "telegram init data required")
		return
	}

	settings, err := h.botSettingsRepo.Get(c.Request.Context())
	if err != nil || settings.BotToken == "" {
		response.Unauthorized(c, "bot is not configured")
		return
	}
	if !settings.IsActive {
		response.Forbidden(c, "bot is not active")
		return
	}

	parsed, err := telegram.ValidateInitData(initData, settings.BotToken, 24*time.Hour)
	if err != nil {
		response.Unauthorized(c, "invalid telegram init data")
		return
	}
	tgUser, err := telegram.ParseWebAppUser(parsed)
	if err != nil {
		response.Unauthorized(c, "telegram user missing")
		return
	}

	botUser, err := h.userRepo.GetByTelegramID(c.Request.Context(), tgUser.ID)
	if err != nil {
		response.NotFound(c, "bot user not found")
		return
	}

	conn, err := ws.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	client := ws.NewClient(h.service.Hub(), botUser.ID, conn)
	client.Serve()
}
