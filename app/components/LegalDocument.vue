<template>
  <div class="min-h-[calc(100vh-64px)] bg-white">
    <!-- Page header -->
    <div class="border-b border-slate-100 bg-slate-50/60">
      <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p class="text-sm font-semibold uppercase tracking-[0.14em] text-primary-600">Legal</p>
        <h1 class="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{{ title }}</h1>
        <p v-if="updatedAt" class="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
          <UIcon name="i-heroicons-clock" class="h-3.5 w-3.5" />
          Last updated {{ updatedAt }}
        </p>
      </div>
    </div>

    <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <!-- Loading -->
      <div v-if="loading" class="max-w-3xl space-y-4">
        <USkeleton v-for="n in 12" :key="n" class="h-4 rounded" :style="{ width: `${55 + (n % 5) * 9}%` }" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="max-w-3xl rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
        {{ error }}
      </div>

      <!-- Content -->
      <div v-else-if="content" class="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <!-- Table of contents -->
        <nav v-if="toc.length >= 2" class="mb-10 lg:mb-0" aria-label="Table of contents">
          <div class="lg:sticky lg:top-24">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">On this page</p>
            <ul class="mt-3 space-y-1 border-l border-slate-200">
              <li v-for="item in toc" :key="item.id">
                <a
                  :href="`#${item.id}`"
                  class="-ml-px block border-l-2 py-1 pl-4 text-sm transition-colors"
                  :class="activeId === item.id
                    ? 'border-primary-500 font-medium text-primary-700'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'"
                  @click.prevent="scrollToHeading(item.id)"
                >
                  {{ item.text }}
                </a>
              </li>
            </ul>
          </div>
        </nav>
        <div v-else aria-hidden="true" class="hidden lg:block" />

        <!-- Article -->
        <article ref="articleEl" class="legal-content max-w-3xl" v-html="content" />
      </div>

      <!-- Empty -->
      <div v-else class="max-w-3xl rounded-xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm italic text-slate-500">
        {{ title }} has not been published yet.
      </div>

      <!-- Footer links -->
      <div class="mt-14 flex max-w-3xl flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 pt-8 text-sm text-slate-500 lg:ml-[268px]">
        <NuxtLink :to="siblingTo" class="inline-flex items-center gap-1 transition-colors hover:text-primary-600">
          <UIcon name="i-heroicons-document-text" class="h-4 w-4" />
          {{ siblingLabel }}
        </NuxtLink>
        <NuxtLink to="/support" class="inline-flex items-center gap-1 transition-colors hover:text-primary-600">
          <UIcon name="i-heroicons-chat-bubble-left-right" class="h-4 w-4" />
          Contact support
        </NuxtLink>
        <NuxtLink to="/" class="inline-flex items-center gap-1 transition-colors hover:text-primary-600">
          <UIcon name="i-heroicons-arrow-left" class="h-4 w-4" />
          Back to home
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  endpoint: 'terms' | 'privacy'
}>()

const siblingTo = computed(() => (props.endpoint === 'terms' ? '/privacy' : '/terms'))
const siblingLabel = computed(() => (props.endpoint === 'terms' ? 'Privacy Policy' : 'Terms & Conditions'))

const config = useRuntimeConfig()
const apiBase = () => String(config.public.apiBase || 'http://localhost:8000').replace(/\/$/, '')

const content = ref<string | null>(null)
const updatedAt = ref<string | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const articleEl = ref<HTMLElement | null>(null)
const toc = ref<{ id: string; text: string }[]>([])
const activeId = ref<string | null>(null)
let observer: IntersectionObserver | null = null

function buildToc() {
  const el = articleEl.value
  if (!el) return
  const headings = Array.from(el.querySelectorAll('h2'))
  toc.value = headings.map((h, i) => {
    const text = h.textContent?.trim() || `Section ${i + 1}`
    const id = 'section-' + text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    h.id = id
    h.classList.add('scroll-mt-24')
    return { id, text }
  })

  if (toc.value.length >= 2) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) activeId.value = (entry.target as HTMLElement).id
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    headings.forEach(h => observer!.observe(h))
  }
}

function scrollToHeading(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  activeId.value = id
}

onMounted(async () => {
  try {
    const res = await $fetch<{ content: string | null; updated_at: string | null }>(`${apiBase()}/api/legal/${props.endpoint}`)
    content.value = res.content || null
    if (res.updated_at) {
      updatedAt.value = new Date(res.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    await nextTick()
    buildToc()
  } catch {
    error.value = `Could not load ${props.title}. Please try again later.`
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.legal-content {
  color: #334155;
  font-size: 1.0625rem;
  line-height: 1.8;
}

.legal-content :deep(h2) {
  margin-top: 3rem;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.3;
  color: #0f172a;
}

.legal-content :deep(h2:first-child) {
  margin-top: 0;
}

.legal-content :deep(h3) {
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.legal-content :deep(p) {
  margin-bottom: 1.25rem;
}

.legal-content :deep(ul),
.legal-content :deep(ol) {
  margin-bottom: 1.25rem;
  padding-left: 1.5rem;
}

.legal-content :deep(ul) {
  list-style-type: disc;
}

.legal-content :deep(ol) {
  list-style-type: decimal;
}

.legal-content :deep(li) {
  margin-bottom: 0.5rem;
  padding-left: 0.25rem;
}

.legal-content :deep(li::marker) {
  color: var(--ui-primary, #b7791f);
}

.legal-content :deep(a) {
  color: var(--ui-primary, #b7791f);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.legal-content :deep(a:hover) {
  opacity: 0.8;
}

.legal-content :deep(strong) {
  font-weight: 600;
  color: #0f172a;
}

.legal-content :deep(blockquote) {
  margin: 1.5rem 0;
  border-left: 3px solid var(--ui-primary, #b7791f);
  background: #f8fafc;
  padding: 0.75rem 1.25rem;
  border-radius: 0 0.5rem 0.5rem 0;
  font-style: italic;
  color: #475569;
}

.legal-content :deep(hr) {
  margin: 2.5rem 0;
  border-color: #e2e8f0;
}
</style>
