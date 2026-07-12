// Odatlar Bot Backend API
//
// @title           Odatlar Bot API
// @version         1.0
// @description     Admin panel, Bot Runtime (Telegram WebApp), Qo'llanma (videolar, kurslar, fayllar) va Bildirishnomalar APIlari.
// @termsOfService  http://swagger.io/terms/
//
// @contact.name   API Support
// @contact.email  support@odatlar-bot.uz
//
// @license.name  MIT
// @license.url   https://opensource.org/licenses/MIT
//
// @host      localhost:8080
// @BasePath  /api/v1
//
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description JWT token. Format: Bearer {token}
//
// @securityDefinitions.apikey BotToken
// @in header
// @name Authorization
// @description Telegram bot token. Format: Bearer {bot_token}
//
// @securityDefinitions.apikey TelegramInitData
// @in header
// @name X-Telegram-Init-Data
// @description Telegram WebApp initData. Alternativa: Authorization: tma {initData}
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/odatlar-bot/backend/docs"
	"github.com/odatlar-bot/backend/internal/bot"
	"github.com/odatlar-bot/backend/internal/config"
	"github.com/odatlar-bot/backend/internal/database"
	"github.com/odatlar-bot/backend/internal/handler"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/internal/router"
	"github.com/odatlar-bot/backend/internal/service"
	jwtPkg "github.com/odatlar-bot/backend/pkg/jwt"
	"github.com/odatlar-bot/backend/pkg/upload"
	"github.com/odatlar-bot/backend/pkg/ws"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, using environment variables")
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	gin.SetMode(gin.ReleaseMode)

	ctx := context.Background()
	botCtx, botCancel := context.WithCancel(context.Background())
	defer botCancel()

	pool, err := database.NewPool(ctx, cfg)
	if err != nil {
		log.Fatalf("database connection error: %v", err)
	}
	defer pool.Close()

	if err := database.RunMigrations(ctx, pool); err != nil {
		log.Fatalf("migration error: %v", err)
	}
	log.Println("migrations applied")

	adminRepo := repository.NewAdminRepository(pool)
	botSettingsRepo := repository.NewBotSettingsRepository(pool)
	botUserRepo := repository.NewBotUserRepository(pool)
	jwtManager := jwtPkg.NewManager(cfg.JWTSecret, cfg.JWTExpiry())
	adminService := service.NewAdminService(adminRepo, jwtManager)
	xpSettingsRepo := repository.NewXPSettingsRepository(pool)
	xpService := service.NewXPService(xpSettingsRepo, botUserRepo)
	botSettingsService := service.NewBotSettingsService(botSettingsRepo, botUserRepo, xpService)

	adminHandler := handler.NewAdminHandler(adminService)
	authHandler := handler.NewAuthHandler(adminService)
	botSettingsHandler := handler.NewBotSettingsHandler(botSettingsService)
	botRuntimeService := service.NewBotRuntimeService(botSettingsRepo, botUserRepo, xpService)
	botRuntimeHandler := handler.NewBotRuntimeHandler(botRuntimeService)
	xpSettingsHandler := handler.NewXPSettingsHandler(xpService)
	practiceRepo := repository.NewPracticeRepository(pool)
	practiceService := service.NewPracticeService(practiceRepo, botUserRepo, xpService)
	practiceHandler := handler.NewPracticeHandler(practiceService)
	indicatorRepo := repository.NewIndicatorRepository(pool)
	indicatorService := service.NewIndicatorService(indicatorRepo, botUserRepo, xpService)
	indicatorHandler := handler.NewIndicatorHandler(indicatorService)
	archiveService := service.NewArchiveService(practiceRepo, indicatorRepo, botUserRepo)
	archiveHandler := handler.NewArchiveHandler(archiveService)
	habitSummaryService := service.NewHabitSummaryService(practiceRepo, indicatorRepo, botUserRepo)
	habitSummaryHandler := handler.NewHabitSummaryHandler(habitSummaryService)
	dominantRepo := repository.NewDominantRepository(pool)
	dominantService := service.NewDominantService(dominantRepo, botUserRepo, xpService)
	dominantHandler := handler.NewDominantHandler(dominantService)
	leaderboardService := service.NewLeaderboardService(botUserRepo)
	leaderboardHandler := handler.NewLeaderboardHandler(leaderboardService)
	statsRepo := repository.NewStatsRepository(pool)
	adminStatsService := service.NewAdminStatsService(statsRepo, botUserRepo, xpService)
	adminStatsHandler := handler.NewAdminStatsHandler(adminStatsService)
	monitoringRepo := repository.NewMonitoringRepository(pool)
	monitoringService := service.NewMonitoringService(monitoringRepo, botUserRepo, xpService)
	monitoringHandler := handler.NewMonitoringHandler(monitoringService)
	guideVideoRepo := repository.NewGuideVideoRepository(pool)
	uploadStorage := upload.NewStorage(cfg.UploadDir, cfg.PublicBaseURL, cfg.MaxPosterBytes, cfg.MaxVideoBytes, cfg.MaxGuideFileBytes)
	if err := uploadStorage.EnsureDirs(); err != nil {
		log.Fatalf("upload dir error: %v", err)
	}
	guideVideoService := service.NewGuideVideoService(guideVideoRepo, botUserRepo, uploadStorage)
	guideVideoAdminHandler := handler.NewGuideVideoAdminHandler(guideVideoService)
	guideVideoHandler := handler.NewGuideVideoHandler(guideVideoService)
	guideUploadHandler := handler.NewGuideUploadHandler(uploadStorage)
	guideCourseRepo := repository.NewGuideCourseRepository(pool)
	guideCourseService := service.NewGuideCourseService(guideCourseRepo)
	guideCourseAdminHandler := handler.NewGuideCourseAdminHandler(guideCourseService)
	guideCourseHandler := handler.NewGuideCourseHandler(guideCourseService)
	guideFileRepo := repository.NewGuideFileRepository(pool)
	guideFileService := service.NewGuideFileService(guideFileRepo, uploadStorage)
	guideFileAdminHandler := handler.NewGuideFileAdminHandler(guideFileService)
	guideFileHandler := handler.NewGuideFileHandler(guideFileService)
	notificationHub := ws.NewHub()
	notificationRepo := repository.NewNotificationRepository(pool)
	notificationService := service.NewNotificationService(notificationRepo, botUserRepo, notificationHub)
	notificationAdminHandler := handler.NewNotificationAdminHandler(notificationService)
	notificationHandler := handler.NewNotificationHandler(notificationService)
	notificationWSHandler := handler.NewNotificationWSHandler(notificationService, botSettingsRepo, botUserRepo)
	surveyRepo := repository.NewSurveyRepository(pool)
	surveyService := service.NewSurveyService(surveyRepo, uploadStorage, cfg.SurveyFrontendURL)
	surveyAdminHandler := handler.NewSurveyAdminHandler(surveyService)
	surveyHandler := handler.NewSurveyHandler(surveyService)

	engine := router.Setup(adminHandler, authHandler, botSettingsHandler, botRuntimeHandler, practiceHandler, indicatorHandler, archiveHandler, habitSummaryHandler, dominantHandler, xpSettingsHandler, leaderboardHandler, adminStatsHandler, monitoringHandler, guideVideoAdminHandler, guideVideoHandler, guideUploadHandler, guideCourseAdminHandler, guideCourseHandler, guideFileAdminHandler, guideFileHandler, notificationAdminHandler, notificationHandler, notificationWSHandler, surveyAdminHandler, surveyHandler, cfg.UploadDir, botSettingsRepo, jwtManager)

	addr := fmt.Sprintf(":%s", cfg.AppPort)
	srv := &http.Server{
		Addr:              addr,
		Handler:           engine,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		log.Printf("server starting on %s", addr)
		log.Printf("swagger docs: http://localhost:%s/swagger/index.html", cfg.AppPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	botRunner := bot.NewRunner(botSettingsRepo, botRuntimeService)
	go botRunner.Start(botCtx)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("shutting down server...")
	botCancel()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("server shutdown error: %v", err)
	}
	log.Println("server stopped")
}
