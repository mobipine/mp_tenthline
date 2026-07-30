<template>
  <div class="min-h-[calc(100vh-64px)] bg-white">
    <div class="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">

      <div class="mb-10">
        <p class="text-sm font-semibold uppercase tracking-[0.14em] text-primary-600">Legal</p>
        <h1 class="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Terms &amp; Conditions</h1>
        <p v-if="updatedAt" class="mt-2 text-sm text-slate-500">Last updated: {{ updatedAt }}</p>
      </div>

      <div v-if="loading" class="space-y-4">
        <USkeleton v-for="n in 10" :key="n" class="h-4 rounded" :style="{ width: `${60 + (n % 4) * 10}%` }" />
      </div>

      <div
        v-else-if="error"
        class="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700"
      >
        {{ error }}
      </div>

      <div
        v-else-if="content"
        class="prose prose-slate max-w-none text-slate-700 leading-relaxed"
        v-html="content"
      />

      <div v-else class="rounded-xl border border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500 italic">
        Terms &amp; Conditions have not been published yet.
      </div>

      <div class="mt-10 border-t border-slate-200 pt-8 flex flex-wrap gap-4 text-sm text-slate-500">
        <NuxtLink to="/privacy" class="hover:text-primary-600 hover:underline transition-colors">Privacy Policy</NuxtLink>
        <NuxtLink to="/" class="hover:text-primary-600 hover:underline transition-colors">← Back to home</NuxtLink>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Terms & Conditions — TenthLining AI' })

const config = useRuntimeConfig()
const apiBase = () => String(config.public.apiBase || 'http://localhost:8000').replace(/\/$/, '')

const content = ref<string | null>(null)
const updatedAt = ref<string | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const res = await $fetch<{ content: string | null; updated_at: string | null }>(`${apiBase()}/api/legal/terms`)
    content.value = res.content || null
    if (res.updated_at) {
      updatedAt.value = new Date(res.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }
  } catch {
    error.value = 'Could not load Terms & Conditions. Please try again later.'
  } finally {
    loading.value = false
  }
})
</script>
