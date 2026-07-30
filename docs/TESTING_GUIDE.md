# TenthLine — Full Testing Guide

**Scope:** All changes merged to `main` via PR #5 (phase 1–7) plus the settings migration fix and diagnostic/navigation changes (July 29–30 2026).  
**Repos:** `mp_tenthline_api` (Laravel 12) · `mp_tenthline` (Nuxt 4 / Vue 3)

---

## Quick-start checklist

Run these in order on any fresh environment before any other test.

```bash
# 1. Pull latest
git pull origin main

# 2. Database migrations (tables + pdf_jobs columns)
php artisan migrate

# 3. Settings migrations (retention / ocr_quality / legal groups)
php artisan migrate --path=database/settings

# 4. Clear config/settings cache
php artisan settings:clear-cache
php artisan config:clear

# 5. Restart queue
php artisan horizon:terminate   # or: supervisorctl restart tenthline-horizon
```

> If you see a `MissingSettings` error in Filament after step 3, run `php artisan settings:clear-cache` and reload.

---

## What changed — phase by phase

### Phase 1 · Database foundation

**New migrations:**

| Migration | What it creates |
|---|---|
| `2026_07_29_000001_create_processing_reports_table` | Per-job quality summary: uploaded/successful/low_confidence/failed/payable pages, unit price, total amount, threshold snapshots at evaluation time |
| `2026_07_29_000002_create_page_processing_results_table` | Per-page row: status (success/low_confidence/failed), ocr_confidence, text_box_count, extracted_chars, page_coverage_pct, placement_mode, is_billable |
| `2026_07_29_000003_create_support_tickets_table` | email, subject, description, optional job_id FK, auto-generated TKT-XXXXXXXX reference, status enum, resolved_at |
| `2026_07_29_000004_create_support_attachments_table` | Soft-deleted; belongs to SupportTicket |
| `2026_07_29_000005_add_legalline_fields_to_pdf_jobs_table` | Adds `error_code`, `processing_report_id`, `payable_pages`, `payment_deadline_at` (indexed) to pdf_jobs |

**New settings migration:**

| Migration | What it seeds |
|---|---|
| `database/settings/2026_07_29_000006_create_phase7_settings.php` | `retention` group (4 keys), `ocr_quality` group (5 keys), `legal` group (4 keys) |

**New enums:**

| Enum | Cases |
|---|---|
| `JobErrorCode` | `ZeroSuccessfulPages`, `OcrUnavailable`, `OcrTimeout`, `PdfParseFailed`, `LineNumberingFailed`, `PaymentDeadlineExpired` — each has `userMessage(): string` |
| `PageStatus` | `success`, `low_confidence`, `failed` — has `isBillable(bool): bool` |
| `RetentionUnit` | `hours`, `days`, `weeks` — has `toHours(int): int` |
| `SupportTicketStatus` | `open`, `investigating`, `waiting_for_customer`, `resolved`, `closed` — has `isTerminal()`, `label()`, `color()` |

**New Settings classes:**

| Class | Group | Keys |
|---|---|---|
| `RetentionSettings` | `retention` | retention_value, retention_unit, support_attachment_retention_hours, payment_deadline_hours; helper `retentionInHours()` |
| `OcrQualitySettings` | `ocr_quality` | min_ocr_confidence, min_text_boxes, min_extracted_chars, min_page_coverage_pct, bill_low_confidence_pages |
| `LegalContentSettings` | `legal` | terms_and_conditions, privacy_policy, terms_updated_at, privacy_updated_at |

**New Models:** `ProcessingReport`, `PageProcessingResult`, `SupportTicket`, `SupportAttachment`  
**Modified Model:** `PdfJob` — added `error_code` (cast to JobErrorCode), `processing_report_id`, `payable_pages`, `payment_deadline_at`; added `processingReport()`, `isAwaitingPayment()`, `isPaymentDeadlineExpired()`.

---

### Phase 2–3 · Quality evaluation & processing reports

**New services:**

- `PageQualityResult` — readonly value object with `toArray()`
- `PageQualityEvaluator` — injected `OcrQualitySettings`. Classifies each page from `getLastRunDiagnostics()` output into `success/low_confidence/failed`. Handles skip modes and `fallback_grid` / `fallback_grid_low_confidence` placement modes.
- `ProcessingReportGenerator` — injected `AppSettings` + `OcrQualitySettings`. Runs inside a DB transaction: creates `ProcessingReport`, bulk-inserts `PageProcessingResult` rows, resolves unit price (user override → app default).

**Modified:** `ProcessPdfJob::handle()` — after `addLineNumbers()`:
1. Calls `PageQualityEvaluator::evaluateAll()`
2. Calls `ProcessingReportGenerator::generate()`
3. If zero payable pages → deletes output, fails job with `ZeroSuccessfulPages`
4. Else → sets status `awaiting_payment`, writes `output_path`, `payable_pages`, `payment_deadline_at`

**New purge commands:**

| Command | What it does |
|---|---|
| `pdf-jobs:purge-unpaid` | Finds `awaiting_payment` jobs past `payment_deadline_at`, deletes output directory, sets `status=failed`, `error_code=payment_deadline_expired`, `storage_deleted_at=now()` |
| `support:purge-attachments` | Reads retention hours from `RetentionSettings`, soft-deletes attachments for resolved/closed tickets past the window |
| `pdf-jobs:purge-expired` | **Modified** — now reads retention period from `RetentionSettings::retentionInHours()` instead of a hardcoded value |

All three scheduled **hourly** in `routes/console.php`.

---

### Phase 4 · API layer

**New `awaiting_payment` status** — sits between `processing` and `completed`. The output PDF is fully ready; payment is gated before download unlocks.

**Modified controllers:**

| Controller | What changed |
|---|---|
| `UploadController` | Payment gate removed. Dispatches `ProcessPdfJob` immediately after validation. No `payment_reference` field. |
| `PaymentController::quote()` | Now returns `is_estimate: true` |
| `PaymentController::initiate()` | Accepts `job_id` (not `page_count`); validates job is `awaiting_payment`; amount sourced from `ProcessingReport.total_amount` |
| `PaymentController::status()` | Transitions `awaiting_payment` → `completed` on simulated success |
| `MpesaWebhookController` | On `resultCode === 0`, looks up job via `payment->pdf_job_id`, transitions `awaiting_payment` → `completed` |

**New controllers:**

| Controller | Route |
|---|---|
| `JobController::report()` | `GET /api/job/{id}/report` — auth + ownership; returns report summary + per-page detail + `payment_deadline_at` |
| `SupportTicketController::store()` | `POST /api/support/tickets` — throttled 10/min; auto-generates `TKT-` reference |
| `LegalController::terms()` | `GET /api/legal/terms` — public |
| `LegalController::privacy()` | `GET /api/legal/privacy` — public |

**Modified:** `PdfJobPayloadFactory::fromModel()` — adds `error_code`, `payable_pages`, `payment_deadline_at`, `report_url` to the broadcast payload. `resolveProcessingState()` handles `awaiting_payment` stage.

---

### Phase 5 · Filament admin panel

**New settings pages:**

| Page | Path in admin | What it configures |
|---|---|---|
| `OcrQualitySettingsPage` | Settings → OCR Quality | Confidence/text-box/char/coverage thresholds + billing toggle |
| `RetentionSettingsPage` | Settings → Retention | File retention (value + unit), payment deadline hours, attachment retention hours |
| `LegalContentPage` | Settings → Legal Content | RichEditor for T&C and Privacy Policy; auto-sets `*_updated_at` on save |

**New resource:** `SupportTicketResource` — list with status badge filter, view/edit; `EditSupportTicket` auto-sets `resolved_at` when status transitions to a terminal state.

**Modified:** `PdfJobResource` — `awaiting_payment` added to status filter options.

---

### Phase 6 · Frontend

**`app/stores/flow.ts`**
- `awaiting_payment` added to `Stage` union type
- `ProcessingReport` interface added
- `processingReport: null` state + `setProcessingReport()` action
- `setJobId()` clears `processingReport`
- `setJob()` transitions to `awaiting_payment` stage
- `reset()` clears `processingReport` and `paymentPolling`

**`app/app.vue`**
- `fetchJobReport(jobId)` — `GET /api/job/{id}/report` → `flow.setProcessingReport()`
- `goToReportStep()` — sets `flowStep = 'report'`
- `goToPostPaymentStep()` — sets `flowStep = 'payment'`
- WebSocket handler: `awaiting_payment` → `fetchJobReport` + `goToReportStep()`
- Job polling: `awaiting_payment` + no report → `fetchJobReport` + `goToReportStep()`; stops poll
- `initiatePayment()` — sends `job_id` instead of `page_count`
- Report step UI — shows page breakdown (successful/low_confidence/failed/payable), unit price, total due, payment deadline
- Payment step — amounts sourced from `flow.processingReport`
- Panel header chip shows "Awaiting payment" for `awaiting_payment` stage
- **Bug fix:** `statusBadgeClass()` — added violet styling for `awaiting_payment`
- **Bug fix:** "How it works" step 2 → "We process your document and generate a quality report"; step 3 → "Review the report, pay via M-Pesa, and download"

---

### Phase 7 · Test suite

**8 new test files:**

| File | Type | Covers |
|---|---|---|
| `tests/Unit/PageQualityEvaluatorTest.php` | Unit | OCR/text classification, skip modes, fallback_grid, mocked OcrQualitySettings |
| `tests/Unit/JobErrorCodeTest.php` | Unit | All 6 cases have non-empty `userMessage()` |
| `tests/Unit/RetentionUnitTest.php` | Unit | `hours(3)`→3, `days(2)`→48, `weeks(1)`→168 |
| `tests/Unit/SupportTicketStatusTest.php` | Unit | Terminal states (resolved/closed only), labels, colors non-empty |
| `tests/Unit/PurgeUnpaidJobsTest.php` | Unit | RefreshDatabase; seeds expired job; command sets `failed` + `payment_deadline_expired` |
| `tests/Feature/SupportTicketApiTest.php` | Feature | POST /api/support/tickets — 201 + TKT- prefix, 422 on missing fields |
| `tests/Feature/LegalApiTest.php` | Feature | GET /api/legal/terms + /privacy — 200 public, correct shape |
| `tests/Feature/JobReportApiTest.php` | Feature | 401 no auth, 403 wrong user, 404 unknown, 200 own job with float amounts |

---

### Bugfix · Settings migration (2026-07-30)

Converted the `SettingsSeeder` into a proper Spatie settings migration (`database/settings/2026_07_29_000006_create_phase7_settings.php`). Running `php artisan migrate --path=database/settings` is now sufficient on any environment — no separate seeder step required. Fixes `MissingSettings` errors on all three new Filament settings pages.

---

### Phase 8 · OCR diagnostics storage + frontend pages (2026-07-30)

**Backend — `tenthline-api` (branch: `enhancements`)**

| Change | Detail |
|---|---|
| Migration `2026_07_30_000001_add_raw_diagnostics_to_page_processing_results` | Adds `raw_diagnostics JSON NULL` column to `page_processing_results` |
| `PageQualityResult` | Added `rawDiagnostics: ?array` as last constructor param |
| `PageQualityEvaluator` | All 7 `new PageQualityResult(...)` calls now pass `rawDiagnostics: $diagnostics ?: null` |
| `ProcessingReportGenerator` | Bulk insert includes `raw_diagnostics` (JSON-encoded) |
| `SupportTicketController::store()` | Accepts optional `attachment` file (PDF/image/doc, max 20 MB); stores via `SupportAttachment` model |
| `ViewPdfJob` Filament page | Full infolist: job overview + processing report summary + per-page table with expandable OCR diagnostics (engine, boxes, confidence, text, coords) |
| Unit tests | `PageQualityEvaluatorTest` fixtures updated to use `diagnostics.scored_lines` format |

**Frontend — `tenthline` (branch: `main`)**

| Change | Detail |
|---|---|
| Navbar | Home/Support/Terms/Privacy links using `NuxtLink` for proper page routing |
| `app.vue` | Route-based rendering: home content shown at `/`, `<NuxtPage>` used for sub-routes |
| `pages/terms.vue` | Dedicated Terms & Conditions page — fetches `/api/legal/terms`, renders HTML content |
| `pages/privacy.vue` | Dedicated Privacy Policy page — fetches `/api/legal/privacy`, renders HTML content |
| `pages/support.vue` | Full support page with form (email, subject, message) + drag-and-drop file attachment (PDF/image/doc, 20 MB max), posts multipart to `/api/support/tickets` |

---

## Running the automated test suite

```bash
# All new unit tests
php artisan test \
  tests/Unit/PageQualityEvaluatorTest.php \
  tests/Unit/JobErrorCodeTest.php \
  tests/Unit/RetentionUnitTest.php \
  tests/Unit/SupportTicketStatusTest.php \
  tests/Unit/PurgeUnpaidJobsTest.php

# All new feature tests
php artisan test \
  tests/Feature/SupportTicketApiTest.php \
  tests/Feature/LegalApiTest.php \
  tests/Feature/JobReportApiTest.php

# Full suite
php artisan test
```

---

## Manual end-to-end tests

> **Payment simulation:** set `ENABLE_PAYMENT=false` in `.env` to auto-simulate M-Pesa success after ~5 seconds.

---

### 1. Settings pages (Phase 1 + 5)

1. Navigate to `/admin/settings/ocr-quality` — page loads without error, fields pre-filled
2. Change `min_ocr_confidence` to `0.7`, save, reload — value persists ✓
3. Navigate to `/admin/settings/retention` — fields pre-filled
4. Change **Payment deadline** to `24`, save — confirm DB: `retention.payment_deadline_hours = 24` ✓
5. Navigate to `/admin/settings/legal-content` — RichEditor loads empty (first run) ✓
6. Enter any text in T&C field, save — `legal.terms_updated_at` is set ✓

---

### 2. Upload and processing — new flow (Phase 2–3 + 4)

1. Upload a multi-page PDF
2. Panel moves to **uploading** then **processing** — no payment gate at upload ✓
3. After processing completes, panel transitions automatically to **Processing Report** (step 3 of 3) ✓
4. Report shows: uploaded_pages, successful_pages, (optionally) low_confidence_pages, failed_pages, billable pages, price per page, total due ✓
5. Panel header chip reads **"Awaiting payment"** in violet ✓
6. In DB: `pdf_jobs.status = awaiting_payment`, `processing_report_id` is set, `payment_deadline_at` is set ✓
7. `processing_reports` table has one row; `page_processing_results` has one row per page ✓

---

### 3. Payment flow (Phase 4 + 6)

1. From the report step, click **"Pay KES X.XX"** → payment step appears (step 4) ✓
2. Payment step shows amount from `flow.processingReport.total_amount` (not the upfront estimate) ✓
3. Enter email and phone → click **Pay**
4. In simulation mode: ~5 s later, payment confirmed ✓
5. Panel moves to **Download**; download PDF, confirm line numbers are present ✓
6. **My documents** shows job as `completed` with a green badge ✓
7. History panel: `awaiting_payment` jobs show a violet badge ✓

---

### 4. Zero payable pages edge case (Phase 2–3)

1. In admin → OCR Quality Settings, raise all thresholds to very high values (e.g. `min_ocr_confidence = 1.0`)
2. Upload a scanned PDF
3. After processing: job transitions to `failed`, error code `zero_successful_pages` ✓
4. Panel shows error state — no report step, no payment prompt ✓
5. In DB: `pdf_jobs.error_code = zero_successful_pages`, `payable_pages = 0` ✓
6. Output PDF deleted from storage ✓
7. Restore thresholds

---

### 5. Payment deadline enforcement (Phase 2–3 + 4)

1. Process a PDF to `awaiting_payment` — do not pay
2. Manually expire the deadline:
   ```bash
   php artisan tinker --execute="App\Models\PdfJob::where('status','awaiting_payment')->update(['payment_deadline_at'=>now()->subHour()]);"
   ```
3. Run the purge command:
   ```bash
   php artisan pdf-jobs:purge-unpaid
   ```
4. Job: `status = failed`, `error_code = payment_deadline_expired`, `storage_deleted_at` is set ✓
5. Output file removed from disk ✓

---

### 6. Legal content API (Phase 4 + 5)

1. In admin → Legal Content, enter text for T&C and Privacy Policy, save
2. `GET /api/legal/terms` (no auth) → 200 with `content` and `updated_at` ✓
3. `GET /api/legal/privacy` (no auth) → 200 ✓
4. `GET /api/legal/terms` without having saved anything → 200 with `content: null` (not an error) ✓

---

### 7. Support tickets (Phase 4 + 5)

1. `POST /api/support/tickets` with `{ email, subject, description }` → 201, `reference` matches `TKT-[A-Z0-9]{8}` ✓
2. POST without `subject` → 422 validation error ✓
3. In admin → Support Tickets: new ticket visible, status = `open` ✓
4. Change status to `resolved`, save → `resolved_at` auto-set ✓
5. Change status to `open` again, save → `resolved_at` cleared ✓

---

### 8. Processing report API (Phase 4)

```bash
# Replace TOKEN and JOB_ID with real values
curl -H "Authorization: Bearer TOKEN" http://tenthline-api.test/api/job/JOB_ID/report
```

Expected shape:
```json
{
  "report": {
    "id": "...",
    "uploaded_pages": 5,
    "successful_pages": 4,
    "low_confidence_pages": 1,
    "failed_pages": 0,
    "payable_pages": 4,
    "unit_price": 5.0,
    "total_amount": 20.0,
    "currency": "KES",
    "bill_low_confidence_pages": false
  },
  "page_results": [...],
  "payment_deadline_at": "2026-07-31T08:00:00.000000Z"
}
```

- No auth → 401 ✓
- Another user's job → 403 ✓
- Unknown job_id → 404 ✓
- `unit_price` and `total_amount` are floats, not strings ✓

---

### 9. Purge commands (Phase 2–3)

```bash
# Confirm all three are registered and scheduled
php artisan schedule:list | grep purge

# Run each individually
php artisan pdf-jobs:purge-expired        # honours RetentionSettings, not hardcoded value
php artisan pdf-jobs:purge-unpaid
php artisan support:purge-attachments
```

- All three appear in `schedule:list` as hourly ✓
- Each exits 0, no exceptions ✓
- `pdf-jobs:purge-expired` uses the retention value from the DB settings, not a hardcoded number ✓

---

### 10. Frontend badge and copy (Phase 6 bugfixes)

1. Submit a job and let it reach `awaiting_payment`
2. Open **My documents** — the job badge is **violet** (not blue/primary) ✓
3. On the landing page with a file selected, the **"How it works"** card shows:
   - Step 1: "Upload your PDF"
   - Step 2: "We process your document and generate a quality report" ✓
   - Step 3: "Review the report, pay via M-Pesa, and download" ✓

---

### 11. Navbar pages (Phase 8)

1. Visit the frontend — navbar shows **Home · Support · Terms · Privacy** links ✓
2. Click **Terms** → navigates to `/terms`; page renders Terms & Conditions HTML (or "not published yet" placeholder) ✓
3. Click **Privacy** → navigates to `/privacy`; same for Privacy Policy ✓
4. Click **Home** → returns to `/` with drop zone ✓

### 12. Support page with file attachment (Phase 8)

1. Click **Support** in the navbar → navigates to `/support` ✓
2. Fill in email, subject, message; click **Send message** (no file) → 201, success state shown with ticket reference ✓
3. Try submitting without subject → form-level required field validation prevents submit ✓
4. Attach a PDF by drag-and-drop or file picker; confirm file name + size shown in attachment area ✓
5. Submit with attachment → 201 success ✓
6. In admin → Support Tickets: ticket visible with `open` status ✓
7. Try attaching a file > 20 MB → inline error "File is too large" ✓
8. Try attaching an unsupported type (e.g. `.zip`) → inline error "File type not supported" ✓

### 13. OCR diagnostics in Filament (Phase 8)

1. Process a scanned PDF via the normal flow to completion
2. In Filament admin → PDF Jobs → click **View** on the job ✓
3. **Job Overview** section shows: filename, status badge (Success/green), user, dates ✓
4. **Processing Report** section shows: page counts (successful/low_confidence/failed), billable pages, unit price, total amount ✓
5. **Per-Page Results** section lists each page with: page #, status badge, confidence %, text boxes, chars, coverage, placement mode, billable badge ✓
6. For OCR pages: click the "Engine: ocr · NNNxNNN px · X OCR boxes — click to expand" summary → OCR box table expands showing text snippet, confidence %, chars, X range, height, Y ✓
7. Text-extraction pages (non-OCR): raw_diagnostics shows engine name and empty box count ✓

---

## New API routes reference

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/legal/terms` | Public | `content`, `updated_at` |
| GET | `/api/legal/privacy` | Public | `content`, `updated_at` |
| POST | `/api/support/tickets` | Public | Throttled 10/min · `email`, `subject`, `description`, `job_id?`, `attachment?` (file ≤20 MB) |
| GET | `/api/job/{id}/report` | Sanctum | Report + per-page detail + `payment_deadline_at` |
| POST | `/api/payments/quote` | Optional | **Changed:** now returns `is_estimate: true` |
| POST | `/api/payments/initiate` | Sanctum | **Changed:** accepts `job_id`, not `page_count`; job must be `awaiting_payment` |

**Frontend routes**

| Path | Page | Notes |
|---|---|---|
| `/` | Home | Drop zone + processing flow (unchanged) |
| `/support` | Support | Contact form + file attachment |
| `/terms` | Terms & Conditions | Fetches `/api/legal/terms` |
| `/privacy` | Privacy Policy | Fetches `/api/legal/privacy` |

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `MissingSettings: terms_and_conditions…` | Settings migration not run | `php artisan migrate --path=database/settings` |
| `MissingSettings: retention_value…` | Same | Same |
| Filament settings pages load old values | Cached settings | `php artisan settings:clear-cache` |
| Payment initiate returns 422 | Job not in `awaiting_payment` state | Wait for processing to complete before calling initiate |
| `pdf-jobs:purge-unpaid` not found | Old code in cache | `composer dump-autoload && php artisan cache:clear` |
| Report step not shown after processing | WebSocket not connected | Fall back to polling (every 2.5 s); check Pusher/Reverb config |
| `/terms`, `/privacy`, `/support` return 404 | Pages not yet compiled | Run `npm run build` or `npm run dev` to enable Nuxt routing |
| Support file upload returns 422 | File type or size mismatch | Check `mimes` validation in `SupportTicketController` — PDF/images/doc up to 20 MB |
| OCR diagnostics not populated on old jobs | Column added after jobs ran | Only jobs processed after running `2026_07_30_000001_add_raw_diagnostics_...` migration will have data |
