<template>
  <div class="min-h-[calc(100vh-64px)] bg-white">
    <div class="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">

      <!-- Header -->
      <div class="mb-10">
        <p class="text-sm font-semibold uppercase tracking-[0.14em] text-primary-600">Help</p>
        <h1 class="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Contact Support</h1>
        <p class="mt-3 text-base leading-relaxed text-slate-600">
          Having a problem with your document? Send us a message and attach your original PDF if needed — our team reviews every ticket.
        </p>
      </div>

      <!-- Success state -->
      <div v-if="submitted" class="rounded-2xl border border-green-200 bg-green-50 px-6 py-10 text-center">
        <UIcon name="i-heroicons-check-circle" class="mx-auto h-14 w-14 text-green-500" />
        <h2 class="mt-4 text-xl font-semibold text-green-900">Message sent!</h2>
        <p class="mt-2 text-sm text-green-700">
          We received your ticket ({{ submittedReference }}) and will follow up at <strong>{{ submittedEmail }}</strong>.
        </p>
        <div class="mt-6 flex flex-wrap justify-center gap-3">
          <UButton color="primary" @click="resetForm">Send another message</UButton>
          <NuxtLink to="/">
            <UButton variant="soft" color="gray">Back to home</UButton>
          </NuxtLink>
        </div>
      </div>

      <!-- Form -->
      <form v-else class="space-y-6" @submit.prevent="submit">

        <div>
          <label for="support-email" class="mb-1.5 block text-sm font-semibold text-slate-800">Your email <span class="text-rose-500">*</span></label>
          <UInput
            id="support-email"
            v-model="form.email"
            type="email"
            size="lg"
            placeholder="you@example.com"
            required
            class="w-full"
          />
        </div>

        <div>
          <label for="support-subject" class="mb-1.5 block text-sm font-semibold text-slate-800">Subject <span class="text-rose-500">*</span></label>
          <UInput
            id="support-subject"
            v-model="form.subject"
            size="lg"
            placeholder="e.g. Line numbers are misaligned on page 3"
            required
            class="w-full"
          />
        </div>

        <div>
          <label for="support-message" class="mb-1.5 block text-sm font-semibold text-slate-800">Message <span class="text-rose-500">*</span></label>
          <UTextarea
            id="support-message"
            v-model="form.message"
            :rows="6"
            placeholder="Describe the issue in as much detail as possible. Include which pages are affected, what you expected to happen, and what actually happened."
            required
            class="w-full"
          />
          <p class="mt-1 text-xs text-slate-500">{{ form.message.length }}/5000 characters</p>
        </div>

        <!-- File attachment -->
        <div>
          <label class="mb-1.5 block text-sm font-semibold text-slate-800">Attach your document <span class="text-slate-400 font-normal">(optional)</span></label>
          <p class="mb-2 text-xs text-slate-500">Upload your original PDF or any relevant file. Max 20 MB. Accepted: PDF, images, Word docs.</p>

          <div
            class="relative rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors"
            :class="fileDragging ? 'border-primary-400 bg-primary-50' : ''"
            @dragenter.prevent="fileDragging = true"
            @dragover.prevent="fileDragging = true"
            @dragleave.prevent="fileDragging = false"
            @drop.prevent="onFileDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
              class="sr-only"
              @change="onFileChange"
            >

            <div v-if="!form.file" class="flex flex-col items-center gap-2 p-6 text-center">
              <UIcon name="i-heroicons-paper-clip" class="h-8 w-8 text-slate-400" />
              <p class="text-sm text-slate-600">
                <button type="button" class="font-semibold text-primary-600 hover:text-primary-700 hover:underline" @click="fileInput?.click()">
                  Choose file
                </button>
                or drag and drop here
              </p>
              <p class="text-xs text-slate-400">PDF, images, DOC/DOCX up to 20 MB</p>
            </div>

            <div v-else class="flex items-center gap-3 p-4">
              <UIcon name="i-heroicons-document-text" class="h-8 w-8 shrink-0 text-primary-500" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-slate-900">{{ form.file.name }}</p>
                <p class="text-xs text-slate-500">{{ formatFileSize(form.file.size) }}</p>
              </div>
              <button
                type="button"
                class="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                aria-label="Remove file"
                @click="removeFile"
              >
                <UIcon name="i-heroicons-x-mark" class="h-4 w-4" />
              </button>
            </div>
          </div>

          <p v-if="fileError" class="mt-1.5 text-xs font-medium text-rose-600">{{ fileError }}</p>
        </div>

        <UAlert v-if="formError" color="error" :title="formError" />

        <UButton
          type="submit"
          color="primary"
          size="lg"
          class="w-full rounded-xl font-semibold"
          :loading="loading"
          :disabled="loading"
        >
          {{ loading ? 'Sending...' : 'Send message' }}
        </UButton>

        <p class="text-center text-xs text-slate-400">
          By submitting you agree to our
          <NuxtLink to="/terms" class="underline hover:text-primary-600">Terms</NuxtLink>
          and
          <NuxtLink to="/privacy" class="underline hover:text-primary-600">Privacy Policy</NuxtLink>.
        </p>

      </form>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

useHead({ title: 'Contact Support — TenthLining AI' })

const config = useRuntimeConfig()
const auth = useAuthStore()
const apiBase = () => String(config.public.apiBase || 'http://localhost:8000').replace(/\/$/, '')

const fileInput = ref<HTMLInputElement | null>(null)
const fileDragging = ref(false)
const fileError = ref<string | null>(null)

const form = reactive({
  email: auth.user?.email || '',
  subject: '',
  message: '',
  file: null as File | null,
})

const loading = ref(false)
const formError = ref<string | null>(null)
const submitted = ref(false)
const submittedReference = ref('')
const submittedEmail = ref('')

const MAX_FILE_BYTES = 20 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) return `File is too large (${formatFileSize(file.size)}). Maximum is 20 MB.`
  const ext = file.name.split('.').pop()?.toLowerCase()
  const allowedExts = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'doc', 'docx']
  if (!allowedExts.includes(ext || '')) return 'File type not supported. Use PDF, image, or Word document.'
  return null
}

function setFile(file: File) {
  fileError.value = null
  const err = validateFile(file)
  if (err) {
    fileError.value = err
    return
  }
  form.file = file
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) setFile(input.files[0])
}

function onFileDrop(e: DragEvent) {
  fileDragging.value = false
  if (e.dataTransfer?.files?.[0]) setFile(e.dataTransfer.files[0])
}

function removeFile() {
  form.file = null
  fileError.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function resetForm() {
  form.email = auth.user?.email || ''
  form.subject = ''
  form.message = ''
  form.file = null
  formError.value = null
  fileError.value = null
  submitted.value = false
  submittedReference.value = ''
  submittedEmail.value = ''
}

async function submit() {
  formError.value = null
  loading.value = true

  try {
    const body = new FormData()
    body.append('email', form.email.trim())
    body.append('subject', form.subject.trim())
    body.append('description', form.message.trim())
    if (form.file) body.append('attachment', form.file)

    const headers: Record<string, string> = {}
    if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`

    const res = await $fetch<{ ticket_id: string; reference: string; message: string }>(`${apiBase()}/api/support/tickets`, {
      method: 'POST',
      headers,
      body,
    })

    submittedReference.value = res.reference
    submittedEmail.value = form.email.trim()
    submitted.value = true
  } catch (e: any) {
    const messages = e?.data?.errors
      ? Object.values(e.data.errors).flat().join(' ')
      : e?.data?.message || 'Could not send your message. Please try again.'
    formError.value = messages
  } finally {
    loading.value = false
  }
}

watch(() => auth.user, (user) => {
  if (user?.email && !form.email) form.email = user.email
})
</script>
