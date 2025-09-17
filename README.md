# Kindle Highlights API (MERN) — README

API-first service for parsing your Kindle  **My Clippings.txt** , storing highlights in MongoDB, and exposing:

* a **public** daily endpoint (stable set per day, 5–10 items)
* **admin** endpoints for import, status/reset, search, and books listing

Built with  **Node.js + Express + Mongoose** ,  **MongoDB Atlas** ,  **JWT (access + refresh)** ,  **Swagger** ,  **rate limiting** , and **scheduler** (Asia/Dhaka).

---

## Table of Contents

* [Quick Start](https://chatgpt.com/g/g-p-68c982dcd1148191bd6fe9bf1b0beddf-kindle/c/68c9892f-b7a4-8331-928f-f70ff3495230#quick-start)
* [Environment](https://chatgpt.com/g/g-p-68c982dcd1148191bd6fe9bf1b0beddf-kindle/c/68c9892f-b7a4-8331-928f-f70ff3495230#environment)
* [Run](https://chatgpt.com/g/g-p-68c982dcd1148191bd6fe9bf1b0beddf-kindle/c/68c9892f-b7a4-8331-928f-f70ff3495230#run)
* [Authentication](https://chatgpt.com/g/g-p-68c982dcd1148191bd6fe9bf1b0beddf-kindle/c/68c9892f-b7a4-8331-928f-f70ff3495230#authentication)
* [Public API](https://chatgpt.com/g/g-p-68c982dcd1148191bd6fe9bf1b0beddf-kindle/c/68c9892f-b7a4-8331-928f-f70ff3495230#public-api)
* [Admin APIs](https://chatgpt.com/g/g-p-68c982dcd1148191bd6fe9bf1b0beddf-kindle/c/68c9892f-b7a4-8331-928f-f70ff3495230#admin-apis)
* [Search &amp; Books APIs](https://chatgpt.com/g/g-p-68c982dcd1148191bd6fe9bf1b0beddf-kindle/c/68c9892f-b7a4-8331-928f-f70ff3495230#search--books-apis)
* [Daily Selection Logic](https://chatgpt.com/g/g-p-68c982dcd1148191bd6fe9bf1b0beddf-kindle/c/68c9892f-b7a4-8331-928f-f70ff3495230#daily-selection-logic)
* [Indexes](https://chatgpt.com/g/g-p-68c982dcd1148191bd6fe9bf1b0beddf-kindle/c/68c9892f-b7a4-8331-928f-f70ff3495230#indexes)
* [HTTP Responses &amp; Errors](https://chatgpt.com/g/g-p-68c982dcd1148191bd6fe9bf1b0beddf-kindle/c/68c9892f-b7a4-8331-928f-f70ff3495230#http-responses--errors)
* [Security &amp; Rate Limits](https://chatgpt.com/g/g-p-68c982dcd1148191bd6fe9bf1b0beddf-kindle/c/68c9892f-b7a4-8331-928f-f70ff3495230#security--rate-limits)
* [Operations (PM2 &amp; Backups)](https://chatgpt.com/g/g-p-68c982dcd1148191bd6fe9bf1b0beddf-kindle/c/68c9892f-b7a4-8331-928f-f70ff3495230#operations-pm2--backups)
* [Testing](https://chatgpt.com/g/g-p-68c982dcd1148191bd6fe9bf1b0beddf-kindle/c/68c9892f-b7a4-8331-928f-f70ff3495230#testing)
* [Folder Structure](https://chatgpt.com/g/g-p-68c982dcd1148191bd6fe9bf1b0beddf-kindle/c/68c9892f-b7a4-8331-928f-f70ff3495230#folder-structure)
* [License](https://chatgpt.com/g/g-p-68c982dcd1148191bd6fe9bf1b0beddf-kindle/c/68c9892f-b7a4-8331-928f-f70ff3495230#license)

---

## Quick Start

```bash
git clone <your-repo-url>
cd kindle-highlights-api
cp .env.example .env   # fill values as below
npm install
npm run dev            # dev
# open http://localhost:8080/docs (Swagger)
```

Bootstrap first admin (one-time):

```http
POST /api/v1/auth/bootstrap
Content-Type: application/json

{
  "token": "ADMIN_BOOTSTRAP_TOKEN",
  "email": "admin@example.com",
  "password": "StrongPass#123"
}
```

Login to get tokens:

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "StrongPass#123"
}
```

Use the returned `accessToken` in `Authorization: Bearer <token>` for admin endpoints.

---

## Environment

`.env.example` (copy to `.env` and fill):

```bash
# Core
PORT=8080
NODE_ENV=development
TZ=Asia/Dhaka

# Mongo (Atlas)
MONGO_URI="mongodb+srv://kindle_api:<ENCODED_PASSWORD>@cluster0.ukp2uc1.mongodb.net/kindle_highlights?retryWrites=true&w=majority&appName=kindle-highlights&authSource=admin"
# If your URI does not include /kindle_highlights, set this:
# MONGO_DB_NAME="kindle_highlights"

# JWT
JWT_ACCESS_SECRET="<64-hex>"
JWT_REFRESH_SECRET="<64-hex>"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL="30d"

# CORS
CORS_ORIGINS="*"

# Public API limits
PUBLIC_DAILY_DEFAULT_LIMIT=5
PUBLIC_DAILY_MAX_LIMIT=10
PUBLIC_RATE_LIMIT_WINDOW_MS=60000
PUBLIC_RATE_LIMIT_MAX=60

# Admin bootstrap (one-time)
ADMIN_BOOTSTRAP_TOKEN="<one-time-secret>"

# Daily selection window (deterministic set)
DAILY_WINDOW_MODE="daily"   # daily | halfday (00:00 & 12:00)
NO_REPEAT_DAYS=15           # avoid repeats within 15 days if possible
```

> **Password encoding** : If your Atlas password has special chars, URL-encode it (e.g., `@` → `%40`).

---

## Run

**Dev**

```bash
npm run dev
```

**Prod**

```bash
npm start
```

Service log:

```
[db] (native) Pinged your deployment. Connection OK!
[db] (mongoose) connected to DB: kindle_highlights
[cron] scheduler initialized (mode=daily, tz=Asia/Dhaka, currentKey=YYYY-MM-DD)
```

Swagger: `http://localhost:8080/docs`

Health: `GET /api/v1/health`

---

## Authentication

* **Access token (JWT)** : short-lived (`ACCESS_TOKEN_TTL`)
* **Refresh token (JWT)** : long-lived (`REFRESH_TOKEN_TTL`), persisted in `refreshtokens` collection, revocable
* Roles: currently `admin` (scalable later)

**Endpoints**

* `POST /api/v1/auth/bootstrap` — one-time create first admin (requires `ADMIN_BOOTSTRAP_TOKEN`)
* `POST /api/v1/auth/login` — returns `{ accessToken, refreshToken }`
* `POST /api/v1/auth/refresh` — `{ refreshToken }` → new `accessToken`
* `POST /api/v1/auth/logout` — revoke refresh token
* `GET /api/v1/auth/me` — current user (requires `Bearer`)

---

## Public API

### GET `/api/v1/public/highlights/daily?limit=N`

Returns a **deterministic set** of highlights for the current window (day or half-day) with a hard cap of  **10** . The same set is served all window long, regardless of refreshes.

**Query**

* `limit` — `1..10` (default from `PUBLIC_DAILY_DEFAULT_LIMIT`)

**Response**

```json
{
  "windowKey": "2025-09-17",
  "date": "2025-09-17",
  "timezone": "Asia/Dhaka",
  "count": 5,
  "highlights": [
    {
      "id": "665f3b...c1",
      "bookTitle": "Why We Sleep",
      "author": "Matthew Walker",
      "content": "the brain has found an ingenious way...",
      "location": "1091-1094",
      "page": null,
      "dateAdded": "2023-07-08T19:12:46.000Z"
    }
  ]
}
```

**Headers**

* `Cache-Control: public, max-age=<seconds until window end>`
* `X-Window-Key: <windowKey>`

**Notes**

* Rate limited (default: 60 req/min/IP).
* CORS is `*` by default; restrict in prod.

---

## Admin APIs

All **admin** endpoints require `Authorization: Bearer <accessToken>`.

### 1) Import Kindle clippings

`POST /api/v1/admin/import`

**Form-Data**

* `file` — Upload **My Clippings.txt** (content-type `text/plain`)
* `dryRun` — optional `true|false` (no DB writes if `true`)

**200 (dryRun)**

```json
{
  "dryRun": true,
  "parsedCount": 123,
  "sample": [ { "bookTitle": "...", "content": "...", "hashId": "..." } ],
  "errors": []
}
```

**200 (write)**

```json
{
  "parsedCount": 123,
  "insertedCount": 117,
  "duplicateCount": 6,
  "errorCount": 0,
  "errors": []
}
```

 **Dedup rule** : `hash(content + bookTitle + location)` → unique per highlight.

### 2) Daily set status

`GET /api/v1/admin/daily/status`

**200**

```json
{
  "key": "2025-09-17",
  "timezone": "Asia/Dhaka",
  "window": { "start": "2025-09-17T00:00:00+06:00", "end": "2025-09-18T00:00:00+06:00" },
  "hasDailySet": true,
  "dailySetSize": 10,
  "totalHighlights": 1342
}
```

### 3) Force regenerate current daily set

`POST /api/v1/admin/daily/reset`

**200**

```json
{ "message": "Daily set regenerated", "key": "2025-09-17", "size": 10 }
```

---

## Search & Books APIs

All **admin** endpoints (Bearer required).

### GET `/api/v1/highlights`

Full-text/search with filters, pagination, sorting.

**Query (all optional)**

* `q` — full-text in `content`, `bookTitle`, `author` ( *requires single text index; see [Indexes](https://chatgpt.com/g/g-p-68c982dcd1148191bd6fe9bf1b0beddf-kindle/c/68c9892f-b7a4-8331-928f-f70ff3495230#indexes)* )

  `qMode=regex` can force regex fallback if needed.
* `bookTitle`, `author` — substring (case-insensitive)
* `lang` — CSV of languages, e.g. `en,bn`
* `dateFrom`, `dateTo` — filter `dateAdded` (ISO or `yyyy-mm-dd`)
* `servedFrom`, `servedTo` — filter `lastServedAt`
* `hasLocation`, `hasPage` — `true|false`
* `sortBy` — `dateAdded | createdAt | lastServedAt` (default `dateAdded`)
* `sortOrder` — `asc | desc` (default `desc`)
* `page` — default `1`
* `limit` — default `20`, max `100`
* `select` — CSV projection, e.g. `bookTitle,author,content`

**200**

```json
{
  "page": 1,
  "limit": 10,
  "total": 42,
  "hasNext": true,
  "items": [
    {
      "id": "665f3b...c1",
      "bookTitle": "Atomic Habits",
      "author": "James Clear",
      "content": "Tiny changes make remarkable results.",
      "location": null,
      "page": "23",
      "dateAdded": "2023-07-08T19:12:46.000Z",
      "lang": "en",
      "lastServedAt": "2025-09-10T01:23:45.000Z",
      "createdAt": "2025-09-01T06:01:01.000Z"
    }
  ]
}
```

### GET `/api/v1/highlights/:id`

**200**

```json
{
  "id": "665f3b...c1",
  "bookTitle": "...",
  "author": "...",
  "content": "...",
  "location": "1091-1094",
  "page": null,
  "dateAdded": "2023-07-08T19:12:46.000Z",
  "lang": "en",
  "lastServedAt": null,
  "createdAt": "2025-09-01T06:01:01.000Z"
}
```

### GET `/api/v1/books`

Distinct books with counts & last added date.

**Query**

* `q` — substring in book or author
* `lang` — CSV
* `page`, `limit` — default `20`, max `100`
* `sortBy` — `count | lastAdded | bookTitle` (default `count`)
* `sortOrder` — `asc | desc` (default `desc`)

**200**

```json
{
  "page": 1,
  "limit": 20,
  "total": 12,
  "hasNext": false,
  "items": [
    {
      "bookTitle": "Why We Sleep",
      "author": "Matthew Walker",
      "count": 37,
      "lastAdded": "2023-07-09T19:12:46.000Z",
      "langs": ["en"]
    }
  ]
}
```

---

## Daily Selection Logic

* **Window** : `daily` (00:00–24:00 Asia/Dhaka) or `halfday` (00:00–12:00, 12:00–24:00).
* **Deterministic** : seeded shuffle by window key → stable order for the whole window.
* **No repeats** : excludes highlights served within the last **`NO_REPEAT_DAYS`** (default 15) if possible; falls back to remaining pool when needed.
* **Precompute** : cron at window start creates a `DailySet` document; public API reads it and slices to `?limit`.

Admin can **inspect** (`/admin/daily/status`) or **regenerate** (`/admin/daily/reset`) the set.

---

## Indexes

Run once in  **kindle_highlights** :

```js
db.highlights.createIndex({ hashId: 1 }, { unique: true })
db.highlights.createIndex({ lastServedAt: 1 })
db.highlights.createIndex(
  { content: "text", bookTitle: "text", author: "text" },
  { name: "text_content_title_author", default_language: "english" }
)
```

> **Important** : Mongo requires **exactly one** text index for `$text` queries.
>
> If you accidentally created multiple, drop extras:

```js
db.highlights.getIndexes().forEach(i => {
  if (i.key && i.key._fts === 'text' && i.name !== 'text_content_title_author') {
    db.highlights.dropIndex(i.name)
  }
})
```

---

## HTTP Responses & Errors

* **Success** : JSON as shown above.
* **Errors** : JSON

```json
{ "error": "Message here" }
```

* Common status codes:
  * `200 OK`, `201 Created`
  * `400 Bad Request` (validation)
  * `401 Unauthorized` (missing/invalid token)
  * `403 Forbidden` (role)
  * `404 Not Found`
  * `429 Too Many Requests` (rate limit)
  * `500 Internal Server Error`

---

## Security & Rate Limits

* Public endpoints protected via **`express-rate-limit`** (defaults in `.env`).
* **CORS** : `*` by default; set `CORS_ORIGINS` to your site’s domain(s) in production.
* JWT secrets must be strong (64-byte hex recommended).
* After bootstrapping admin, **rotate/remove** `ADMIN_BOOTSTRAP_TOKEN`.

---

## Operations (PM2 & Backups)

Run as a Windows service with  **PM2** :

```powershell
npm i -g pm2 pm2-windows-service pm2-logrotate
pm2-service-install -n "pm2-kindle"
pm2 start src/server.js --name kindle-api
pm2 save
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:max_size 10M
```

Daily **Atlas** backups (using `mongodump`) — see `scripts/backup-mongo.ps1` example; schedule via Task Scheduler (keep last 14).

---

## Testing

```bash
npm test
```

* Parser unit tests (EN/BN)
* Deterministic selection helper tests
* API smoke tests (health + public daily)

> During tests, the public daily endpoint **short-circuits** (no DB) to avoid open handles.

---

## Folder Structure

```
kindle-highlights-api/
├─ .env / .env.example
├─ package.json
├─ jest.config.js
├─ src/
│  ├─ server.js
│  ├─ app.js
│  ├─ config/         # env + swagger
│  ├─ db/             # connect.js (native ping + mongoose)
│  ├─ middlewares/    # auth, rateLimit, errors
│  ├─ models/         # User, RefreshToken, Highlight, DailySet
│  ├─ routes/         # auth, public, admin, highlights, health
│  ├─ controllers/    # auth, public, admin, highlights
│  ├─ services/       # parser.service, selection.service
│  └─ jobs/           # scheduler (cron)
├─ tests/             # parser, selection, api smoke
└─ scripts/           # backup-mongo.ps1, build-indexes.js (optional)
```

---

## License

MIT — feel free to use and modify.

© Al Amin Khan | alaminkhan2010@gmail.com

---

### API Docs

Open **Swagger UI** at: `http://localhost:8080/docs`

(Generated from route annotations; includes schemas and parameter details.)
