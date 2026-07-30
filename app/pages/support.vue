<template>
  <div class="min-h-[calc(100vh-64px)] bg-white">
    <div class="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">

      <!-- Header -->
      <div class="mb-10">
        <p class="text-sm font-semibold uppercase tracking-[0.14em] text-primary-600">Help</p>
        <h1 class="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Contact Support</h1>
        <p class="mt-3 text-base leading-relaxed text-slate-600">
          Having a problem with a document? Send us a message and link the document so our team can look up all the processing details directly.
        </p>
      </div>

      <!-- Sign-in gate -->
      <div v-if="!auth.isAuthenticated" class="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
        <UIcon name="i-heroicons-lock-closed" class="mx-auto h-12 w-12 text-slate-400" />
        <h2 class="mt-4 text-lg font-semibold text-slate-900">Sign in to contact support</h2>
        <p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
          Support tickets are linked to your account and one of your processed documents, so we can trace exactly what happened — including processing details and payment.
        </p>
        <NuxtLink to="/" class="mt-6 inline-block">
          <UButton color="primary" size="lg" class="rounded-xl font-semibold">
            Go to home &amp; sign in
          </UButton>
        </NuxtLink>
      </div>

      <!-- Success state -->
      <div v-else-if="submitted" class="rounded-2xl border border-green-200 bg-green-50 px-6 py-10 text-center">
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

        <!-- Document selector -->
        <div>
          <label class="mb-1.5 block text-sm font-semibold text-slate-800">
            Related document <span class="text-rose-500">*</span>
          </label>
          <p class="mb-2 text-xs text-slate-500">
            Select the document this ticket is about. Our team will see its processing report, payment, and all page-level details.
          </p>

          <USelect
            v-model="form.jobId"
            :items="jobOptions"
            :loading="jobsLoading"
            placeholder="Select a document…"
            size="lg"
            class="w-full"
          />
          <p v-if="!jobsLoading && jobOptions.length === 0" class="mt-1.5 text-xs text-slate-500">
            No documents found in your account yet. Process a document first, then raise a ticket about it.
          </p>
          <p v-if="jobError" class="mt-1.5 text-xs font-medium text-rose-600">{{ jobError }}</p>
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

        <UAlert v-if="formError" color="error" :title="formError" />

        <UButton
          type="submit"
          color="primary"
          size="lg"
          class="w-full rounded-xl font-semibold"
          :loading="loading"
          :disabled="loading"
        >
          {{ loading ? 'Sending…' : 'Send message' }}
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

interface Job {
  id: string
  filename: string
  status: string
  created_at: string | null
}

const jobs = ref<Job[]>([])
const jobsLoading = ref(false)
const jobError = ref<string | null>(null)

const jobOptions = computed(() =>
  jobs.value.map(j => ({
    label: `${j.filename} — ${j.status}${j.created_at ? ' (' + new Date(j.created_at).toLocaleDateString() + ')' : ''}`,
    value: j.id,
  }))
)

async function loadJobs() {
  if (!auth.token) return
  jobsLoading.value = true
  try {
    const res = await $fetch<{ jobs: Job[] }>(`${apiBase()}/api/me/jobs`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    jobs.value = (res.jobs || []).filter(j => j.status !== 'deleted')
  } catch {
    jobs.value = []
  } finally {
    jobsLoading.value = false
  }
}

const form = reactive({
  email: auth.user?.email || '',
  subject: '',
  message: '',
  jobId: null as string | null,
})

const loading = ref(false)
const formError = ref<string | null>(null)
const submitted = ref(false)
const submittedReference = ref('')
const submittedEmail = ref('')

function resetForm() {
  form.email = auth.user?.email || ''
  form.subject = ''
  form.message = ''
  form.jobId = null
  formError.value = null
  jobError.value = null
  submitted.value = false
  submittedReference.value = ''
  submittedEmail.value = ''
}

async function submit() {
  formError.value = null
  jobError.value = null

  if (!form.jobId) {
    jobError.value = 'Please select the document this ticket is about.'
    return
  }

  loading.value = true

  try {
    const body = new FormData()
    body.append('email', form.email.trim())
    body.append('subject', form.subject.trim())
    body.append('description', form.message.trim())
    body.append('job_id', form.jobId)

    const res = await $fetch<{ ticket_id: string; reference: string; message: string }>(`${apiBase()}/api/support/tickets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}` },
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

watch(() => auth.token, (token) => {
  if (token) loadJobs()
}, { immediate: true })

onMounted(() => {
  if (auth.token) loadJobs()
})
</script>
