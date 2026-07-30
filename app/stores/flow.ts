import { defineStore } from 'pinia'

export type Stage =
  | 'upload'           // no file yet
  | 'config'           // file selected, config panel open
  | 'uploading'
  | 'processing'
  | 'awaiting_payment' // processing done, report ready, awaiting payment
  | 'download'
  | 'error'

export interface AppConfig {
  enable_payment: boolean
  price_per_page: number
  currency: string
  max_file_size_mb: number
  max_pages: number
}

export interface ProcessingReport {
  id: string
  uploaded_pages: number
  successful_pages: number
  low_confidence_pages: number
  failed_pages: number
  payable_pages: number
  unit_price: number
  total_amount: number
  currency: string
  bill_low_confidence_pages: boolean
  created_at: string | null
}

export const useFlowStore = defineStore('flow', {
  state: () => ({
    config: null as AppConfig | null,
    stage: 'upload' as Stage,
    selectedFile: null as File | null,
    jobId: null as string | null,
    paymentDeadlineAt: null as string | null,
    job: null as {
      status: string
      progress: number
      processed_pages: number
      total_pages: number
      eta_seconds: number | null
      error_message: string | null
      error_code: string | null
      payable_pages: number | null
      payment_deadline_at: string | null
      download_url?: string
      report_url?: string | null
      processing_stage?: string | null
      processing_label?: string | null
      processing_message?: string | null
      processing_detail?: string | null
      updated_at?: string | null
    } | null,
    processingReport: null as ProcessingReport | null,
    paymentPolling: false,
    uploadOptions: {
      margin: 'right' as const,
      line_interval: 10 as 5 | 10,
      font_size_pt: 8,
    },
    error: null as string | null,
  }),
  actions: {
    setConfig(config: AppConfig) {
      this.config = config
    },
    setSelectedFile(file: File | null) {
      this.selectedFile = file
      if (file) this.stage = 'config'
      else this.stage = 'upload'
    },
    setUploadOptions(opts: Partial<typeof this.uploadOptions>) {
      Object.assign(this.uploadOptions, opts)
    },
    setJobId(id: string) {
      this.jobId = id
      this.stage = 'processing'
      this.job = null
      this.processingReport = null
    },
    setJob(job: typeof this.job) {
      this.job = job
      if (job?.status === 'completed') this.stage = 'download'
      if (job?.status === 'awaiting_payment') this.stage = 'awaiting_payment'
      if (job?.status === 'failed') {
        this.stage = 'error'
        this.error = job.error_message || 'Processing failed'
      }
    },
    setProcessingReport(report: ProcessingReport) {
      this.processingReport = report
    },
    setError(message: string) {
      this.error = message
      this.stage = 'error'
    },
    reset() {
      this.stage = 'upload'
      this.selectedFile = null
      this.jobId = null
      this.job = null
      this.processingReport = null
      this.paymentDeadlineAt = null
      this.paymentPolling = false
      this.error = null
      this.uploadOptions = {
        margin: 'right',
        line_interval: 10,
        font_size_pt: 8,
      }
    },
  },
})
