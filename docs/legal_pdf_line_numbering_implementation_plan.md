# Legal PDF Line Numbering SaaS

### Nuxt (Frontend) + Laravel (Backend) Implementation Plan

## 1. Project Overview

This application allows users (lawyers, law firms, court clerks,
students) to upload legal PDF documents and automatically add
court‑style line numbering in the margin (every 10th line).

Primary Feature (Phase 1): - Upload PDF - Automatically add numbering
every Nth line (default = 10) - Download processed PDF - Show real‑time
progress while processing large documents - Support extremely large
files (1000--3000 pages)

Architecture: - Frontend: Nuxt 3 - Backend: Laravel - Queue system:
Redis + Laravel Horizon - File storage: Local/S3/MinIO - PDF Processing:
FPDI + TCPDF or Ghostscript

------------------------------------------------------------------------

# 2. System Architecture

User → Nuxt Frontend → Laravel API → Queue Job → PDF Processor → Storage
→ Download

Workflow:

1.  User uploads PDF
2.  Laravel stores file
3.  Job dispatched to queue
4.  Worker processes PDF page-by-page
5.  Progress updates saved to database
6.  Frontend polls progress endpoint
7.  Final PDF generated
8.  User downloads result

------------------------------------------------------------------------

# 3. Core Features

## Phase 1 (MVP)

  Feature                  Description
  ------------------------ -----------------------------------
  PDF Upload               Upload multi-page legal documents
  Line Numbering           Add numbering every 10 lines
  Progress Bar             Shows processing progress
  Large Document Support   Handle up to 3000 pages
  ETA Display              Show estimated completion time
  User Settings            Configure numbering format
  Download Result          Download processed PDF

------------------------------------------------------------------------

# 4. Database Design

  Column            Type        Description
  ----------------- ----------- -------------------------------------------
  id                uuid        Job identifier
  filename          string      Original file name
  status            string      pending / processing / completed / failed
  total_pages       integer     Total pages in PDF
  processed_pages   integer     Pages completed
  progress          integer     Percentage
  eta_seconds       integer     Estimated time remaining
  created_at        timestamp   Upload time
  updated_at        timestamp   Last update

  : pdf_jobs

------------------------------------------------------------------------

# 5. Backend (Laravel) Implementation

## 5.1 Upload API

Endpoint:

POST /api/upload

Steps: 1. Validate PDF 2. Store file 3. Create pdf_jobs record 4.
Dispatch background job

Example:

``` php
ProcessPdfJob::dispatch($jobId);
```

------------------------------------------------------------------------

# 6. Background Processing

## Why Background Jobs?

Large PDFs cannot be processed inside an HTTP request because:

-   Requests timeout
-   Memory spikes
-   Users must see progress

Use:

-   Redis
-   Laravel Queues
-   Laravel Horizon

Worker processes the job asynchronously.

------------------------------------------------------------------------

# 7. PDF Processing Strategy

## Page-by-Page Processing

Never load full PDF into memory.

Algorithm:

1.  Load PDF
2.  Count total pages
3.  Loop page-by-page
4.  Overlay numbering
5.  Save output

Example:

``` php
for ($page = 1; $page <= $totalPages; $page++) {

    processPage($page);

    updateProgress($page);

}
```

------------------------------------------------------------------------

# 8. Line Numbering Algorithm

For each page:

1.  Determine vertical spacing
2.  Estimate line height
3.  Calculate positions

Example:

If page height = 842px

Approx lines = 40

Line numbering:

10 20 30 40

Overlay numbers on left margin.

------------------------------------------------------------------------

# 9. Parallel Processing (Advanced)

For extremely large documents (2000+ pages):

Split job into multiple jobs.

Example:

Job 1 → pages 1--500 Job 2 → pages 501--1000 Job 3 → pages 1001--1500

Then merge results.

Benefits: - 5--10x faster processing - Better CPU usage

------------------------------------------------------------------------

# 10. Progress Tracking

Progress calculation:

progress = (processed_pages / total_pages) \* 100

Stored in database.

Example record:

{ progress: 45, processed_pages: 450, total_pages: 1000 }

------------------------------------------------------------------------

# 11. ETA Calculation

Track average processing time.

Example:

avg_time_per_page = elapsed_time / processed_pages

remaining_time = avg_time_per_page \* pages_remaining

Save eta_seconds.

------------------------------------------------------------------------

# 12. Progress API

Endpoint:

GET /api/job/{id}

Response:

{ progress: 63, processed_pages: 630, total_pages: 1000, eta_seconds:
25, status: "processing" }

------------------------------------------------------------------------

# 13. Frontend (Nuxt) Implementation

## Upload Page

Components:

-   File uploader
-   Configuration panel
-   Upload progress
-   Processing progress bar

------------------------------------------------------------------------

# 14. Upload UI

User selects:

-   PDF file
-   Line interval (default 10)
-   Margin side (left/right)
-   Font size

Example settings:

Line interval: \[10\] Margin: Left Font size: 8pt

------------------------------------------------------------------------

# 15. Frontend Progress Bar

Nuxt polls backend every 2 seconds.

Example:

``` javascript
const progress = ref(0)

setInterval(async () => {

 const res = await $fetch(`/api/job/${jobId}`)

 progress.value = res.progress

},2000)
```

UI:

Progress bar showing:

-   percentage
-   pages processed
-   ETA

Example:

Processing page 450 / 1000 ETA: 20 seconds

------------------------------------------------------------------------

# 16. Handling Very Large Uploads

Large legal PDFs may be 500MB+.

Recommended:

-   Chunked uploads
-   Resumable uploads

Tools:

-   Uppy
-   Tus

Benefits:

-   Upload resumes if connection drops
-   Accurate upload progress

------------------------------------------------------------------------

# 17. File Storage

Options:

Local storage (development)

Production:

-   Amazon S3
-   MinIO

Temporary files deleted after download.

------------------------------------------------------------------------

# 18. Performance Optimization

Key strategies:

1.  Background jobs
2.  Page-by-page processing
3.  Parallel processing
4.  Efficient PDF libraries
5.  Streaming file handling

------------------------------------------------------------------------

# 19. Memory Optimization

PHP settings:

memory_limit = 1024M max_execution_time = 0

But always process pages individually.

------------------------------------------------------------------------

# 20. UX Improvements

Display stages:

Uploading document Analyzing pages Adding line numbers Generating final
PDF Completed

Users feel the system is responsive.

------------------------------------------------------------------------

# 21. Security Considerations

Validate:

-   File type (PDF only)
-   File size limit
-   Virus scanning (optional)

Prevent malicious uploads.

------------------------------------------------------------------------

# 22. Future Features

After MVP:

-   OCR for scanned documents
-   Court pleading templates
-   Auto margin formatting
-   Index generation
-   Batch processing
-   Law firm accounts
-   SaaS billing

------------------------------------------------------------------------

# 23. Deployment Stack

Server:

-   Ubuntu
-   Nginx
-   PHP-FPM
-   Redis
-   Queue workers

Scaling:

-   Multiple workers
-   Horizontal queue scaling

------------------------------------------------------------------------

# 24. Suggested App Names

Possible names:

Line10 PleadLine LegalLine AffidaLine PleadingPaper

Best SaaS name:

Line10
