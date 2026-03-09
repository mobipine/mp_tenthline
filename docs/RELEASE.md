# LegalLine — Release & Deployment Guide

This document covers what you need to run and release the LegalLine MVP: environment variables, credentials, and deployment steps for both the Laravel API (`legalline-api`) and the Nuxt frontend (`legalline`).

---

## 1. Prerequisites

- **PHP** 8.2+ (Laravel 12)
- **Composer**
- **Node.js** 20+ and **npm**
- **Redis** (for queues and Horizon)
- **Database**: SQLite (dev) or MySQL/PostgreSQL (production)
- **M-Pesa**: Safaricom Daraja API account (sandbox or production)

### 1.1 Redis & PHP Redis extension (macOS, for Horizon)

Horizon requires both the **Redis server** and the **PHP Redis extension**. On macOS with Homebrew:

1. **Install Redis server** (if not already installed):

   ```bash
   brew install redis
   brew services start redis   # start and optionally enable at login
   ```

2. **Install the PHP Redis extension** for your PHP version (e.g. 8.3):

   ```bash
   brew tap shivammathur/extensions
   brew install shivammathur/extensions/redis@8.3
   ```

   Replace `8.3` with your PHP minor version (`8.2`, `8.4`, etc.) if different.

3. **Verify**:

   ```bash
   redis-cli ping   # should print PONG
   php -m | grep redis   # should print redis
   ```

---

## 2. Backend (legalline-api) — Environment & Credentials

### 2.1 Copy environment file

```bash
cd legalline-api
cp .env.example .env
php artisan key:generate
```

### 2.2 Required `.env` variables

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_NAME` | Application name | `LegalLine API` |
| `APP_ENV` | `local` / `production` | `production` |
| `APP_DEBUG` | `true` / `false` | `false` |
| `APP_URL` | Full URL of the API (no trailing slash) | `https://api.legalline.example.com` |
| `DB_CONNECTION` | `sqlite` or `mysql` / `pgsql` | `mysql` |
| `DB_DATABASE` | Database name | `legalline` |
| `DB_USERNAME` | DB user | — |
| `DB_PASSWORD` | DB password | — |
| `QUEUE_CONNECTION` | Must be `redis` for Horizon | `redis` |
| `REDIS_CLIENT` | `predis` (no PHP extension) or `phpredis` (faster, needs extension) | `predis` |
| `REDIS_HOST` | Redis host | `127.0.0.1` |
| `REDIS_PASSWORD` | Redis password (if any) | `null` |
| `REDIS_PORT` | Redis port | `6379` |

### 2.3 M-Pesa (Safaricom Daraja) credentials

Get these from [Safaricom Daraja](https://developer.safaricom.co.ke/).

| Variable | Description | Example |
|----------|-------------|---------|
| `MPESA_CONSUMER_KEY` | OAuth consumer key | — |
| `MPESA_CONSUMER_SECRET` | OAuth consumer secret | — |
| `MPESA_SHORTCODE` | Till / Paybill number | — |
| `MPESA_PASSKEY` | Lipa Na M-Pesa passkey | — |
| `MPESA_CALLBACK_BASE_URL` | Base URL for callbacks (must be HTTPS in production) | `https://api.legalline.example.com` |
| `MPESA_ENVIRONMENT` | `sandbox` or `production` | `sandbox` |

**Notes:**

- Callback URL used by the app: `{MPESA_CALLBACK_BASE_URL}/api/webhooks/mpesa`
- For local testing, use **ngrok** and set `MPESA_CALLBACK_BASE_URL` to the ngrok URL.
- If M-Pesa is not configured, STK Push is skipped and payments stay pending (you can still test with payment disabled in admin).

### 2.4 Optional: file storage (S3 for production)

For production, configure S3 (or MinIO) so files are not only on local disk:

| Variable | Description |
|----------|-------------|
| `FILESYSTEM_DISK` | Set to `s3` to use S3 for `pdf-jobs` |
| `AWS_ACCESS_KEY_ID` | S3 access key |
| `AWS_SECRET_ACCESS_KEY` | S3 secret |
| `AWS_DEFAULT_REGION` | e.g. `eu-west-1` |
| `AWS_BUCKET` | Bucket name |

Then in code, use the same disk for storing `pdf-jobs/{id}/input.pdf` and `output.pdf` (update `config/filesystems.php` and the job/storage logic to use `Storage::disk(config('filesystems.default'))` or a dedicated `pdf` disk).

---

## 3. Backend — First-time setup

```bash
cd legalline-api
composer install --no-dev --optimize-autoloader   # production
# or
composer install   # development

php artisan migrate --force
php artisan settings:discover   # if using Spatie settings cache
```

### 3.1 Create an admin user (Filament)

Filament uses the default `User` model. Create a user and log in at `/admin`:

```bash
php artisan make:filament-user
# Enter name, email, password when prompted.
```

Or create a user via tinker:

```bash
php artisan tinker
>>> \App\Models\User::factory()->create(['email' => 'admin@example.com', 'password' => bcrypt('your-secure-password')]);
```

Then go to `https://your-api-domain/admin` and log in.

### 3.2 Configure app settings in admin

1. Log in to Filament at `/admin`.
2. Open **LegalLine → App Settings**.
3. Set:
   - **Require payment before upload**: On to use M-Pesa; Off for free/testing.
   - **Price per document**, **Currency**, **Max file size (MB)**, **Max pages**.

---

## 4. Backend — Running the app

### 4.1 Queue workers (required for PDF processing)

Use **Horizon** (recommended):

```bash
php artisan horizon
```

Keep this running (e.g. via Supervisor in production). Horizon uses Redis.

Without Horizon, run the queue worker:

```bash
php artisan queue:work redis --tries=2
```

### 4.2 Horizon dashboard

With the API running (e.g. `php artisan serve`), open the Horizon dashboard in your browser:

- **URL:** `{APP_URL}/horizon` (e.g. `http://localhost:8000/horizon`)

You can view supervisors, pending/completed/failed jobs, and metrics. In **local** (`APP_ENV=local`) the dashboard is accessible without logging in. In production, only users who pass the `viewHorizon` gate in `App\Providers\HorizonServiceProvider` can access it—add allowed emails there or adjust the gate.

### 4.3 Optional: cleanup old files

Add a cron entry to delete old job files (e.g. older than 24 hours):

```bash
0 * * * * cd /path/to/legalline-api && php artisan schedule:run
```

Implement a scheduled command that deletes `storage/app/pdf-jobs/{id}/*` for jobs older than 24h (and optionally mark them in DB). Register it in `app/Console/Kernel.php` or use the scheduler.

### 4.4 CORS (for Nuxt frontend)

Allow the frontend origin in Laravel. In `config/cors.php` (or `bootstrap/app.php` middleware), allow your Nuxt origin, e.g.:

- Development: `http://localhost:3000`
- Production: `https://legalline.example.com`

If `config/cors.php` exists, set `allowed_origins` accordingly. Laravel 11+ may use `HandleCors`; ensure your frontend URL is allowed.

---

## 5. Frontend (legalline) — Environment

### 5.1 Environment variables

Create `.env` in the Nuxt project root (same folder as `package.json`):

| Variable | Description | Example |
|----------|-------------|---------|
| `NUXT_PUBLIC_API_BASE` | Full URL of the Laravel API (no trailing slash) | `https://api.legalline.example.com` |

**Development:**

```env
NUXT_PUBLIC_API_BASE=http://localhost:8000
```

**Production:**

```env
NUXT_PUBLIC_API_BASE=https://api.legalline.example.com
```

### 5.2 Build and run

```bash
npm ci
npm run build
npm run preview   # preview production build
# or
npm run dev      # development
```

---

## 6. Deployment checklist

### Backend (legalline-api)

- [ ] `.env` configured (APP_URL, DB_*, REDIS_*, QUEUE_CONNECTION=redis)
- [ ] M-Pesa env vars set (if using payment); callback URL reachable (HTTPS in prod)
- [ ] `php artisan migrate --force` run
- [ ] Admin user created; app settings configured in Filament
- [ ] Horizon (or `queue:work`) running via Supervisor or systemd
- [ ] Optional: S3 configured and used for `pdf-jobs`; cleanup cron for old files
- [ ] CORS allows the Nuxt frontend origin

### Frontend (legalline)

- [ ] `NUXT_PUBLIC_API_BASE` points to the deployed API URL
- [ ] `npm run build` succeeds; serve the output (e.g. `output/public` or your host’s static build)

### Security

- [ ] `APP_DEBUG=false` and `APP_ENV=production` in production
- [ ] Strong `APP_KEY`; do not commit `.env`
- [ ] Admin URL (`/admin`) protected; strong admin password
- [ ] HTTPS for API and frontend in production

---

## 7. Quick local test (no M-Pesa)

1. **API:** In Filament → App Settings, turn **off** “Require payment before upload”. Set price and limits as needed.
2. **API:** Start Laravel: `php artisan serve` (e.g. http://localhost:8000).
3. **API:** Start Horizon: `php artisan horizon` (or `queue:work redis`).
4. **Frontend:** Set `NUXT_PUBLIC_API_BASE=http://localhost:8000`, run `npm run dev`.
5. Open the Nuxt app (e.g. http://localhost:3000), upload a PDF, and confirm processing and download on the one page.

---

## 8. M-Pesa sandbox testing

1. Register at [Safaricom Daraja](https://developer.safaricom.co.ke/) and get sandbox credentials.
2. Put them in `.env` with `MPESA_ENVIRONMENT=sandbox`.
3. Use **ngrok** so Safaricom can reach your callback: `ngrok http 8000`, then set `MPESA_CALLBACK_BASE_URL=https://your-ngrok-url.ngrok.io`.
4. In the app, enable payment in App Settings and run through the flow; complete the STK Push on your phone (sandbox test number if required).

---

## 9. Summary of credentials you need

| Purpose | Where to get / set |
|--------|---------------------|
| Laravel app key | `php artisan key:generate` |
| Database | Your DB host, name, user, password |
| Redis | Host, port, password (if any) |
| M-Pesa | [Daraja](https://developer.safaricom.co.ke/) — Consumer Key/Secret, Shortcode, Passkey |
| Admin login | Create via `php artisan make:filament-user` or tinker |
| S3 (optional) | AWS or MinIO access key, secret, bucket, region |

For a **production release**, set all env vars, run migrations, create admin user, configure App Settings in Filament, run Horizon (or queue worker), build and deploy the Nuxt app with `NUXT_PUBLIC_API_BASE` pointing to your API, and ensure CORS and M-Pesa callback URL are correct.
