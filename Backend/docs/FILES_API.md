# Odatlar Bot — Qo'llanmalar (Fayllar) API

**Versiya:** 1.0  
**Base URL:** `http://localhost:8080/api/v1`  
**Format:** JSON  
**Auditoriya:** Admin panel (CRUD) va Telegram Mini App (yuklab olish)  
**Bog'liq hujjatlar:** [Videolar API](GUIDES_API.md) · [Kurslar API](COURSES_API.md) · [Admin API](API.md)

---

## Mundarija

1. [Umumiy ma'lumot](#umumiy-malumot)
2. [Autentifikatsiya](#autentifikatsiya)
3. [Admin — Fayllar CRUD](#admin--fayllar-crud)
4. [Fayl yuklash](#fayl-yuklash)
5. [Foydalanuvchi — Fayllar](#foydalanuvchi--fayllar)
6. [Xatoliklar](#xatoliklar)
7. [cURL misollari](#curl-misollari)

---

## Umumiy ma'lumot

Qo'llanmalar bo'limidagi **Fayllar** — yuklab olinadigan materiallar ro'yxati (PDF, TXT, DOC va boshqalar).

| Tomon | Autentifikatsiya | Vazifa |
|-------|------------------|--------|
| Admin | JWT Bearer | Fayllarni yuklash, metadata CRUD, nashr holati |
| Foydalanuvchi (Mini App) | `X-Telegram-Init-Data` | Nashr qilingan fayllarni ko'rish va yuklab olish |

**Ma'lumotlar bazasi:** `guide_files`

Tashqi identifikator — **`slug`** (`odatlar-qollanma`). API javoblarida `id` = `slug`.

---

## Autentifikatsiya

**Admin:**
```
Authorization: Bearer <admin_jwt_token>
```

**Foydalanuvchi:**
```
X-Telegram-Init-Data: <Telegram.WebApp.initData>
```

---

## Admin — Fayllar CRUD

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `GET` | `/bot/guides/files` | Barcha fayllar |
| `POST` | `/bot/guides/files` | Yangi fayl metadata |
| `GET` | `/bot/guides/files/{id}` | Bitta fayl |
| `PUT` | `/bot/guides/files/{id}` | Faylni yangilash |
| `DELETE` | `/bot/guides/files/{id}` | Faylni o'chirish |

`{id}` — `slug` yoki raqamli ID.

### Fayl yaratish

```
POST /bot/guides/files
```

| Maydon | Turi | Majburiy | Tavsif |
|--------|------|----------|--------|
| `slug` | `string` | ha | URL identifikator (`a-z`, `0-9`, `-`) |
| `title` | `string` | ha | Sarlavha |
| `description` | `string` | yo'q | Tavsif |
| `url` | `string` | ha | Yuklangan `path` yoki `https://...` URL |
| `ext` | `string` | ha | Kengaytma (`txt`, `pdf`, ...) |
| `size_bytes` | `int` | yo'q | Fayl hajmi (yuklashdan olinadi) |
| `sort_order` | `int` | yo'q | Tartib |
| `is_published` | `bool` | yo'q | Default: `true` |

**Misol:**
```json
{
  "slug": "odatlar-qollanma",
  "title": "Odatlar boshlang'ich qo'llanma",
  "description": "Amaliyot va indikatorlarni sozlash bo'yicha yo'riqnoma",
  "url": "/api/v1/uploads/guides/files/uuid.txt",
  "ext": "txt",
  "size_bytes": 2048,
  "sort_order": 1,
  "is_published": true
}
```

**Javob `201`:**
```json
{
  "id": "odatlar-qollanma",
  "title": "Odatlar boshlang'ich qo'llanma",
  "description": "Amaliyot va indikatorlarni sozlash bo'yicha yo'riqnoma",
  "url": "/api/v1/uploads/guides/files/uuid.txt",
  "ext": "txt",
  "sizeLabel": "2 KB",
  "sizeBytes": 2048,
  "sortOrder": 1,
  "isPublished": true,
  "createdAt": "2026-07-12T10:00:00Z",
  "updatedAt": "2026-07-12T10:00:00Z"
}
```

### Fayl yangilash

```
PUT /bot/guides/files/{id}
```

Yaratish bilan bir xil maydonlar, `is_published` majburiy.

### Fayl o'chirish

```
DELETE /bot/guides/files/{id}
```

**Javob:** `204 No Content`

> Yuklangan fayl (`/api/v1/uploads/guides/files/...`) diskdan ham o'chiriladi.

---

## Fayl yuklash

```
POST /bot/guides/upload/file
```

`multipart/form-data`, maydon: `file`

**Ruxsat etilgan formatlar:** `txt`, `pdf`, `doc`, `docx`, `zip`, `xls`, `xlsx`, `ppt`, `pptx`, `csv`, `md`

**Limit:** `MAX_GUIDE_FILE_UPLOAD_MB` (default 20 MB)

**Javob `201`:**
```json
{
  "path": "/api/v1/uploads/guides/files/uuid.pdf",
  "url": "http://localhost:8080/api/v1/uploads/guides/files/uuid.pdf",
  "ext": "pdf",
  "sizeLabel": "1.2 MB",
  "sizeBytes": 1258291
}
```

Keyin `POST /bot/guides/files` da `url` = `path`, `ext` va `size_bytes` yuklash javobidan olinadi.

### `url` qoidalari

| Qabul qilinadi | Rad etiladi |
|----------------|-------------|
| `https://...` tashqi URL | Boshqa yo'llar |
| `/api/v1/uploads/guides/files/...` | |

---

## Foydalanuvchi — Fayllar

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `GET` | `/bot-runtime/guides/files` | Nashr qilingan fayllar ro'yxati |

```
GET /bot-runtime/guides/files
```

**Javob `200`:**
```json
{
  "data": [
    {
      "id": "odatlar-qollanma",
      "title": "Odatlar boshlang'ich qo'llanma",
      "description": "Amaliyot va indikatorlarni sozlash bo'yicha yo'riqnoma",
      "url": "/api/v1/uploads/guides/files/uuid.txt",
      "ext": "txt",
      "sizeLabel": "2 KB"
    }
  ]
}
```

Mini App `url` ni to'liq manzilga aylantirib, yuklab olish havolasini ko'rsatadi.

---

## Xatoliklar

| Kod | Ma'no |
|-----|-------|
| `400` | Noto'g'ri slug, url, fayl turi yoki hajmi |
| `401` | Autentifikatsiya talab qilinadi |
| `404` | Fayl topilmadi |
| `500` | Server xatosi |

---

## cURL misollari

**Fayl yuklash:**
```bash
curl -X POST http://localhost:8080/api/v1/bot/guides/upload/file \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "file=@./qollanma.pdf"
```

**Metadata yaratish:**
```bash
curl -X POST http://localhost:8080/api/v1/bot/guides/files \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "odatlar-qollanma",
    "title": "Odatlar boshlang'\''ich qo'\''llanma",
    "description": "Qisqa yo'\''riqnoma",
    "url": "/api/v1/uploads/guides/files/UUID.pdf",
    "ext": "pdf",
    "size_bytes": 1258291,
    "sort_order": 1
  }'
```

**Foydalanuvchi ro'\''yxati:**
```bash
curl -X GET http://localhost:8080/api/v1/bot-runtime/guides/files \
  -H "X-Telegram-Init-Data: $INIT_DATA"
```
