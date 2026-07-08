package main

import (
	"bufio"
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/go-playground/validator/v10"

	"github.com/joho/godotenv"
	"github.com/odatlar-bot/backend/internal/config"
	"github.com/odatlar-bot/backend/internal/database"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
	"github.com/odatlar-bot/backend/internal/service"
	jwtPkg "github.com/odatlar-bot/backend/pkg/jwt"
)

func main() {
	firstName := flag.String("first_name", "", "Ism")
	lastName := flag.String("last_name", "", "Familiya")
	phone := flag.String("phone", "", "Telefon raqam")
	username := flag.String("username", "", "Username")
	password := flag.String("password", "", "Parol (min 8 belgi)")
	flag.Parse()

	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, using environment variables")
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	req := dto.CreateAdminRequest{
		FirstName: *firstName,
		LastName:  *lastName,
		Phone:     *phone,
		Username:  *username,
		Password:  *password,
	}

	if req.FirstName == "" || req.LastName == "" || req.Phone == "" || req.Username == "" || req.Password == "" {
		req, err = promptAdmin(req)
		if err != nil {
			log.Fatalf("input error: %v", err)
		}
	}

	if err := validator.New().Struct(req); err != nil {
		log.Fatalf("validatsiya xatosi: %v", err)
	}

	ctx := context.Background()

	pool, err := database.NewPool(ctx, cfg)
	if err != nil {
		log.Fatalf("database connection error: %v", err)
	}
	defer pool.Close()

	if err := database.RunMigrations(ctx, pool); err != nil {
		log.Fatalf("migration error: %v", err)
	}

	adminRepo := repository.NewAdminRepository(pool)
	jwtManager := jwtPkg.NewManager(cfg.JWTSecret, cfg.JWTExpiry())
	adminService := service.NewAdminService(adminRepo, jwtManager)

	admin, err := adminService.Create(ctx, req)
	if err != nil {
		log.Fatalf("admin yaratilmadi: %v", err)
	}

	fmt.Println()
	fmt.Println("Admin muvaffaqiyatli yaratildi:")
	fmt.Printf("  ID:        %s\n", admin.ID)
	fmt.Printf("  Ism:       %s\n", admin.FirstName)
	fmt.Printf("  Familiya:  %s\n", admin.LastName)
	fmt.Printf("  Telefon:   %s\n", admin.Phone)
	fmt.Printf("  Username:  %s\n", admin.Username)
	fmt.Printf("  Status:    %s\n", admin.Status)
	fmt.Println()
}

func promptAdmin(req dto.CreateAdminRequest) (dto.CreateAdminRequest, error) {
	reader := bufio.NewReader(os.Stdin)

	fmt.Println("Yangi admin yaratish")
	fmt.Println("------------------")

	req.FirstName = strings.TrimSpace(readLine(reader, "Ism: "))
	req.LastName = strings.TrimSpace(readLine(reader, "Familiya: "))
	req.Phone = strings.TrimSpace(readLine(reader, "Telefon: "))
	req.Username = strings.TrimSpace(readLine(reader, "Username: "))
	req.Password = strings.TrimSpace(readLine(reader, "Parol: "))

	return req, nil
}

func readLine(reader *bufio.Reader, prompt string) string {
	fmt.Print(prompt)
	line, _ := reader.ReadString('\n')
	return strings.TrimSpace(line)
}
