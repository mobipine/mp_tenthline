import { defineStore } from 'pinia'

export type Stage =
  | 'upload'      // no file yet
  | 'config'      // file selected, offcanvas open (config panel)
  | 'payment'     // user clicked Next, payment panel (email, phone, pay)
  | 'uploading'
  | 'processing'
  | 'download'
  | 'error'

export interface AppConfig {
  enable_payment: boolean
  price_per_page: number
  currency: string
  max_file_size_mb: number
  max_pages: number
}

export const useFlowStore = defineStore('flow', {
  state: () => ({
    config: null as AppConfig | null,
    stage: 'upload' as Stage,
    paymentReference: null as string | null,
    paymentPolling: false,
    selectedFile: null as File | null,
    jobId: null as string | null,
    job: null as {
      status: string
      progress: number
      processed_pages: number
      total_pages: number
      eta_seconds: number | null
      error_message: string | null
      download_url?: string
      processing_stage?: string | null
      processing_label?: string | null
      processing_message?: string | null
      processing_detail?: string | null
      updated_at?: string | null
    } | null,
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
    setPaymentReference(ref: string) {
      this.paymentReference = ref
    },
    setSelectedFile(file: File | null) {
      this.selectedFile = file
      if (file) this.stage = 'config'
      else this.stage = 'upload'
    },
    setUploadOptions(opts: Partial<typeof this.uploadOptions>) {
      Object.assign(this.uploadOptions, opts)
    },
    goToPaymentStep() {
      this.stage = 'payment'
    },
    setJobId(id: string) {
      this.jobId = id
      this.stage = 'processing'
      this.job = null
    },
    setJob(job: typeof this.job) {
      this.job = job
      if (job?.status === 'completed') this.stage = 'download'
      if (job?.status === 'failed') {
        this.stage = 'error'
        this.error = job.error_message || 'Processing failed'
      }
    },
    setError(message: string) {
      this.error = message
      this.stage = 'error'
    },
    reset() {
      this.stage = 'upload'
      this.paymentReference = null
      this.selectedFile = null
      this.jobId = null
      this.job = null
      this.error = null
      this.uploadOptions = {
        margin: 'right',
        line_interval: 10,
        font_size_pt: 8,
      }
    },
  },
})
