# Legal PDF Line Numbering — Final Implementation Plan

**Document purpose:** Production-ready implementation plan for the Legal PDF Line Numbering SaaS (Nuxt frontend `tenthline` + Laravel backend `tenthline-api`), including additional recommendations, full stack choices with rationale, **M-Pesa pay-before-upload revenue flow**, **Laravel Filament 3 admin panel** (jobs, payments, settings such as `enable_payment`), **brand (blue, black, grey, white + Outfit font)**, **one-page Nuxt experience** (upload → processing → download on a single page), and a phased plan to ship a market-ready product.

---

## Part 1 — Additional Recommendations for Line Numbering

These recommendations extend the original [legal_pdf_line_numbering_implementation_plan.md](./legal_pdf_line_numbering_implementation_plan.md) to improve accuracy, UX, reliability, and security.

### 1.1 Line Numbering Modes


| Mode                        | Description                                                                                                     | Use case                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Fixed spacing (default)** | Estimate lines from page height and a configurable line height (e.g. ~24pt). Number every Nth line (10, 5, 25). | Fast, predictable; good for most pleadings.                         |
| **Text-aware (optional)**   | Use PDF text/position data to place numbers on actual line boundaries.                                          | When courts or firms require numbers to align with real text lines. |


**Recommendation:** Ship MVP with **fixed spacing** only. Add **text-aware** as a Phase 2 option (may require Poppler/pdfminer or a small Python/Node service for accurate line extraction, then overlay in PHP or merge PDFs).

### 1.2 Numbering Options to Expose in UI

- **Interval:** Every 5, 10, 25 lines (default: 10).
- **Margin:** Left or right.
- **Font size:** 8pt (default), 9pt, 10pt.
- **Numbering style:** Continuous across document vs restart per page (e.g. "1, 2, 3…" per page).
- **Start number:** e.g. start at 1 or at a custom value (for appendices).

### 1.3 Preview Before Processing

- Use **PDF.js** (Mozilla) in the frontend to render the first 1–3 pages of the uploaded file.
- Show a short "Preview" step with "This document has approximately X pages" and sample numbering style (e.g. mock numbers in margin). On the one-page app, this appears inline before the user submits.

### 1.4 Progress and Status UX

- **Stages:** "Uploading" → "Analyzing" → "Adding line numbers" → "Generating PDF" → "Ready".
- **Per-stage progress:** e.g. "Adding line numbers: page 450 / 1000" with ETA. All shown **on the same page** — no navigation; the main content area switches from upload form to progress, then to download.
- **Pause/cancel:** Allow cancelling a job (mark as cancelled, stop worker from continuing if possible, clean up temp files).
- **Completion:** Clear CTA to download; optional "Process another document" that resets the view to the upload section — all on the one page.

### 1.5 Reliability and Large Files

- **Chunked/resumable uploads:** Use **TUS** (with Uppy on the frontend) for files e.g. 100MB+ so uploads survive drops and show accurate progress.
- **Job retries:** Configurable retries (e.g. 2–3) with exponential backoff; on final failure, set status to `failed` and store error message for the user.
- **Partial results:** For very large docs, consider "save progress" (e.g. every 500 pages) so a crash doesn't lose everything (advanced; can be Phase 2).
- **Timeouts:** Per-job timeout (e.g. 1–2 hours) and per-page timeout to avoid stuck workers.

### 1.6 Security and Abuse

- **Validation:** PDF only (magic bytes + extension); max file size (e.g. 500MB–1GB) and max page count (e.g. 3000) with clear errors.
- **Rate limiting:** Per-IP and per-user (when auth exists) on upload and on job status to avoid abuse.
- **Virus scanning (optional):** ClamAV or cloud scan on upload; quarantine or reject infected files.
- **Temp file lifecycle:** Delete input and output files after download or after TTL (e.g. 24 hours); run a scheduled command to purge old `pdf_jobs` artifacts.

### 1.7 Accessibility and Compliance

- **PDF tagging:** When using a library that supports it, add minimal structure (e.g. artifact for line numbers) so screen readers don't read numbers as main content.
- **Metadata:** Preserve title/author where possible; add "Line numbers added by [App name]" in producer metadata if desired.

### 1.8 Optional: Real-Time Progress

- **Polling (MVP):** GET `/api/job/{id}` every 2–3 seconds; simple and sufficient; UI updates in place on the single page.
- **Pushing (Phase 2):** Laravel Echo + Pusher or Soketi so the UI updates without polling; better for long jobs and many concurrent users.

### 1.9 Revenue — Pay Before Upload (M-Pesa)

- **Flow:** User must pay a fee (M-Pesa STK Push) **before** they can upload a file. On successful payment they receive a **payment reference** (or session token) that authorises one upload + process + download.
- **Steps:** 1) User enters phone number and clicks "Pay & continue". 2) Backend initiates M-Pesa STK Push. 3) User completes payment on phone. 4) M-Pesa callback confirms payment; backend marks payment as completed. 5) Frontend allows upload only when payment is completed; upload request includes payment reference. 6) One payment = one document (one `pdf_job`). All of this happens on the **same single page** (payment block at top, then upload, then processing, then download).
- **Pricing:** Single fee per document (e.g. KES 50–200); configurable in admin. Optional future: tiered by page count.
- **Admin toggle:** `enable_payment` (bool) in admin settings. When **off**, users can upload without paying (e.g. beta or promotions). When **on**, upload endpoint requires a valid paid payment reference.

---

## Part 2 — Full Stack Selection and Rationale

### 2.1 Frontend — Nuxt (tenthline)

**One-page experience:** The Nuxt app is a **single page**. The user uploads the file, sees processing (progress, ETA) on the same page, and receives a download button when done — no navigation or separate routes for the main flow. Payment (when enabled), dropzone, numbering options, progress, and download all live in one view; only the visible section changes (e.g. dropzone + options → progress → download button) via component state. Everything sits on the one page.


| Layer                         | Choice                                  | Rationale                                                                                                                                                                                |
| ----------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**                 | Nuxt 3/4 + Vue 3                        | Already in use; SSR/SSG optional; good DX and ecosystem.                                                                                                                                 |
| **State**                     | Pinia                                   | Official Vue store; clear API, devtools; good for job progress, upload state, and which "block" is visible on the one page (upload vs processing vs download).                           |
| **Styling**                   | Tailwind CSS + Nuxt UI                  | Fast iteration; apply **brand colors** (blue, black, grey, white) and **Outfit** font (see §2.1.1).                                                                                      |
| **File upload (primary)**     | **Nuxt UI `UFileUpload`**               | Built-in dropzone: drag-and-drop + click-to-browse; `dropzone` + `interactive`; area/button variants; label, description, icon, color; fits design system for a polished, attractive UI. |
| **File upload (alternative)** | **@jaxtheprime/vue3-dropzone**          | If you need deeper customization: slots for title/description/preview, server upload hooks, rejection reasons; use when you want full control over dropzone copy and layout.             |
| **Upload (large / Phase 2)**  | Uppy + @uppy/tus                        | Resumable uploads for 100MB+; add when you need TUS server (see backend).                                                                                                                |
| **PDF preview**               | PDF.js (pdfjs-dist)                     | Industry standard; render first pages in browser without backend; show inline on the same page.                                                                                          |
| **HTTP**                      | $fetch / useFetch                       | Built-in; use for API calls and polling job status.                                                                                                                                      |
| **Forms/validation**          | VeeValidate + Zod (or Nuxt form module) | Reliable validation and error messages for settings form.                                                                                                                                |


**Why not:** Raw Vue CLI (Nuxt gives routing, API, config). Plain `<input type="file">` with no dropzone (poor UX). Multiple pages for upload/processing/download (user asked for one pager). TUS only from day one (add when you need resumable large uploads).

### 2.1.1 Brand — Colors and typography

Apply these consistently across the Nuxt app (and optionally in the Filament admin) so the product feels recognisable and professional.

**Brand colors**


| Token     | Use                                                                           |
| --------- | ----------------------------------------------------------------------------- |
| **Blue**  | Primary actions, links, focus states, dragover state on upload zone, accents. |
| **Black** | Primary text, headings, key UI elements.                                      |
| **Grey**  | Secondary text, borders, disabled states, subtle backgrounds.                 |
| **White** | Page and card backgrounds, contrast against black/blue.                       |


- **Implementation (Nuxt + Tailwind):** Extend Tailwind theme in `tailwind.config` (or Nuxt UI theme) so that `primary` / `brand` map to your blue, and use grey shades (e.g. `gray-500`, `gray-700`) for secondary text and borders. Use black for body/headings and white for backgrounds.
- **Nuxt UI:** Set the app (or UFileUpload) `color` to your primary (blue); ensure buttons, links, and focus rings use the brand blue.

**Brand font: Outfit**

- **Use:** Outfit for all UI typography (headings, body, labels, buttons).
- **Implementation:** Load via Google Fonts in `nuxt.config.ts` or `app.vue` (e.g. `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');`) and set `font-family: 'Outfit', sans-serif` as the default in Tailwind (e.g. `theme.extend.fontFamily.sans = ['Outfit', 'sans-serif']`).
- **Weights:** Include 400 (body), 500–600 (labels, buttons), 700 (headings) as needed.

Keep the single-page layout (upload zone, payment block, processing, download) aligned with these tokens so the flow feels cohesive.

### 2.1.2 Upload UI — Dropzone, drag-and-drop, and "wow" factor

The upload experience should feel premium and trustworthy so users are confident dropping legal documents. Use a **dropzone-first** component with both drag-and-drop and click-to-browse. It lives on the **one page** together with payment (if on), numbering options, processing state, and download.

**Recommended: Nuxt UI `UFileUpload`**

- **Component:** `UFileUpload` from Nuxt UI (v3/v4). Supports `dropzone`, `interactive`, `variant="area"` for a large drop zone, plus `label`, `description`, `icon`, `color`, `accept=".pdf"`, `:max-size`.
- **Behaviour:** User can drag a PDF onto the zone or click to open file picker; show clear idle / dragover / has-file / uploading / error states. After submit, the same page shows processing, then download — no route change.
- **Optional:** Use **@jaxtheprime/vue3-dropzone** if you need custom slots (e.g. custom headline, illustration, or preview cards) and don't mind maintaining a third-party component.

**Design guidelines for an attractive, conversion-focused upload UI**

- **Hero dropzone:** Use a large, inviting drop area (e.g. `variant="area"`, generous min-height) with a clear icon (e.g. document/upload), one short headline ("Drop your legal PDF here" / "Add line numbers in seconds"), and one line of support text (e.g. "or click to browse • PDF only, max 500MB").
- **Visual states:**  
  - **Idle:** Neutral border (grey), subtle background (white/grey), clear CTA; use brand colours (blue, black, grey, white) and Outfit font.  
  - **Dragover:** Distinct border/background in **brand blue**, slight scale or glow so users know the drop is valid.  
  - **File selected:** Replace zone with a compact "file card": filename, size, remove button; keep "Change file" visible.  
  - **Uploading:** Progress bar (and % if available) on the card; disable form until done.  
  - **Error:** Inline message (e.g. "File too large" / "Only PDFs allowed") with retry/clear.
- **Micro-interactions:** Subtle transitions on state change (e.g. border/background), optional success checkmark when file is accepted; avoid heavy animation that slows the flow.
- **Context:** Show allowed type and max size from `GET /api/config` (e.g. "Max 500 MB") so users aren't surprised by validation errors.
- **Accessibility:** Ensure keyboard focus and screen-reader labels; drag-and-drop is an enhancement, not the only way to add a file.
- **Mobile:** On small screens, emphasize tap-to-browse; the same component can stay, with a smaller touch target and clear "Choose file" text.

Pair the dropzone with payment (when enabled) and numbering options on the **same single page**; after submit, show processing then download in place so the full flow (Pay → **Upload** → Configure → Process → Download) stays on one page and feels cohesive and professional.

### 2.2 Backend — Laravel (tenthline-api)


| Layer                     | Choice                                              | Rationale                                                                         |
| ------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Framework**             | Laravel 11.x                                        | Mature, queue support, Horizon, filesystem abstraction.                           |
| **Queue**                 | Redis + Laravel Horizon                             | Fast, scalable; Horizon gives dashboard and config.                               |
| **File storage**          | Laravel Filesystem (local + S3)                     | One API; local for dev, S3 (or MinIO) for staging/prod.                           |
| **TUS server (optional)** | tus-php or ankane/tus-server                        | Required if using Uppy TUS for resumable uploads; otherwise use multipart upload. |
| **Upload (no TUS)**       | Multipart POST with `Storage::putFile()`            | Simple; use for MVP or smaller max file size.                                     |
| **PDF processing**        | See 2.4                                             | Chosen for correctness and memory safety.                                         |
| **Auth (later)**          | Laravel Sanctum (SPA)                               | Token-based; fits Nuxt as SPA.                                                    |
| **API**                   | REST + JSON                                         | Resource controllers: upload, job status, download, payments, config.             |
| **M-Pesa**                | Safaricom Daraja API (STK Push) + package or custom | C2B STK Push; user pays on phone; callback confirms; no card required.            |
| **Admin panel**           | Laravel Filament 3                                  | Full CRUD for jobs/payments; settings page; latest Filament.                      |


**Why not:** Synchronous processing (timeouts on large PDFs). Database queue (Redis scales better). Storing files only on local disk in production (S3/MinIO for durability and scaling).

### 2.3 Database and Cache


| Layer             | Choice              | Rationale                                                                        |
| ----------------- | ------------------- | -------------------------------------------------------------------------------- |
| **Database**      | PostgreSQL or MySQL | Laravel supports both; use existing preference.                                  |
| **Cache / queue** | Redis               | Session, cache, queue driver; single dependency for queues + optional real-time. |


**Schema:**

- **pdf_jobs:** id (UUID), filename, status, total_pages, processed_pages, progress, eta_seconds, created_at, updated_at; add `error_message` (nullable), `output_path` (nullable), `user_id` (nullable), `payment_id` (nullable, FK to payments when payment required).
- **payments:** id (UUID), amount (decimal), currency (string, e.g. KES), phone (string), reference (string, unique, for client to pass on upload), mpesa_merchant_request_id, mpesa_checkout_request_id, mpesa_result_code, mpesa_callback_payload (json, nullable), status (pending/completed/failed/cancelled), pdf_job_id (nullable, set when upload uses this payment), created_at, updated_at.
- **Settings (Filament/Spatie):** Use `spatie/laravel-settings` + Filament plugin; store e.g. `enable_payment` (bool), `price_per_document` (float), `max_file_size_mb`, `max_pages`, etc. (see Part 5).

### 2.4 PDF Processing — Library Choice


| Scenario               | Recommended approach                                  | Rationale                                                                                                |
| ---------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **MVP (all sizes)**    | **Poppler (pdftoppm + pdfunite) or Ghostscript**      | No full-doc load in PHP; page-by-page or batch; proven for large files.                                  |
| **Alternative MVP**    | **setasign/fpdi + setasign/fpdf or tecnickcom/tcpdf** | Pure PHP; good for small/medium PDFs; risk of memory limits on 1000+ pages.                              |
| **Accuracy (Phase 2)** | **Poppler (pdftotext) or Python pdfminer**            | Text/position extraction for true line detection; overlay numbers with same Poppler/Ghostscript or FPDI. |


**Recommendation:**

- **Primary (recommended):** Use **Poppler** or **Ghostscript** from PHP (e.g. `Process::run()`) to:
  - Render each page to image or PDF,
  - Overlay line numbers (e.g. ImageMagick/GD for image path, or Ghostscript for PDF overlay),
  - Stitch pages back into one PDF.
- **Fallback:** Use **FPDI + TCPDF** in PHP for documents under ~200 pages and/or when Poppler/Ghostscript are not available (e.g. shared hosting).
- **Line positioning:** MVP = fixed spacing from page height and configured line height; Phase 2 = text-aware positioning via Poppler `pdftotext -layout` or pdfminer for coordinates.

**Why not:** Processing entire 2000-page PDF in PHP memory (FPDI can OOM). Relying only on FPDI for 3000-page support (not reliable).

### 2.5 File Storage


| Environment      | Choice                      | Rationale                                                                  |
| ---------------- | --------------------------- | -------------------------------------------------------------------------- |
| **Local dev**    | `storage/app/pdf-jobs`      | Simple; no extra services.                                                 |
| **Staging/Prod** | S3 or MinIO (S3-compatible) | Durable, scalable; Laravel S3 driver; lifecycle rules to delete after TTL. |


**Paths:**  
Input: `pdf-jobs/{job_id}/input.pdf`  
Output: `pdf-jobs/{job_id}/output.pdf`  
Delete both after download or after 24h cron.

### 2.6 Optional: Real-Time (Phase 2)


| Layer         | Choice                                 | Rationale                                                                          |
| ------------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| **Backend**   | Laravel Echo (broadcasting)            | Fits Laravel; event when job progress updates.                                     |
| **Transport** | Pusher or Soketi (self-hosted)         | Pusher = hosted; Soketi = open-source, WebSockets.                                 |
| **Frontend**  | Laravel Echo (npm) + listen to channel | Replace polling with push for progress; UI still updates in place on the one page. |


### 2.7 M-Pesa Integration


| Layer        | Choice                                                                          | Rationale                                                                                              |
| ------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **API**      | Safaricom Daraja API (STK Push / Lipa Na M-Pesa)                                | Standard C2B flow; user gets prompt on phone.                                                          |
| **Package**  | `tfs/mpesa` (Packagist) or custom service                                       | `tfs/mpesa` supports STK Push, callbacks, PHP 8.x; else wrap Daraja in a Laravel service.              |
| **Flow**     | Initiate STK → callback URL → update payment → frontend polls or uses reference | Callback is authoritative; store MerchantRequestID, CheckoutRequestID, ResultCode, MpesaReceiptNumber. |
| **Security** | Validate callback signature/credentials; idempotent callback handler            | Prevent replay and fake callbacks.                                                                     |


**Env:** `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_BASE_URL`, `MPESA_ENVIRONMENT` (sandbox/live).

### 2.8 Admin Panel — Laravel Filament 3


| Layer        | Choice                                                                                                   | Rationale                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Panel**    | Laravel Filament 3 (latest)                                                                              | Full admin UI: resources, filters, tables, forms; one package.               |
| **Settings** | `spatie/laravel-settings` + Filament plugin (`filament/spatie-settings-plugin` or Filament SettingsPage) | Store `enable_payment`, `price_per_document`, etc. in DB; editable in admin. |
| **Auth**     | Filament auth (e.g. `filament/panels` with custom user)                                                  | Separate admin login; no mix with customer-facing auth initially.            |


---

## Part 3 — Final Implementation Plan for Market Release

### 3.1 Goals

- **Functional:** **Pay (M-Pesa, when enabled) →** Upload PDF → add line numbers every N lines → download; support up to ~3000 pages and large file sizes (e.g. 500MB+ with TUS). All user-facing steps happen on **one page** in the Nuxt app.
- **Revenue:** M-Pesa STK Push before upload; admin can enable/disable payment and set price.
- **Admin:** Filament 3 panel to view all jobs, all payments, and manage settings (e.g. `enable_payment`).
- **UX:** **Single page:** (Pay →) Upload & configure → Processing (in place) → Download. No route changes; only the visible block updates (dropzone → progress → download button). Clear progress, ETA, error messages, and a simple, professional UI.
- **Performance:** No request timeouts; background jobs; page-by-page or batched processing; fast polling or real-time updates.
- **Release-ready:** Error handling, rate limits, basic security, and clear deployment steps.

### 3.2 Phase 1 — MVP (Weeks 1–4)

#### Backend (tenthline-api)

1. **Project setup**
  - Laravel 11, Redis, Horizon; migrations: `pdf_jobs` (with `error_message`, `output_path`, `payment_id`), `payments`, Spatie settings table.
  - Storage: local disk + S3 config (MinIO for dev if desired).
  - Filament 3 admin panel at `/admin`; Spatie settings for app config.
2. **Payment (when enabled)**
  - `GET /api/config`: return public config e.g. `{ enable_payment: true, price_per_document: 100, currency: "KES" }` (from settings).
  - `POST /api/payments/initiate`: body `{ phone: "254712345678" }`; create `payments` row (pending); trigger M-Pesa STK Push; return `{ payment_id, reference, message: "Complete payment on your phone" }`.
  - `POST /api/webhooks/mpesa` (or route used by Daraja): handle M-Pesa callback; update payment status; idempotent by CheckoutRequestID.
  - `GET /api/payments/{reference}/status`: return `{ status, amount, currency }` for frontend polling until completed/failed.
  - Payment record: `reference` (unique string) sent to frontend; used once to authorise one upload.
3. **Upload**
  - `POST /api/upload`: if `enable_payment` then require valid `payment_reference` (or `payment_id`) and ensure payment status is completed and not already used; validate PDF (type, size, optional page limit); store file; create `pdf_jobs` row (link `payment_id`); mark payment as used (e.g. set `pdf_job_id`); dispatch `ProcessPdfJob`.
  - Return `{ job_id, status: "pending" }`.
4. **PDF worker**
  - `ProcessPdfJob`: load PDF (Poppler/Ghostscript or FPDI); loop by page; overlay line numbers (fixed spacing); write output; update `processed_pages`, `progress`, `eta_seconds`; set `status` and `output_path` on completion/failure.
  - Use `DB::table('pdf_jobs')->where('id', $id)->update([...])` for progress to avoid heavy model hydration.
5. **APIs**
  - `GET /api/job/{id}`: return progress, status, `eta_seconds`, `error_message`, and download URL when completed.
  - `GET /api/job/{id}/download`: stream or redirect to signed S3 URL for output file.
6. **Cleanup**
  - Scheduled command: delete `input.pdf` and `output.pdf` for jobs older than 24h (or after download if you track that).
7. **Security**
  - Rate limiting on `/api/upload`, `/api/job/{id}`, `/api/payments/initiate`; validate file type and size; optional ClamAV.
8. **Filament admin panel**
  - Install Filament 3; create admin user (or use existing User model).
  - Resources: **PdfJob** (table: job id, filename, status, progress, created_at; filters by status; link to payment); **Payment** (table: id, amount, phone, reference, status, created_at; filters by status).
  - Settings page (Spatie): `enable_payment`, `price_per_document`, `currency`, `max_file_size_mb`, `max_pages`; optional: branding, maintenance mode.

#### Frontend (tenthline) — one page only

1. **Setup**
  - Nuxt 3/4, Pinia, Tailwind, Nuxt UI (or chosen component set). **Single route:** one page that contains the entire flow.
  - Environment: `NUXT_PUBLIC_API_BASE=http://tenthline-api.test` (or production API URL).
  - Brand: Outfit font, blue/black/grey/white (see §2.1.1).
2. **Payment (when enable_payment is true) — same page**
  - On load: fetch `GET /api/config`; if `enable_payment` show "Pay KES {price} to continue" and phone input at top of the page.
  - User enters phone (254…); call `POST /api/payments/initiate`; show "Complete payment on your phone"; poll `GET /api/payments/{reference}/status` until status is completed or failed.
  - On success: store `payment_reference` in Pinia/session; reveal/enable the upload section on the same page. On failure: show error and retry inline.
3. **Upload — same page**
  - Use **Nuxt UI `UFileUpload`** (or @jaxtheprime/vue3-dropzone) for a **dropzone**: drag-and-drop + click-to-browse; `accept=".pdf"`, max size from config; large "hero" area with clear headline and support text (see §2.1.2). After file selection, show a file card (name, size, remove) and the numbering options form (interval, margin, font size).
  - On submit: POST file + options + (if paid) `payment_reference` to API; store `job_id` in Pinia; **stay on the same page** and switch the main content to the processing state (no redirect). For very large files (Phase 2), add Uppy + TUS.
4. **Processing — same page**
  - Replace (or collapse) the upload section and show **processing UI** in place: progress bar, "Page X / Y", ETA, status stage. Poll `GET /api/job/{id}` every 2–3 seconds.
  - On `completed`: show **download button** (and optional "Process another document" that resets state to upload). On `failed`: show `error_message` and a "Try again" that resets to upload — all on the same page.
5. **Preview (optional but recommended)**
  - After file select, use PDF.js to show first 1–2 pages and approximate page count (inline on the same page).
6. **UI/UX**
  - **Single-page layout:** One scrollable or stacked view: payment (if on) → dropzone + options → processing (replaces/collapses upload) → download CTA. No route changes. Clear typography (Outfit), brand colours, spacing, and contrast; accessible buttons and labels; loading and error states; mobile-friendly layout.

#### DevOps

- **Local:** Docker or Laravel Sail for app + Redis (+ MinIO if needed).
- **Production:** Nginx, PHP-FPM, Redis, Horizon, queue workers; cron for cleanup; S3 bucket + IAM.

### 3.3 Phase 2 — Polish and Scale (Weeks 5–6)

- **Resumable uploads:** TUS server in Laravel + Uppy TUS in Nuxt for large files.
- **Real-time progress:** Laravel Echo + Pusher/Soketi; frontend subscribes to job channel; updates still in place on the one page.
- **Text-aware line numbering (optional):** Poppler/pdfminer for line positions; overlay with existing pipeline.
- **Auth (if needed):** Sanctum; `user_id` on `pdf_jobs`; rate limits per user; "My jobs" list (could be a second page or a section on the same page).
- **Monitoring:** Horizon dashboard; logging (e.g. Laravel Log); optional APM (e.g. Sentry).

### 3.4 UI/UX Checklist (Release)

- **One page:** All steps on a single page: (Pay →) Upload & configure → Processing (in place) → Download. No navigation; only the visible block changes (e.g. dropzone → progress → download button).
- Upload: **dropzone** (drag-and-drop + click-to-browse); hero-style area with headline and "or click to browse • PDF only, max X MB"; show file card (name, size, remove) when selected; validation errors inline; dragover state visually distinct.
- Settings: sensible defaults (interval 10, left margin, 8pt); tooltips or short hints.
- Progress: bar + "Page X of Y" + ETA; stage description ("Adding line numbers…"); all shown in place on the same page.
- Completion: prominent download button on the same page; optional "Process another document" that resets to upload view.
- Errors: user-friendly message; suggest retry or different file/settings; "Try again" resets to upload on the same page.
- Responsive: usable on tablet and desktop; primary actions above the fold.
- Accessibility: focus order, labels, contrast (WCAG 2.1 AA where feasible).
- Single-page "wow": hero dropzone, clear typography and spacing, trust cues (e.g. "Secure • PDF only"); progress and download appear in place without leaving the page; avoid cramped or generic file input so the experience feels premium and attracts users.

### 3.5 Performance Targets

- **Upload:** < 2 min for 500MB on good connection (with TUS); < 30 s for 50MB (multipart).
- **Processing:** Rough target 2–5 s per page (depends on server); ETA within ~20% of actual.
- **Polling:** 2–3 s interval; < 100ms response for `GET /api/job/{id}`.
- **Download:** Streaming or signed URL; no full load in app memory.

### 3.6 Release Criteria

- When payment enabled: user pays via M-Pesa STK Push, then can upload one document; when disabled: user can upload without payment.
- **One-page Nuxt app:** User uploads, sees processing, and gets download button all on the same page; no route changes.
- User can upload a PDF (at least up to 100MB without TUS).
- User can set line interval, margin, and font size.
- Job runs in background; progress and ETA visible in place; completion leads to download button on same page.
- Tested with 10, 100, and 500+ page PDFs; no timeouts or OOM.
- Failed jobs show clear error; temp files cleaned up.
- Admin panel: view all jobs and all payments; change `enable_payment` and price; settings persist.
- Rate limiting and file validation in place.
- Deployment runbook: env vars (incl. M-Pesa), queue workers, Horizon, cron, S3, Filament admin URL.

### 3.7 Project Layout Assumption

- **Frontend:** Nuxt app lives in this repo root (`tenthline` — `package.json`, `app/`, `nuxt.config.ts`). The main user experience is a **single page** (e.g. index or default route) with the full flow.
- **Backend:** Laravel app can live in a sibling directory `tenthline-api/` or in a separate repo; ensure CORS and `NUXT_PUBLIC_API_BASE` point to the Laravel API URL in each environment.

---

## Part 4 — Revenue & M-Pesa (Detail)

### 4.1 User flow when payment is enabled

1. User opens app (one page) → frontend calls `GET /api/config` → receives `{ enable_payment: true, price_per_document: 100, currency: "KES" }`.
2. User sees "Pay KES 100 to add line numbers to one document" and enters M-Pesa phone number (254…) on the same page.
3. User clicks "Pay & continue" → frontend calls `POST /api/payments/initiate` with `{ phone: "254712345678" }`.
4. Backend creates a `payments` row (status: pending), calls Safaricom STK Push API, returns `{ payment_id, reference }` to frontend.
5. User completes payment on phone; Safaricom sends callback to `POST /api/webhooks/mpesa` (or your chosen route).
6. Backend validates callback, updates payment to completed, stores M-Pesa receipt/ref.
7. Frontend polls `GET /api/payments/{reference}/status` until status is `completed` or `failed`; then reveals the upload section on the same page and stores `reference`.
8. On upload, frontend sends `payment_reference` (or `payment_id`) in `POST /api/upload`; backend verifies payment is completed and not yet used, then creates job and links `payment_id` to `pdf_jobs`. Processing and download then appear in place on the one page.

### 4.2 API contract (summary)


| Method | Endpoint                         | Purpose                                                                                                        |
| ------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| GET    | /api/config                      | Public config: enable_payment, price_per_document, currency, max_file_size_mb, max_pages.                      |
| POST   | /api/payments/initiate           | Body: { phone }. Returns: { payment_id, reference }. Initiates STK Push.                                       |
| GET    | /api/payments/{reference}/status | Returns { status, amount, ... }. For polling until completed/failed.                                           |
| POST   | /api/webhooks/mpesa              | Daraja callback; update payment; must be idempotent.                                                           |
| POST   | /api/upload                      | Body: file + options + (if enable_payment) payment_reference. Creates job only if payment valid when required. |
| GET    | /api/job/{id}                    | Progress, status, eta_seconds, error_message, download URL when completed.                                     |
| GET    | /api/job/{id}/download           | Stream or redirect to signed URL for output file.                                                              |


### 4.3 M-Pesa implementation notes

- **Package:** Use `tfs/mpesa` (Laravel) or implement a small `MpesaService` that: gets OAuth token from Daraja, calls STK Push endpoint, and exposes a callback route that updates `payments` from the JSON body.
- **Callback URL:** Must be publicly reachable (e.g. `https://api.yourapp.com/api/webhooks/mpesa`). Use ngrok for local testing with Daraja sandbox.
- **Idempotency:** Use `mpesa_checkout_request_id` (or similar) to avoid applying the same callback twice.
- **Testing:** Use Safaricom sandbox and test credentials; simulate callbacks with a Postman/curl request if needed.

### 4.4 Pricing and configuration (admin)

- Store in DB via Spatie settings (see Part 5): `price_per_document` (decimal), `currency` (string), `enable_payment` (bool). Admin can set "Free mode" by turning `enable_payment` off so no payment is required before upload.

---

## Part 5 — Admin Panel (Laravel Filament 3)

### 5.1 Filament version and install

- Use **Filament 3** (latest): `composer require filament/filament:"^3.0"` and `php artisan filament:install --panels`. Create an admin panel (e.g. path `/admin`). Use a dedicated `Admin` model or your existing `User` with an `is_admin` flag for access.

### 5.2 Resources


| Resource            | Model   | Key features                                                                                                                                                                                       |
| ------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PdfJobResource**  | PdfJob  | Table: id, filename, status, progress, total_pages, processed_pages, created_at; filters: status, date range; relation to Payment; view single job (details, timestamps, error_message if failed). |
| **PaymentResource** | Payment | Table: id, amount, currency, phone, reference, status, created_at; filters: status, date; relation to PdfJob; view single payment (M-Pesa ref, callback payload if stored).                        |


### 5.3 Settings page (enable_payment, price, etc.)

- Use **Spatie Laravel Settings** with Filament: `composer require spatie/laravel-settings` and Filament settings plugin or a custom Filament Settings page.
- Define a settings class (e.g. `AppSettings`) with: `enable_payment` (bool), `price_per_document` (float), `currency` (string), `max_file_size_mb` (int), `max_pages` (int). Run migration for settings table.
- In Filament, add a "Settings" or "App settings" page where admin can toggle "Require payment before upload" and set price, limits, etc. Use these values in API (e.g. `GET /api/config` and upload validation).

### 5.4 Other admin capabilities

- **Dashboard (optional):** Widgets for "Jobs today", "Payments today", "Total revenue" (sum of completed payments).
- **Configurations:** All app-side toggles and limits in one settings page: enable_payment, price_per_document, currency, max_file_size_mb, max_pages; optional: maintenance mode. **Brand** (blue, black, grey, white + Outfit) is fixed in frontend config (see §2.1.1); optional Filament branding (logo, name) only if desired.

---

## Part 6 — Summary: Stack at a Glance


| Area                     | Technology                                                                     | Purpose                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Frontend**             | Nuxt 3/4, Vue 3, Pinia, Tailwind, Nuxt UI                                      | **One-page app:** upload, processing, download on same page; brand: blue, black, grey, white; font: Outfit (§2.1.1) |
| **File upload**          | Nuxt UI `UFileUpload` (dropzone + drag-and-drop) or @jaxtheprime/vue3-dropzone | Attractive dropzone; click or drag; file card; see §2.1.2                                                           |
| **Upload (large)**       | Uppy + TUS (Phase 2)                                                           | Resumable large uploads                                                                                             |
| **PDF preview**          | PDF.js (pdfjs-dist)                                                            | In-browser preview (inline on same page)                                                                            |
| **Backend**              | Laravel 11, REST API                                                           | Upload, jobs, download, payments, config                                                                            |
| **Queue**                | Redis, Laravel Horizon                                                         | Background PDF processing                                                                                           |
| **PDF processing**       | Poppler or Ghostscript (primary), FPDI+TCPDF (fallback)                        | Line numbering without loading full PDF in memory                                                                   |
| **Storage**              | Laravel Filesystem, S3/MinIO                                                   | Input/output PDFs                                                                                                   |
| **Database**             | PostgreSQL or MySQL                                                            | Jobs, payments, settings                                                                                            |
| **Payments**             | M-Pesa Daraja API (STK Push) + tfs/mpesa or custom                             | Pay before upload; callback updates payment                                                                         |
| **Admin**                | Laravel Filament 3                                                             | Jobs, payments, settings (enable_payment, price, limits)                                                            |
| **App settings**         | spatie/laravel-settings + Filament                                             | enable_payment, price_per_document, max_file_size_mb, etc.                                                          |
| **Auth (later)**         | Laravel Sanctum                                                                | SPA auth                                                                                                            |
| **Real-time (optional)** | Laravel Echo, Pusher or Soketi                                                 | Live progress updates (still on one page)                                                                           |


---

## References

- Original plan: [legal_pdf_line_numbering_implementation_plan.md](./legal_pdf_line_numbering_implementation_plan.md)
- Laravel: [Queues](https://laravel.com/docs/queues), [Horizon](https://laravel.com/docs/horizon), [Filesystem](https://laravel.com/docs/filesystem)
- Nuxt: [Nuxt 3 Docs](https://nuxt.com/docs)
- Uppy + TUS: [Uppy TUS](https://uppy.io/docs/tus/), [TUS protocol](https://tus.io/)
- PDF: [Poppler](https://poppler.freedesktop.org/), [Ghostscript](https://www.ghostscript.com/), [FPDI](https://www.setasign.com/products/fpdi/about/)
- M-Pesa: [Safaricom Daraja](https://developer.safaricom.co.ke/), [tfs/mpesa](https://packagist.org/packages/tfs/mpesa)
- Filament: [Filament 3](https://filamentphp.com/docs/3.x), [Spatie Settings plugin](https://filamentphp.com/plugins/filament-spatie-settings)

---

*This document is the single source of truth for stack choices and the implementation plan to release the Legal PDF Line Numbering product to market. The Nuxt app is a **one-pager**: upload, processing, and download all sit on a single page with no route changes.*