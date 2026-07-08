package router

import (
	"github.com/gin-gonic/gin"
	"github.com/odatlar-bot/backend/internal/handler"
	"github.com/odatlar-bot/backend/internal/middleware"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/pkg/jwt"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func Setup(
	adminHandler *handler.AdminHandler,
	authHandler *handler.AuthHandler,
	botSettingsHandler *handler.BotSettingsHandler,
	botRuntimeHandler *handler.BotRuntimeHandler,
	practiceHandler *handler.PracticeHandler,
	indicatorHandler *handler.IndicatorHandler,
	archiveHandler *handler.ArchiveHandler,
	habitSummaryHandler *handler.HabitSummaryHandler,
	dominantHandler *handler.DominantHandler,
	xpSettingsHandler *handler.XPSettingsHandler,
	leaderboardHandler *handler.LeaderboardHandler,
	adminStatsHandler *handler.AdminStatsHandler,
	monitoringHandler *handler.MonitoringHandler,
	botSettingsRepo *repository.BotSettingsRepository,
	jwtManager *jwt.Manager,
) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.ErrorLogger())
	r.Use(middleware.CORS())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	api := r.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.GET("/profile", middleware.Auth(jwtManager), authHandler.GetProfile)
		}

		admins := api.Group("/admins")
		admins.Use(middleware.Auth(jwtManager))
		{
			admins.POST("", adminHandler.Create)
			admins.GET("", adminHandler.List)
			admins.GET("/:id", adminHandler.GetByID)
			admins.PUT("/:id", adminHandler.Update)
			admins.PATCH("/:id/status", adminHandler.UpdateStatus)
			admins.DELETE("/:id", adminHandler.Delete)
		}

		bot := api.Group("/bot")
		bot.Use(middleware.Auth(jwtManager))
		{
			bot.GET("/settings", botSettingsHandler.GetSettings)
			bot.PUT("/settings", botSettingsHandler.UpdateSettings)
			bot.GET("/token", botSettingsHandler.GetToken)
			bot.PUT("/token", botSettingsHandler.UpdateToken)
			bot.DELETE("/token", botSettingsHandler.DeleteToken)
			bot.GET("/users", botSettingsHandler.ListUsers)
			bot.GET("/users/:id", botSettingsHandler.GetUserByID)
			bot.GET("/users/:id/monitoring", monitoringHandler.GetUserMonitoring)
			bot.GET("/users/:id/activity", monitoringHandler.GetUserActivity)
			bot.GET("/xp-settings", xpSettingsHandler.GetSettings)
			bot.PUT("/xp-settings", xpSettingsHandler.UpdateSettings)
			bot.GET("/stats", adminStatsHandler.GetOverview)
			bot.GET("/leaderboard", adminStatsHandler.GetLeaderboard)
		}

		botRuntime := api.Group("/bot-runtime")
		botRuntime.Use(middleware.BotTokenAuth(botSettingsRepo))
		{
			botRuntime.GET("/config", botRuntimeHandler.GetConfig)
			botRuntime.POST("/start", botRuntimeHandler.RegisterStart)
		}

		botWebApp := api.Group("/bot-runtime")
		botWebApp.Use(middleware.TelegramWebAppAuth(botSettingsRepo))
		{
			botWebApp.POST("/webapp/open", botRuntimeHandler.RegisterWebAppOpen)
			botWebApp.POST("/me", botRuntimeHandler.GetMe)
			botWebApp.GET("/practices", practiceHandler.List)
			botWebApp.POST("/practices", practiceHandler.Create)
			botWebApp.GET("/practices/history", practiceHandler.ListHistory)
			botWebApp.PUT("/practices/:id", practiceHandler.Update)
			botWebApp.DELETE("/practices/:id", practiceHandler.Delete)
			botWebApp.POST("/practices/:id/toggle", practiceHandler.Toggle)
			botWebApp.GET("/indicators", indicatorHandler.List)
			botWebApp.POST("/indicators", indicatorHandler.Create)
			botWebApp.GET("/indicators/history", indicatorHandler.ListHistory)
			botWebApp.PUT("/indicators/:id", indicatorHandler.Update)
			botWebApp.DELETE("/indicators/:id", indicatorHandler.Delete)
			botWebApp.POST("/indicators/:id/log", indicatorHandler.Log)
			botWebApp.GET("/archive", archiveHandler.Get)
			botWebApp.GET("/habits/summary", habitSummaryHandler.Get)
			botWebApp.GET("/dominants", dominantHandler.List)
			botWebApp.POST("/dominants", dominantHandler.Create)
			botWebApp.PUT("/dominants/:id", dominantHandler.Update)
			botWebApp.DELETE("/dominants/:id", dominantHandler.Delete)
			botWebApp.POST("/dominants/:id/session", dominantHandler.CompleteSession)
			botWebApp.GET("/leaderboard", leaderboardHandler.Get)
		}
	}

	return r
}
