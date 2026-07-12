# Odatlar Bot — Bot Servisi API Hujjatlari

**Versiya:** 1.0  
**Base URL:** `http://localhost:8080/api/v1`  
**Auditoriya:** Telegram bot loyihasi (foydalanuvchi tomoni)  
**Admin API:** [API.md](API.md)

---

## Mundarija

1. [Umumiy ma'lumot](#umumiy-malumot)
2. [Autentifikatsiya](#autentifikatsiya)
3. [Bot konfiguratsiyasi](#bot-konfiguratsiyasi)
4. [Start hodisasi](#start-hodisasi)
5. [Xatoliklar](#xatoliklar)
6. [Ishlash oqimi](#ishlash-oqimi)
7. [Kod misollari](#kod-misollari)

---

## Umumiy ma'lumot

Bot servisi backend bilan shu API orqali ishlaydi. Admin panelda saqlangan **Telegram bot token** ham autentifikatsiya, ham Telegram ulanishi uchun ishlatiladi.

| Parametr | Qiymat |
|----------|--------|
| Content-Type | `application/json` |
| Accept | `application/json` |

### Endpointlar

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `GET` | `/bot-runtime/config` | Sozlamalarni olish |
| `POST` | `/bot-runtime/start` | Foydalanuvchi `/start` hodisasi |
| `POST` | `/bot-runtime/webapp/open` | WebApp ochilganini qayd qilish |
| `POST` | `/bot-runtime/me` | Foydalanuvchining o'z ma'lumotini olish |
| `GET` | `/bot-runtime/practices` | Foydalanuvchi amaliyotlari ro'yxati |
| `POST` | `/bot-runtime/practices` | Yangi amaliyot qo'shish |
| `PUT` | `/bot-runtime/practices/{id}` | Amaliyotni tahrirlash |
| `DELETE` | `/bot-runtime/practices/{id}` | Amaliyotni o'chirish |
| `POST` | `/bot-runtime/practices/{id}/toggle` | Bugungi bajarilgan/bajarilmagan holat |
| `GET` | `/bot-runtime/practices/history` | Amaliyot arxivi (`from`, `to`) |
| `GET` | `/bot-runtime/indicators` | Foydalanuvchi indikatorlari ro'yxati |
| `POST` | `/bot-runtime/indicators` | Yangi indikator qo'shish |
| `PUT` | `/bot-runtime/indicators/{id}` | Indikatorni tahrirlash |
| `DELETE` | `/bot-runtime/indicators/{id}` | Indikatorni o'chirish |
| `POST` | `/bot-runtime/indicators/{id}/log` | Bugungi qiymatni saqlash |
| `GET` | `/bot-runtime/indicators/history` | Indikator arxivi (`from`, `to`) |
| `GET` | `/bot-runtime/archive` | Arxiv paneli (`kind`, `from`, `to`) — bajarilgan va o'tkazib yuborilganlar |
| `GET` | `/bot-runtime/habits/summary` | Bugungi va haftalik ko'rinish (`kind`) |
| `GET` | `/bot-runtime/dominants` | Foydalanuvchi dominantalari ro'yxati |
| `POST` | `/bot-runtime/dominants` | Yangi dominanta yaratish (birinchi sessiya bilan) |
| `PUT` | `/bot-runtime/dominants/{id}` | Dominantani tahrirlash (nom, signal, mukofot) |
| `DELETE` | `/bot-runtime/dominants/{id}` | Dominantani o'chirish |
| `POST` | `/bot-runtime/dominants/{id}/session` | Sessiyani yakunlash (10 daqiqalik mashq) |
| `GET` | `/bot-runtime/leaderboard` | XP bo'yicha klub reytingi (`limit`, default 20) |
| `GET` | `/bot-runtime/guides/videos` | Qo'llanma videolari ro'yxati |
| `GET` | `/bot-runtime/guides/videos/{id}` | Bitta video |
| `POST` | `/bot-runtime/guides/videos/{id}/like` | Like toggle |
| `GET` | `/bot-runtime/guides/videos/{id}/comments` | Video izohlari |
| `POST` | `/bot-runtime/guides/videos/{id}/comments` | Izoh qoldirish |
| `GET` | `/bot-runtime/guides/courses` | Qo'llanma kurslari ro'yxati |
| `GET` | `/bot-runtime/guides/courses/{id}` | Bitta kurs (to'liq daraxt) |
| `GET` | `/bot-runtime/guides/lessons/{lessonId}` | Bitta dars + breadcrumb |
| `GET` | `/bot-runtime/guides/files` | Qo'llanma fayllari ro'yxati |
| `GET` | `/bot-runtime/notifications` | Bildirishnomalar ro'yxati |
| `POST` | `/bot-runtime/notifications/{id}/read` | Bildirishnomani o'qilgan deb belgilash |
| `POST` | `/bot-runtime/notifications/read-all` | Hammasini o'qilgan deb belgilash |
| `GET` | `/bot-runtime/ws/notifications` | WebSocket (real-time) |

---

## Autentifikatsiya

Alohida `BOT_API_KEY` yo'q. Admin panelda (`PUT /bot/token`) saqlangan **bot token** ishlatiladi.

**1-usul (tavsiya):**
```
Authorization: Bearer <telegram_bot_token>
```

**2-usul:**
```
X-Bot-Token: <telegram_bot_token>
```

Token bazadagi `bot_settings.bot_token` bilan solishtiriladi. Bot `is_active` bo'lishi kerak.

### O'rnatish tartibi

1. Admin panelda bot token qo'shiladi (`PUT /api/v1/bot/token`)
2. Admin `/start` xabari va pastki tugmani sozlaydi
3. Bot servisi shu token bilan backend API ga murojaat qiladi

---

## Bot konfiguratsiyasi

Bot ishga tushganda yoki sozlamalar yangilanganda chaqiriladi.

```
GET /bot-runtime/config
```

**Header:**
```
Authorization: Bearer 1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
```

**Javob `200`:**
```json
{
  "is_active": true,
  "bot_token": "1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw",
  "bot_username": "my_odatlar_bot",
  "start": {
    "message": "Assalomu alaykum! Botga xush kelibsiz.",
    "button": {
      "enabled": true,
      "text": "🛒 Do'konni ochish",
      "web_app_url": "https://app.example.com"
    }
  },
  "updated_at": "2026-07-07T06:00:00Z"
}
```

### Javob maydonlari

| Maydon | Tavsif |
|--------|--------|
| `is_active` | Bot faolmi |
| `bot_token` | Telegram bot tokeni |
| `bot_username` | @username |
| `start.message` | `/start` da yuboriladigan xabar |
| `start.button.enabled` | Pastki tugma yoqilganmi |
| `start.button.text` | Tugma matni |
| `start.button.web_app_url` | Mini App URL (tugma bosilganda) |

### Telegram da qo'llash

**Xabar yuborish:**
```
sendMessage(chat_id, start.message)
```

**Pastki tugma (Reply Keyboard + Web App):**
```json
{
  "keyboard": [[{
    "text": "🛒 Do'konni ochish",
    "web_app": { "url": "https://app.example.com" }
  }]],
  "resize_keyboard": true
}
```

> `start.button.enabled = false` bo'lsa, faqat xabar yuboring.

---

## Start hodisasi

Foydalanuvchi `/start` bosganda bot servisi chaqiradi. Ma'lumot `bot_users` jadvaliga yoziladi (admin panelda ko'rinadi).

```
POST /bot-runtime/start
```

**Header:**
```
Authorization: Bearer <telegram_bot_token>
Content-Type: application/json
```

**So'rov tanasi:**

| Maydon | Turi | Majburiy | Tavsif |
|--------|------|----------|--------|
| telegram_id | integer | Ha | Telegram user ID |
| first_name | string | Yo'q | Ism |
| last_name | string | Yo'q | Familiya |
| username | string | Yo'q | @username |
| phone | string | Yo'q | Telefon |
| language_code | string | Yo'q | Til kodi (`uz`, `ru`) |
| avatar_url | string | Yo'q | Profil rasmi URL |
| is_bot | boolean | Yo'q | Telegram akkaunti botmi |
| is_premium | boolean | Yo'q | Telegram Premium holati |

**Misol:**
```json
{
  "telegram_id": 123456789,
  "first_name": "Ali",
  "last_name": "Valiyev",
  "username": "alivali",
  "phone": "",
  "language_code": "uz",
  "avatar_url": "https://api.telegram.org/file/bot<token>/photos/file_10.jpg",
  "is_bot": false,
  "is_premium": true
}
```

**Javob `200`:**
```json
{
  "id": 1,
  "telegram_id": 123456789,
  "first_name": "Ali",
  "last_name": "Valiyev",
  "username": "alivali",
  "phone": "",
  "language_code": "uz",
  "avatar_url": "https://api.telegram.org/file/bot<token>/photos/file_10.jpg",
  "is_bot": false,
  "is_premium": true,
  "started_at": "2026-07-07T06:00:00Z",
  "last_start_at": "2026-07-07T06:00:00Z"
}
```

> Bir xil `telegram_id` qayta kelsa ma'lumot yangilanadi, `last_start_at` o'zgaradi.

---

## Xatoliklar

```json
{ "error": "xato xabari" }
```

| HTTP | Sabab |
|------|-------|
| `401` | Token yuborilmagan yoki noto'g'ri |
| `403` | Bot nofaol (`is_active = false`) |
| `400` | Noto'g'ri so'rov (validatsiya) |
| `500` | Server xatosi |

---

## WebApp hodisalari

### WebApp ochilganini saqlash

Bot ichidagi WebApp ochilganda foydalanuvchi ma'lumotini yangilash/saqlash uchun ishlatiladi.

```
POST /bot-runtime/webapp/open
```

**Header:**
```
X-Telegram-Init-Data: <Telegram.WebApp.initData>
```

**Javob `200`:** `BotUserResponse`

### WebApp foydalanuvchisi "me"

WebApp ichida foydalanuvchi o'z profilini olish uchun.

```
POST /bot-runtime/me
```

**Header:**
```
X-Telegram-Init-Data: <Telegram.WebApp.initData>
```

**Javob `200`:**
```json
{
  "id": 1,
  "telegram_id": 123456789,
  "first_name": "Ali",
  "last_name": "Valiyev",
  "username": "alivali",
  "phone": "+998901112233",
  "language_code": "uz",
  "avatar_url": "https://api.telegram.org/file/bot<token>/photos/file_10.jpg",
  "is_bot": false,
  "is_premium": true,
  "xp": 150,
  "level": 1,
  "level_up_xp": 1000,
  "started_at": "2026-07-07T06:00:00Z",
  "last_start_at": "2026-07-07T06:30:00Z"
}
```

> `xp` — jami XP, `level` — daraja, `level_up_xp` — keyingi darajaga kerak bo'lgan XP chegarasi (admin sozlamalaridan).

> User topilmasa `404` qaytadi.

### XP reytingi

```
GET /bot-runtime/leaderboard?limit=20
```

**Header:**
```
X-Telegram-Init-Data: <Telegram.WebApp.initData>
```

**Javob `200`:**
```json
{
  "data": [
    { "rank": 1, "name": "Ali Valiyev", "xp": 1250, "level": 2, "is_me": false },
    { "rank": 2, "name": "Siz", "xp": 800, "level": 1, "is_me": true }
  ],
  "current_user_rank": 2
}
```

Amaliyot/indikator/dominanta harakatlari (`toggle`, `log`, `session`, `create`) javobida qo'shimcha maydonlar qaytadi:

```json
{
  "xp_reward": 50,
  "xp": 200,
  "level": 1
}
```

`xp_reward` — shu harakat uchun berilgan yoki olib tashlangan XP, `xp` va `level` — yangilangan holat.

### Qo'llanma videolari

Batafsil hujjat: [GUIDES_API.md](GUIDES_API.md)

```
GET /bot-runtime/guides/videos
GET /bot-runtime/guides/videos/{id}
POST /bot-runtime/guides/videos/{id}/like
GET /bot-runtime/guides/videos/{id}/comments
POST /bot-runtime/guides/videos/{id}/comments
```

**Izoh qoldirish so'rovi:**
```json
{ "text": "Juda foydali!" }
```

### Amaliyotlar CRUD

Barcha amaliyot endpointlari `X-Telegram-Init-Data` header bilan ishlaydi.

**Ro'yxat:**
```
GET /bot-runtime/practices
```

**Yaratish:**
```
POST /bot-runtime/practices
```
```json
{ "name": "Erta turish", "benefits": ["Energiya", "Vaqt tejash"] }
```

**Tahrirlash:**
```
PUT /bot-runtime/practices/{id}
```

**O'chirish:**
```
DELETE /bot-runtime/practices/{id}
```

**Bugun bajarildi/bekor qilish:**
```
POST /bot-runtime/practices/{id}/toggle
```

**Arxiv:**
```
GET /bot-runtime/practices/history?from=2026-07-01&to=2026-07-07
```

### Indikatorlar CRUD

**Ro'yxat:**
```
GET /bot-runtime/indicators
```

**Yaratish:**
```
POST /bot-runtime/indicators
```
```json
{ "name": "Uyqu", "benefits": ["Sog'liq", "Energiya"] }
```

**Qiymat kiritish (bugun):**
```
POST /bot-runtime/indicators/{id}/log
```
```json
{ "value_id": "7:soat", "value_label": "7 soat", "is_empty": false }
```

**Arxiv:**
```
GET /bot-runtime/indicators/history?from=2026-07-01&to=2026-07-07
```

### Arxiv paneli (Web App)

Amaliyotlar yoki indikatorlar uchun kunlik arxiv — bajarilgan va o'tkazib yuborilgan yozuvlar bilan.

```
GET /bot-runtime/archive?kind=practice&from=2026-07-01&to=2026-07-07
GET /bot-runtime/archive?kind=indicator&from=2026-07-01&to=2026-07-07
```

**Query parametrlar:**

| Parametr | Tavsif |
|----------|--------|
| `kind` | `practice` yoki `indicator` |
| `from` | Boshlanish sanasi (`YYYY-MM-DD`) |
| `to` | Tugash sanasi (`YYYY-MM-DD`) |

**Javob:**
```json
{
  "days": [
    {
      "date": "2026-07-07",
      "items": [
        {
          "id": "12",
          "habitId": "3",
          "habitName": "Erta turish",
          "status": "completed",
          "completedAt": "2026-07-07T04:30:00Z",
          "date": "2026-07-07",
          "kind": "practice"
        },
        {
          "id": "missed_5_2026-07-07",
          "habitId": "5",
          "habitName": "Sport",
          "status": "missed",
          "date": "2026-07-07",
          "kind": "practice"
        }
      ]
    }
  ],
  "completedCount": 5,
  "missedCount": 3
}
```

### Dominantalar (Web App)

Zararli odatni signal (`cue`) va mukofot (`reward`) bilan aniqlab, 10 daqiqalik mashq (sessiya) qilinadi. Ikki xil sessiya turi bor:
- `fikrlash` — foyda (`pros`) va zararlarni (`cons`) yozish
- `ma'lumot` — o'rgangan ma'lumotlarni (`notes`) yozish

**Ro'yxat:**
```
GET /bot-runtime/dominants
```
```json
{
  "data": [
    {
      "id": "1",
      "title": "Ijtimoiy tarmoqlarni cheklash",
      "type": "fikrlash",
      "cue": "Zerikish paytida telefonga yopishish",
      "reward": "Tezkor dopamin",
      "pros": ["Vaqt tejaladi"],
      "cons": ["Ortda qolish hissi"],
      "notes": "",
      "sessionsCompleted": 2,
      "createdAt": "2026-07-01"
    }
  ]
}
```

**Yaratish** (birinchi sessiya bilan, `sessionsCompleted` = 1 bo'ladi):
```
POST /bot-runtime/dominants
```
```json
{
  "title": "Ijtimoiy tarmoqlarni cheklash",
  "type": "fikrlash",
  "cue": "Zerikish paytida telefonga yopishish",
  "reward": "Tezkor dopamin",
  "pros": ["Vaqt tejaladi"],
  "cons": ["Ortda qolish hissi"],
  "notes": ""
}
```

**Tahrirlash** (faqat nom, signal, mukofot):
```
PUT /bot-runtime/dominants/{id}
```
```json
{ "title": "Yangi nom", "cue": "Yangi signal", "reward": "Yangi mukofot" }
```

**Sessiyani yakunlash** (`sessionsCompleted` +1; `fikrlash` bo'lsa `pros`/`cons` qo'shiladi, `ma'lumot` bo'lsa `notes` yangilanadi):
```
POST /bot-runtime/dominants/{id}/session
```
```json
{ "type": "fikrlash", "pros": ["Yangi foyda"], "cons": ["Yangi zarar"], "notes": "" }
```

**O'chirish:**
```
DELETE /bot-runtime/dominants/{id}
```

---

## Ishlash oqimi

```
┌─────────────┐     PUT /bot/token      ┌─────────────┐
│ Admin panel │ ──────────────────────► │   Backend   │
│             │     PUT /bot/settings   │  (PostgreSQL)│
└─────────────┘                         └──────┬──────┘
                                               │
                    GET /bot-runtime/config    │
                    POST /bot-runtime/start    │
                                               ▼
                                        ┌─────────────┐
                                        │ Bot servisi │
                                        │ (Telegram)  │
                                        └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Foydalanuvchi │
                                        │  /start bosadi │
                                        └─────────────┘
```

**Ketma-ketlik:**

1. Bot ishga tushadi
2. `GET /bot-runtime/config` — sozlamalarni oladi
3. Telegram API bilan ulanadi (`bot_token`)
4. Foydalanuvchi `/start` bosadi
5. `POST /bot-runtime/start` — foydalanuvchini saqlaydi
6. `start.message` va pastki tugma yuboriladi

---

## Kod misollari

### cURL

**Konfiguratsiya:**
```bash
curl http://localhost:8080/api/v1/bot-runtime/config \
  -H "Authorization: Bearer YOUR_TELEGRAM_BOT_TOKEN"
```

**Start hodisasi:**
```bash
curl -X POST http://localhost:8080/api/v1/bot-runtime/start \
  -H "Authorization: Bearer YOUR_TELEGRAM_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "telegram_id": 123456789,
    "first_name": "Ali",
    "username": "alivali",
    "language_code": "uz"
  }'
```

### Go

```go
token := os.Getenv("TELEGRAM_BOT_TOKEN") // admin paneldagi token bilan bir xil

req, _ := http.NewRequest("GET", backendURL+"/api/v1/bot-runtime/config", nil)
req.Header.Set("Authorization", "Bearer "+token)

resp, err := http.DefaultClient.Do(req)
```

### Python

```python
import requests

token = "YOUR_TELEGRAM_BOT_TOKEN"
headers = {"Authorization": f"Bearer {token}"}

config = requests.get(
    "http://localhost:8080/api/v1/bot-runtime/config",
    headers=headers,
).json()

requests.post(
    "http://localhost:8080/api/v1/bot-runtime/start",
    headers=headers,
    json={
        "telegram_id": message.from_user.id,
        "first_name": message.from_user.first_name,
        "username": message.from_user.username or "",
        "language_code": message.from_user.language_code or "",
    },
)
```

---

## Eslatmalar

- Bot token admin panelda saqlanadi (`PUT /api/v1/bot/token`) va bot shu token bilan ishlaydi
- Sozlamalar o'zgarganda bot `GET /config` ni qayta chaqirib yangilashi mumkin
- Admin foydalanuvchilar ro'yxatini `GET /api/v1/bot/users` (JWT) orqali ko'radi
- Admin bitta user tafsilotini `GET /api/v1/bot/users/{id}` orqali oladi (modal uchun qulay)
