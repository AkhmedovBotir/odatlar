# Odatlar Bot Backend

Go va PostgreSQL asosidagi Admin API.

## Talablar

- Go 1.22+
- PostgreSQL 16+ (yoki Docker)

## O'rnatish

### 1. PostgreSQL

**Docker orqali (tavsiya etiladi):**
```bash
docker compose up -d
```

**Yoki PostgreSQL ni Windows ga o'rnatish:**
```powershell
winget install PostgreSQL.PostgreSQL.16 --accept-source-agreements --accept-package-agreements
```

Keyin `.env` faylida `DB_PASSWORD` ni o'z PostgreSQL parolingizga o'rnating va bazani yarating:

```powershell
$env:PGPASSWORD = "SIZNING_PAROLINGIZ"
& "C:\Program Files\PostgreSQL\18\bin\psql" -U postgres -c "CREATE DATABASE odatlar_bot;"
```

### 2. Loyihani ishga tushirish

```bash
cp .env.example .env   # DB_PASSWORD ni to'g'ri qiling
go mod tidy
go run ./cmd/create-admin   # birinchi adminni yaratish (interaktiv)
go run ./cmd/api
```

**Admin yaratish:**

```powershell
# Interaktiv (sorab to'ldiradi)
go run ./cmd/create-admin

# Flaglar bilan
go run ./cmd/create-admin -username admin -password admin12345 -first_name Admin -last_name User -phone 998901234567

# PowerShell script
.\scripts\create-admin.ps1 -Username admin -Password admin12345 -FirstName Admin -LastName User -Phone 998901234567

# Makefile
make create-admin
```

Server: `http://localhost:8080`  
Swagger: `http://localhost:8080/swagger/index.html`  
Admin API Docs: [docs/API.md](docs/API.md)  
Bot API Docs: [docs/BOT_API.md](docs/BOT_API.md)

## API Endpointlar

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| POST | `/api/v1/auth/login` | Admin login |
| GET | `/api/v1/auth/profile` | Profil (JWT kerak) |
| POST | `/api/v1/admins` | Admin yaratish |
| GET | `/api/v1/admins` | Adminlar ro'yxati |
| GET | `/api/v1/admins/:id` | Admin olish |
| PUT | `/api/v1/admins/:id` | Admin yangilash |
| PATCH | `/api/v1/admins/:id/status` | Status (active/inactive) |
| DELETE | `/api/v1/admins/:id` | Admin o'chirish |
| GET | `/api/v1/bot/settings` | Bot sozlamalari (token + /start) |
| PUT | `/api/v1/bot/settings` | /start xabari va pastki tugma |
| GET | `/api/v1/bot/token` | Bot token holati |
| PUT | `/api/v1/bot/token` | Bot token qo'shish/yangilash |
| DELETE | `/api/v1/bot/token` | Bot token o'chirish |
| GET | `/api/v1/bot/users` | /start bosgan foydalanuvchilar |
| GET | `/api/v1/bot-runtime/config` | Bot servisi: konfiguratsiya |
| POST | `/api/v1/bot-runtime/start` | Bot servisi: /start hodisasi |

## Xavfsizlik

- Parollar bcrypt (cost 12) bilan hashlanadi
- JWT autentifikatsiya
- Faqat `active` adminlar login qila oladi
- SQL injection himoyasi (parametrized queries)
- Parol API javoblarida qaytarilmaydi

## Loyiha tuzilmasi

```
cmd/api/          - Entry point
cmd/create-admin/ - Admin yaratish scripti
internal/
  config/         - Konfiguratsiya
  database/       - PostgreSQL ulanish
  domain/         - Biznes modellari
  dto/            - Request/Response DTO
  handler/        - HTTP handlerlar
  middleware/     - Auth, CORS
  repository/     - Ma'lumotlar bazasi
  router/         - Marshrutlar
  service/        - Biznes logika
pkg/
  hash/           - Bcrypt
  jwt/            - JWT token
  response/       - HTTP javoblar
migrations/       - SQL migratsiyalar
docs/             - Swagger hujjatlari
```
