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
	guideVideoAdminHandler *handler.GuideVideoAdminHandler,
	guideVideoHandler *handler.GuideVideoHandler,
	guideUploadHandler *handler.GuideUploadHandler,
	guideCourseAdminHandler *handler.GuideCourseAdminHandler,
	guideCourseHandler *handler.GuideCourseHandler,
	guideFileAdminHandler *handler.GuideFileAdminHandler,
	guideFileHandler *handler.GuideFileHandler,
	notificationAdminHandler *handler.NotificationAdminHandler,
	notificationHandler *handler.NotificationHandler,
	notificationWSHandler *handler.NotificationWSHandler,
	surveyAdminHandler *handler.SurveyAdminHandler,
	surveyHandler *handler.SurveyHandler,
	uploadDir string,
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

	if uploadDir != "" {
		r.Static("/api/v1/uploads", uploadDir)
	}

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
			bot.GET("/guides/videos", guideVideoAdminHandler.List)
			bot.POST("/guides/videos", guideVideoAdminHandler.Create)
			bot.GET("/guides/videos/:id", guideVideoAdminHandler.Get)
			bot.PUT("/guides/videos/:id", guideVideoAdminHandler.Update)
			bot.DELETE("/guides/videos/:id", guideVideoAdminHandler.Delete)
			bot.POST("/guides/upload/poster", guideUploadHandler.UploadPoster)
			bot.POST("/guides/upload/video", guideUploadHandler.UploadVideo)
			bot.POST("/guides/upload/file", guideUploadHandler.UploadFile)
			bot.GET("/guides/courses", guideCourseAdminHandler.List)
			bot.POST("/guides/courses", guideCourseAdminHandler.Create)
			bot.GET("/guides/courses/:id", guideCourseAdminHandler.Get)
			bot.PUT("/guides/courses/:id", guideCourseAdminHandler.Update)
			bot.DELETE("/guides/courses/:id", guideCourseAdminHandler.Delete)
			bot.GET("/guides/files", guideFileAdminHandler.List)
			bot.POST("/guides/files", guideFileAdminHandler.Create)
			bot.GET("/guides/files/:id", guideFileAdminHandler.Get)
			bot.PUT("/guides/files/:id", guideFileAdminHandler.Update)
			bot.DELETE("/guides/files/:id", guideFileAdminHandler.Delete)
			bot.GET("/notifications", notificationAdminHandler.List)
			bot.POST("/notifications", notificationAdminHandler.Create)
			bot.GET("/notifications/:id", notificationAdminHandler.Get)
			bot.PUT("/notifications/:id", notificationAdminHandler.Update)
			bot.DELETE("/notifications/:id", notificationAdminHandler.Delete)
			bot.POST("/notifications/:id/send", notificationAdminHandler.Send)
			bot.GET("/surveys", surveyAdminHandler.List)
			bot.GET("/surveys/file-formats", surveyAdminHandler.ListFileFormats)
			bot.GET("/surveys/responses", surveyAdminHandler.ListResponses)
			bot.GET("/surveys/responses/:responseId", surveyAdminHandler.GetResponse)
			bot.DELETE("/surveys/responses/:responseId", surveyAdminHandler.DeleteResponse)
			bot.POST("/surveys", surveyAdminHandler.Create)
			bot.GET("/surveys/:id", surveyAdminHandler.Get)
			bot.GET("/surveys/:id/responses/summary", surveyAdminHandler.GetSurveyResponseSummary)
			bot.GET("/surveys/:id/responses", surveyAdminHandler.ListSurveyResponses)
			bot.PUT("/surveys/:id", surveyAdminHandler.Update)
			bot.DELETE("/surveys/:id", surveyAdminHandler.Delete)
			bot.POST("/surveys/:id/publish", surveyAdminHandler.Publish)
			bot.POST("/surveys/:id/close", surveyAdminHandler.Close)
		}

		surveys := api.Group("/surveys")
		{
			surveys.GET("", surveyHandler.List)
			surveys.GET("/:id", surveyHandler.Get)
			surveys.POST("/:id/responses", surveyHandler.Submit)
			surveys.POST("/:id/upload", surveyHandler.Upload)
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
			botWebApp.GET("/guides/videos", guideVideoHandler.List)
			botWebApp.GET("/guides/videos/:id", guideVideoHandler.Get)
			botWebApp.POST("/guides/videos/:id/like", guideVideoHandler.ToggleLike)
			botWebApp.GET("/guides/videos/:id/comments", guideVideoHandler.ListComments)
			botWebApp.POST("/guides/videos/:id/comments", guideVideoHandler.AddComment)
			botWebApp.GET("/guides/courses", guideCourseHandler.List)
			botWebApp.GET("/guides/courses/:id", guideCourseHandler.Get)
			botWebApp.GET("/guides/lessons/:lessonId", guideCourseHandler.GetLesson)
			botWebApp.GET("/guides/files", guideFileHandler.List)
			botWebApp.GET("/notifications", notificationHandler.List)
			botWebApp.POST("/notifications/:id/read", notificationHandler.MarkRead)
			botWebApp.POST("/notifications/read-all", notificationHandler.MarkAllRead)
			botWebApp.GET("/ws/notifications", notificationWSHandler.Connect)
		}
	}

	return r
}
