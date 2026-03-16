<template>
  <div class="min-h-screen  text-slate-900">
    <header class="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur">
    <!-- <header class="sticky top-0 z-40 border-b border-slate-200/90 bg-transparent/95 backdrop-blur"> -->
      <div class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10 ">
        <NuxtLink to="/" class="flex items-center gap-3 h-full">
          <!-- <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white shadow-md shadow-primary-500/25">
            10
          </span> -->
          <div class="leading-tight h-full">
            <!-- <p class="text-sm lg:text-[16px] font-semibold tracking-tight text-slate-900">LegalLine</p> -->
            <!-- <p class="text-sm lg:text-[16px] font-medium uppercase tracking-[0.12em] text-slate-500">Tenth Lining</p> -->
             <img
              :src="brandLogo"
              alt="Tenth Lining logo"
              class="pointer-events-none  h-full"
            >
          </div>
        </NuxtLink>

        <div class="flex items-center gap-2 sm:gap-3">
          <template v-if="auth.isAuthenticated && auth.user">
            <span class="hidden rounded-full bg-slate-100 px-3 py-1 text-[14px] font-semibold text-slate-700 sm:inline-flex">
              {{ auth.user.email }}
            </span>
            <UButton size="lg" variant="soft" color="primary" class="rounded-lg text-sm lg:text-[16px]" @click="openHistory">
              My documents
            </UButton>
            <UButton size="lg" variant="ghost" color="gray" class="rounded-lg text-sm lg:text-[16px]" @click="logout">
              Logout
            </UButton>
          </template>
          <template v-else>
            <UButton size="lg" variant="ghost" color="gray" class="rounded-lg text-sm lg:text-[16px]" @click="openAuthModal('login')">
              Login
            </UButton>
            <UButton size="lg" color="primary" class="rounded-lg text-sm lg:text-[16px]" @click="openAuthModal('register')">
              Sign up
            </UButton>
          </template>
        </div>
      </div>
    </header>

  

    <main class="relative h-[calc(100vh-60px)] overflow-hidden">
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
      <div class="ambient-lines" />
      <!-- <div class="ambient-orb ambient-orb-a" />
      <div class="ambient-orb ambient-orb-b" /> -->
    </div>

    <div class="flex h-full flex-col overflow-hidden">
      <!-- Flex row: content area + side panel -->
      <div class="relative flex flex-1 overflow-hidden">

        <!-- LEFT: Main content -->
        <section
          class="min-w-0 flex-1 overflow-y-auto px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:px-10 lg:pt-14 transition-[max-width,padding] duration-300 ease-out"
        >
          <div class="relative mx-auto max-w-3xl text-center animate-fade-up" :class="flowPanelOpen ? 'max-w-full' : 'max-w-3xl'">
            
            <p class="text-sm font-semibold uppercase tracking-[0.16em] text-primary-600">Tenth Lining</p>
            <h1 class="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Automatically apply tenth-line referencing to legal PDFs.
            </h1>
            <p class="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Upload one PDF, configure numbering, complete payment, and download your file from the same flow.
            </p>
          </div>

          <div class="mt-12">
            <input
              id="pdf-upload-input"
              ref="fileInput"
              type="file"
              accept=".pdf,application/pdf"
              class="sr-only"
              @change="onFileSelect"
            >
            <!-- Drop zone -->
            <div
              v-if="!flow.selectedFile"
              class="dropzone-card cursor-pointer mx-auto max-w-3xl rounded-3xl border-2 border-dashed p-8 text-center sm:p-12"
              :class="isDragging ? 'dragging' : ''"
              role="button"
              tabindex="0"
              @click="openFilePicker"
              @keydown.enter.prevent="openFilePicker"
              @keydown.space.prevent="openFilePicker"
              @dragenter.prevent="isDragging = true"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent.stop="onDrop"
            >
              <div class="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <UIcon name="i-heroicons-document-arrow-up" class="h-8 w-8" />
              </div>
              <h2 class="mt-5 text-2xl font-semibold text-slate-900">Drop your PDF here</h2>
              <p class="mt-2 text-sm text-slate-500 sm:text-base">
                Drag and drop or click to choose your document.
              </p>
              <div class="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <UButton
                  size="xl"
                  color="primary"
                  class="min-w-56 rounded-xl px-10 py-3 text-base font-semibold shadow-lg shadow-primary-500/25 flex justify-center items-center gap-2"
                  @click.stop="openFilePicker"
                >
                  Select PDF file
                </UButton>
              </div>
              <p class="mt-4 text-sm text-slate-500">or drop PDF here</p>
              <div class="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-600">
                <span class="rounded-full border border-slate-200 bg-white px-3 py-1">PDF only</span>
                <span class="rounded-full border border-slate-200 bg-white px-3 py-1">Payment required</span>
                <span class="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Max {{ flow.config?.max_file_size_mb ?? 500 }} MB
                </span>
              </div>
              <p v-if="panelError" class="mt-5 text-sm font-medium text-rose-600">{{ panelError }}</p>
            </div>

            <!-- File selected card -->
            <div v-else class="flex gap-6 flex-col lg:flex-row items-center justify-center animate-fade-up">
              <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.45)] sm:p-8 animate-fade-up ">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p class="text-sm font-semibold uppercase tracking-[0.12em] text-primary-600">File Ready</p>
                    <h2 class="mt-2 text-sm lg:text-xl font-semibold text-slate-900 wrap-break-word">{{ flow.selectedFile.name }}</h2>
                    <p class="mt-1 text-sm text-slate-500">{{ formatSize(flow.selectedFile.size) }}</p>
                  </div>
                  <UBadge color="primary" variant="soft" class="rounded-full px-3 py-1 text-xs font-semibold">
                    1 PDF selected
                  </UBadge>
                </div>
                <div class="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p class="text-sm leading-relaxed text-slate-600">
                    Continue in the right panel to pay and complete the process
                  </p>
                  <div
                    v-if="isLargeSelectedFile"
                    class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                  >
                    This is a larger file, so it may take a little longer to upload. Keep this page open and we'll automatically start the next step once it's ready.
                  </div>
                  <div class="mt-4 flex flex-wrap gap-3">
                    <UButton color="primary" class="rounded-xl px-5 font-semibold" @click="openFlowPanel('config')">
                      Open setup panel
                    </UButton>
                    <!-- <UButton variant="soft" color="primary" class="rounded-xl px-5 font-semibold" @click="openFlowPanel('payment')">
                      Go to payment
                    </UButton> -->
                    <UButton variant="ghost" color="gray" class="rounded-xl px-5" @click="clearFile">
                      Remove file
                    </UButton>
                  </div>
                </div>
              </div>

              <div class="rounded-3xl border border-slate-200/80 bg-white/80 p-6 backdrop-blur sm:p-8 animate-fade-up-delay">
              <h3 class="text-lg font-semibold text-slate-900">How it works</h3>
              <ol class="mt-4 space-y-4 text-sm text-slate-600">
                <li class="flex gap-3">
                  <span class="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">1</span>
                  <span>Upload your PDF</span>
                </li>
                <li class="flex gap-3">
                  <span class="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">2</span>
                  <span>Pay using M-Pesa</span>
                </li>
                <li class="flex gap-3">
                  <span class="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">3</span>
                  <span>Download your processed PDF</span>
                </li>
              </ol>
            </div>
            </div>
          </div>
        </section>

        <!-- RIGHT: Responsive flow panel (docked desktop, overlay mobile) -->
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="translate-x-10 opacity-0 lg:translate-x-6"
          enter-to-class="translate-x-0 opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="translate-x-0 opacity-100"
          leave-to-class="translate-x-10 opacity-0 lg:translate-x-6"
        >
          <div
            v-if="flowPanelOpen"
            class="pointer-events-none absolute inset-0 z-30 flex justify-end lg:static lg:inset-auto lg:z-auto lg:shrink-0 lg:pointer-events-auto"
          >
            <button
              type="button"
              class="pointer-events-auto absolute inset-0 bg-slate-900/30 backdrop-blur-[1px] lg:hidden"
              aria-label="Close setup panel"
              @click="flowPanelOpen = false"
            />

            <aside
              class="panel-surface pointer-events-auto relative z-10 flex h-full w-full max-w-full flex-col overflow-hidden border-l border-slate-200 bg-white shadow-[-20px_0_45px_-25px_rgba(15,23,42,0.35)] sm:max-w-[460px] lg:w-[480px] lg:max-w-none lg:shadow-[-18px_0_36px_-26px_rgba(15,23,42,0.24)]"
            >
            <!-- Panel Header -->
            <div class="border-b border-slate-200 p-6 sm:p-8 shrink-0">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.12em] text-primary-600">
                    Step {{ stepNumber }} of 3
                  </p>
                  <h3 class="mt-1 text-xl font-semibold text-slate-900">{{ flowPanelHeadline }}</h3>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex min-w-[150px] items-center justify-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700"
                  >
                    {{ flow.stage === 'uploading' ? 'Uploading file' : flow.stage === 'download' ? 'Completed' : paymentConfirmed ? 'Payment confirmed' : paymentIsFree ? 'No payment required' : 'Payment required' }}
                  </span>
                  <!-- Close button -->
                  <button
                    class="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    @click="flowPanelOpen = false"
                  >
                    <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div v-if="flow.selectedFile" class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-slate-800">{{ flow.selectedFile.name }}</p>
                    <p class="mt-0.5 text-xs text-slate-500">{{ formatSize(flow.selectedFile.size) }}</p>
                  </div>
                  <UIcon name="i-heroicons-document-text" class="h-6 w-6 text-slate-500" />
                </div>
              </div>
            </div>

            <!-- Panel Body -->
            <div class="flex-1 overflow-y-auto p-6 sm:p-8">
              <Transition name="panel-slide" mode="out-in">
                <!-- Step 1: Config (options fixed: right margin, font 8pt; line interval from domain) -->
                <div v-if="flowStep === 'config'" key="config" class="space-y-6">
                  <p class="text-sm leading-relaxed text-slate-600">
                    Line numbers are added on the right margin. Review the quote below and {{ paymentIsFree ? 'start processing.' : 'proceed to payment.' }}
                  </p>
                  <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-1.5">
                    <p>
                      Pages detected:
                      <strong class="text-slate-900">{{ paymentPageCount > 0 ? paymentPageCount : quoteLoading ? 'Calculating...' : '--' }}</strong>
                    </p>
                    <p>
                      Price per page:
                      <strong class="text-slate-900">{{ paymentUnitPriceLabel }}</strong>
                    </p>
                    <p>
                      Amount due:
                      <strong class="text-slate-900">{{ paymentAmountLabel }}</strong>
                    </p>
                  </div>
                  <UAlert v-if="quoteError" color="error" :title="quoteError" />
                  <UAlert
                    v-else-if="quoteLoading"
                    color="primary"
                    title="Reading PDF pages..."
                  />
                  <div
                    v-if="isLargeSelectedFile"
                    class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                  >
                    This file is a bit large, so the upload may take a few minutes. Keep this page open and we'll continue automatically as soon as it's done.
                  </div>
                  <div
                    v-if="paymentPageCount > 0 && !quoteError && !quoteLoading"
                    class="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-primary-800"
                  >
                    <div class="flex items-start gap-2">
                      <UIcon name="i-heroicons-check-circle" class="mt-0.5 h-5 w-5 text-primary-600" />
                      <div>
                        <p class="text-sm font-semibold">{{ paymentPageCount }} pages detected</p>
                        <p class="text-sm text-primary-700/90">{{ paymentIsFree ? 'No payment is required for this document.' : "We'll charge based on " + paymentPageCount + ' pages.' }}</p>
                      </div>
                    </div>
                  </div>
                  <div v-else-if="!quoteError && !quoteLoading" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Select a PDF to compute page count and pricing.
                  </div>
                </div>

                <!-- Step 2: Payment -->
                <div v-else-if="flowStep === 'payment'" key="payment" class="space-y-6">
                  <UButton variant="ghost" color="gray" size="sm" icon="i-heroicons-arrow-left" class="-ml-2" @click="goToConfigStep">
                    Back to options
                  </UButton>
                  <UAlert
                    color="primary"
                    icon="i-heroicons-device-phone-mobile"
                    :title="paymentEnabled ? 'M-Pesa payment required' : 'Payment simulation mode'"
                    :description="paymentEnabled
                      ? 'Enter email and phone, then approve the STK prompt on your phone. Processing starts automatically once payment is confirmed.'
                      : 'Payments are currently disabled in settings. A successful payment will be simulated after ~5 seconds.'"
                  />
                  <div
                    v-if="paymentAccountNotice"
                    class="rounded-2xl border border-sky-200 bg-sky-50/90 px-4 py-3 text-sm text-sky-800"
                  >
                    {{ paymentAccountNotice }}
                  </div>
                  <UFormField label="Email address">
                    <UInput
                      v-model="paymentEmail"
                      type="email"
                      size="lg"
                      placeholder="you@example.com"
                      class="w-full"
                      :disabled="flow.paymentPolling || paymentConfirmed"
                    />
                  </UFormField>
                  <UFormField label="M-Pesa phone number">
                    <UInput
                      v-model="paymentPhone"
                      type="tel"
                      size="lg"
                      placeholder="254712345678 or 0712345678"
                      class="w-full"
                      :disabled="flow.paymentPolling || paymentConfirmed"
                    />
                  </UFormField>
                  <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Amount payable:
                    <strong class="text-slate-900">{{ paymentAmountLabel }}</strong>
                  </div>
                  <p v-if="paymentSimulationMode" class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                    enable_payment is OFF. Successful payment is simulated after ~5 seconds.
                  </p>
                  <UAlert v-if="panelError" color="error" :title="panelError" />
                  <div v-if="flow.paymentPolling" class="rounded-2xl border border-primary-200 bg-primary-50 p-4">
                    <div class="flex items-center gap-3 text-primary-700">
                      <UIcon name="i-heroicons-arrow-path" class="h-5 w-5 animate-spin" />
                      <p class="text-sm font-medium">Awaiting customer payment...</p>
                    </div>
                    <p class="mt-2 text-sm text-primary-700/80">
                      {{ paymentStatusMessage || 'Check your phone and complete the M-Pesa prompt.' }}
                    </p>
                  </div>
                  <div v-if="paymentConfirmed" class="rounded-2xl border border-primary-200 bg-primary-50 p-4">
                    <div class="flex items-center gap-2 text-primary-700">
                      <UIcon name="i-heroicons-check-circle" class="h-5 w-5" />
                      <p class="text-sm font-semibold">Payment confirmed</p>
                    </div>
                    <p class="mt-1 text-sm text-primary-700/90">
                      Payment received. Starting document processing automatically...
                    </p>
                  </div>
                </div>

                <!-- Step 3: Progress / Download / Error -->
                <div v-else key="progress" class="space-y-6">
                  <UButton
                    v-if="flow.stage !== 'processing' && flow.stage !== 'uploading'"
                    variant="ghost"
                    color="gray"
                    size="sm"
                    icon="i-heroicons-arrow-left"
                    class="-ml-2"
                    @click="goToPaymentStep"
                  >
                    {{ paymentIsFree ? 'Back to quote' : 'Back to payment' }}
                  </UButton>
                  <div v-if="flow.stage === 'uploading'" class="space-y-4">
                    <UAlert
                      color="primary"
                      icon="i-heroicons-arrow-up-tray"
                      :title="uploadProgressPercentage >= 100 ? 'Finalizing upload' : 'Uploading your document'"
                      :description="uploadProgressPercentage >= 100 ? 'Your PDF has been sent. We are creating the processing job now.' : 'Stay on this page while the upload finishes. Processing will begin automatically.'"
                    />
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div class="mb-3 flex items-center justify-between gap-3">
                        <p class="text-sm font-semibold text-slate-900">Uploading PDF..</p>
                        <span class="text-sm font-semibold text-primary-700">{{ uploadProgressPercentage }}%</span>
                      </div>
                      <UProgress :model-value="uploadProgressPercentage" :max="100" size="xl" />
                      <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span class="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                          {{ uploadTransferredLabel }}
                        </span>
                        <span class="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                          {{ uploadSpeedLabel }}
                        </span>
                        <span class="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                          {{ uploadEtaLabel }}
                        </span>
                      </div>
                      <p
                        v-if="isLargeSelectedFile"
                        class="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
                      >
                        Bigger files can take a little longer to upload. Thanks for waiting - we'll begin processing as soon as the upload finishes.
                      </p>
                    </div>
                  </div>
                  <div v-else-if="flow.stage === 'processing'" class="space-y-4">
                    <UAlert
                      color="primary"
                      icon="i-heroicons-sparkles"
                      title="Your document is being processed"
                      description=""
                    />
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div class="mb-3 flex items-center justify-between gap-3">
                        <p class="text-sm font-semibold text-slate-900">Adding line numbers</p>
                        <span class="text-sm font-semibold text-primary-700">{{ progressPercentage }}%</span>
                      </div>
                      <UProgress :model-value="progressPercentage" :max="100" size="xl" />
                      <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span class="rounded-full bg-white px-2.5 py-1 border border-slate-200">
                          Page {{ flow.job?.processed_pages ?? 0 }} / {{ flow.job?.total_pages ?? 0 }}
                        </span>
                        <span class="rounded-full bg-white px-2.5 py-1 border border-slate-200" v-if="flow.job?.eta_seconds !== null">
                          ETA {{ formatEta(flow.job?.eta_seconds) }}
                        </span>
                        <span class="rounded-full bg-white px-2.5 py-1 border border-slate-200" v-else>
                          ETA calculating...
                        </span>
                      </div>
                    </div>
                  </div>
                  <div v-else-if="flow.stage === 'download'" class="rounded-2xl border border-primary-200 bg-primary-50 p-6 text-center">
                    <UIcon name="i-heroicons-check-circle" class="mx-auto h-12 w-12 text-primary-600" />
                    <p class="mt-3 text-lg font-semibold text-slate-900">Document ready</p>
                    <p class="mt-1 text-sm text-slate-600">Download your PDF or process another document.</p>
                    <div class="mt-5 flex flex-col gap-3">
                      <UButton
                        size="lg"
                        color="primary"
                        class="rounded-xl"
                        :loading="downloadingCurrentJob"
                        @click="downloadCurrentJob"
                      >
                        Download PDF
                      </UButton>
                      <UButton size="lg" variant="soft" color="primary" class="rounded-xl" @click="resetForAnother">
                        Process another
                      </UButton>
                    </div>
                  </div>
                  <div v-else-if="flow.stage === 'error'" class="space-y-4">
                    <UAlert color="error" :title="flow.error || 'Processing failed.'" />
                    <UButton size="lg" variant="soft" color="primary" class="rounded-xl" @click="goToPaymentStep">
                      {{ paymentIsFree ? 'Back to quote' : 'Back to payment' }}
                    </UButton>
                  </div>
                  <div v-else class="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    Start processing to see realtime progress here.
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Panel Footer -->
            <div class="border-t border-slate-200 bg-white p-6 sm:p-8 shrink-0">
              <Transition name="panel-fade" mode="out-in">
                <div v-if="flowStep === 'config'" key="config-footer" class="space-y-3">
                  <UButton block size="lg" color="primary" class="rounded-xl py-3 text-base font-semibold" @click="goToPaymentStep">
                    {{ paymentIsFree ? 'Start processing' : 'Next: Payment' }}
                  </UButton>
                </div>
                <div v-else-if="flowStep === 'payment'" key="payment-footer" class="space-y-3">
                  <UButton
                    block
                    size="lg"
                    color="primary"
                    class="rounded-xl py-3 text-base font-semibold"
                    :loading="flow.paymentPolling || uploading"
                    :disabled="quoteLoading || (flow.paymentPolling || uploading) || (!paymentConfirmed && (!paymentPhone.trim() || !paymentEmail.trim() || paymentPageCount < 1))"
                    @click="handlePaymentPrimaryAction"
                  >
                    {{
                      flow.paymentPolling
                        ? 'Waiting for payment confirmation...'
                        : uploading
                          ? 'Uploading document...'
                          : paymentConfirmed
                            ? 'Start processing'
                            : paymentSimulationMode
                              ? 'Pay (simulation mode)'
                              : 'Pay with M-Pesa'
                    }}
                  </UButton>
                  <p class="text-center text-xs text-slate-500">
                    {{ paymentIsFree ? 'No payment required. Processing starts immediately once you continue.' : 'Processing begins automatically after payment confirmation.' }}
                  </p>
                </div>
                <div v-else key="progress-footer" class="space-y-3">
                  <UButton
                    block
                    size="lg"
                    color="primary"
                    variant="soft"
                    class="rounded-xl py-3 text-base font-semibold"
                    :disabled="flow.stage === 'processing'"
                    @click="openHistory"
                  >
                    View my previous jobs
                  </UButton>
                </div>
              </Transition>
            </div>
            </aside>
          </div>
        </Transition>

      </div>
    </div>
  </main>


    <UModal :open="authModalOpen" @update:open="authModalOpen = $event">
      <template #content>
        <div class="p-6 sm:p-8">
          <div class="mx-auto w-full max-w-md">
            <div class="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 class="text-2xl font-semibold tracking-tight text-slate-900">
                  {{ authTitle }}
                </h3>
                <p class="mt-1 text-sm text-slate-600">{{ authSubtitle }}</p>
              </div>
              <UButton
                icon="i-heroicons-x-mark"
                color="gray"
                variant="ghost"
                size="sm"
                class="-mr-1 -mt-1 rounded-lg"
                aria-label="Close authentication modal"
                @click="authModalOpen = false"
              />
            </div>

            <Transition name="auth-mode" mode="out-in">
              <div :key="`${authMode}-${authStep}`" class="space-y-4">
                <div
                  v-if="authMessage"
                  class="rounded-xl border border-primary-200 bg-primary-50/90 px-4 py-3 text-sm text-primary-800"
                >
                  {{ authMessage }}
                </div>

                <div
                  v-if="authError"
                  class="rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700"
                >
                  {{ authError }}
                </div>

                <template v-if="authStep === 'email'">
                  <UFormField label="Email address">
                    <UInput v-model="authEmail" type="email" size="lg" class="w-full" placeholder="you@example.com" />
                  </UFormField>

                  <UButton
                    block
                    size="lg"
                    color="primary"
                    class="rounded-xl py-3 text-base font-semibold shadow-sm"
                    :loading="authLoading"
                    @click="requestAuthOtp"
                  >
                    Continue
                  </UButton>

                  <div class="mt-4 text-sm text-center text-slate-600">
                    <template v-if="authMode === 'login'">
                      Don't have an account?
                      <button
                        type="button"
                        class="cursor-pointer font-medium text-primary-700 transition hover:text-primary-800 hover:underline"
                        @click="openAuthModal('register')"
                      >
                        Sign up
                      </button>
                    </template>
                    <template v-else>
                      Already have an account?
                      <button
                        type="button"
                        class="cursor-pointer font-medium text-primary-700 transition hover:text-primary-800 hover:underline"
                        @click="openAuthModal('login')"
                      >
                        Sign in
                      </button>
                    </template>
                  </div>
                </template>

                <template v-else>
                  <p class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                    Enter the 6-digit code sent to <strong>{{ authEmail }}</strong>.
                    <span v-if="authOtpExpiresIn"> Code expires in about {{ Math.ceil(authOtpExpiresIn / 60) }} minutes.</span>
                  </p>

                  <UFormField label="One-time code">
                    <UInput v-model="authOtpCode" size="lg" class="w-full" placeholder="123456" maxlength="6" />
                  </UFormField>

                  <UButton
                    block
                    size="lg"
                    color="primary"
                    class="rounded-xl py-3 text-base font-semibold shadow-sm"
                    :loading="authLoading"
                    @click="verifyAuthOtp"
                  >
                    Verify and continue
                  </UButton>

                  <div class="mt-3 flex items-center justify-between text-sm">
                    <button
                      type="button"
                      class="cursor-pointer font-medium text-slate-600 transition hover:text-slate-900 hover:underline"
                      @click="authStep = 'email'"
                    >
                      Change email
                    </button>
                    <button
                      type="button"
                      class="cursor-pointer font-medium text-primary-700 transition hover:text-primary-800 hover:underline"
                      :disabled="authLoading"
                      @click="requestAuthOtp"
                    >
                      Resend code
                    </button>
                  </div>
                </template>
              </div>
            </Transition>
          </div>
        </div>
      </template>
    </UModal>

    <USlideover :open="historyOpen" side="right" title="My previous jobs" class="!w-full sm:!max-w-xl" @update:open="historyOpen = $event">
      <template #content>
        <div class="flex h-full flex-col bg-white">
          <div class="border-b border-slate-200 p-6 sm:p-8">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm text-slate-600">
                {{ auth.user?.email || 'Signed in user' }}
              </p>
              <UButton size="sm" variant="soft" color="primary" :loading="historyLoading" @click="loadHistory">
                Refresh
              </UButton>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-6 sm:p-8">
            <div v-if="historyLoading" class="space-y-3">
              <USkeleton v-for="n in 3" :key="n" class="h-24 w-full rounded-xl" />
            </div>

            <div v-else-if="historyJobs.length === 0" class="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              No jobs yet. Process your first document to see history.
            </div>

            <div v-else class="space-y-3">
              <div v-for="job in historyJobs" :key="job.id" class="rounded-xl border border-slate-200 bg-white p-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-slate-900">{{ job.filename }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ formatDate(job.created_at) }}</p>
                  </div>
                  <span
                    class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize"
                    :class="statusBadgeClass(job.status)"
                  >
                    {{ job.status }}
                  </span>
                </div>

                <p class="mt-2 text-xs text-slate-600">
                  Progress: {{ job.progress }}%
                  <span v-if="job.total_pages"> · {{ job.processed_pages }}/{{ job.total_pages }} pages</span>
                </p>
                <p v-if="job.status === 'deleted'" class="mt-2 text-xs font-medium text-amber-700">
                  Files were deleted after 24 hours retention.
                </p>

                <UButton
                  v-if="job.download_url"
                  size="sm"
                  color="primary"
                  variant="soft"
                  class="mt-3 rounded-lg"
                  :loading="historyDownloadingJobId === job.id"
                  @click="downloadHistoryJob(job)"
                >
                  Download
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
useHead({
  // title: 'Automatically apply tenth-line referencing to legal PDFs.'
  title: 'TenthLining AI - Add tenth-line referencing to legal PDFs automatically',
})

import { useFlowStore, type AppConfig } from '~/stores/flow'
import { useAuthStore, type AuthUser } from '~/stores/auth'
import brandLogo from '~/assets/images/3.png'

interface JobPayload {
  id: string
  status: string
  progress: number
  processed_pages: number
  total_pages: number
  eta_seconds: number | null
  error_message: string | null
  download_url?: string | null
}

interface HistoryJob {
  id: string
  filename: string
  status: string
  progress: number
  processed_pages: number
  total_pages: number
  line_interval?: number
  page_count?: number
  eta_seconds: number | null
  error_message: string | null
  storage_deleted_at?: string | null
  created_at: string | null
  download_url: string | null
}

const config = useRuntimeConfig()

const flow = useFlowStore()
const auth = useAuthStore()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const flowPanelOpen = ref(false)
const flowStep = ref<'config' | 'payment' | 'progress'>('config')

const paymentEmail = ref('')
const paymentPhone = ref('')
const paymentStatusMessage = ref('')
const paymentAccountNotice = ref<string | null>(null)
const panelError = ref<string | null>(null)
const uploading = ref(false)
const quoteLoading = ref(false)
const quoteError = ref<string | null>(null)
const paymentPageCount = ref(0)
const paymentAmount = ref(0)
const paymentUnitPrice = ref(0)

const authModalOpen = ref(false)
const authMode = ref<'login' | 'register'>('login')
const authStep = ref<'email' | 'otp'>('email')
const authLoading = ref(false)
const authError = ref<string | null>(null)
const authMessage = ref<string | null>(null)
const authEmail = ref('')
const authOtpCode = ref('')
const authOtpExpiresIn = ref<number | null>(null)

const historyOpen = ref(false)
const historyLoading = ref(false)
const historyJobs = ref<HistoryJob[]>([])
const downloadingCurrentJob = ref(false)
const historyDownloadingJobId = ref<string | null>(null)
const uploadLoadedBytes = ref(0)
const uploadTotalBytes = ref(0)
const uploadBytesPerSecond = ref<number | null>(null)
const uploadEtaSeconds = ref<number | null>(null)

const PAYMENT_POLL_INTERVAL_MS = 2000
const PAYMENT_POLL_TIMEOUT_MS = 8 * 60 * 1000
const PDF_PAGE_COUNT_TIMEOUT_MS = 4000
const LARGE_FILE_THRESHOLD_MB = 100
const LARGE_FILE_THRESHOLD_BYTES = LARGE_FILE_THRESHOLD_MB * 1024 * 1024

let paymentPollInterval: ReturnType<typeof setInterval> | null = null
let paymentPollStartedAt = 0
let jobPollInterval: ReturnType<typeof setInterval> | null = null
let pusherClient: any = null
let pusherChannel: any = null
let uploadStartedAt = 0
let pdfJsLibPromise: Promise<any> | null = null

const paymentConfirmed = computed(() => !!flow.paymentReference)
const paymentEnabled = computed(() => flow.config?.enable_payment !== false)
const paymentSimulationMode = computed(() => !paymentEnabled.value)
const FREE_AMOUNT_EPSILON = 0.0001
const paymentIsFree = computed(() => paymentPageCount.value > 0 && paymentAmount.value <= FREE_AMOUNT_EPSILON)
const paymentRequiresCharge = computed(() => paymentPageCount.value > 0 && paymentAmount.value > FREE_AMOUNT_EPSILON)
const paymentAmountLabel = computed(() => {
  const currency = flow.config?.currency || 'KES'
  const defaultPrice = Number(flow.config?.price_per_page ?? 5)
  const amount = paymentPageCount.value > 0 ? paymentAmount.value : defaultPrice
  return `${currency} ${Math.max(0, amount).toFixed(2)}`
})
const paymentUnitPriceLabel = computed(() => {
  const currency = flow.config?.currency || 'KES'
  const defaultPrice = Number(flow.config?.price_per_page ?? 5)
  const unitPrice = paymentPageCount.value > 0 ? paymentUnitPrice.value : defaultPrice
  return `${currency} ${Math.max(0, unitPrice).toFixed(2)}`
})
const isLargeSelectedFile = computed(() => Number(flow.selectedFile?.size || 0) >= LARGE_FILE_THRESHOLD_BYTES)
const uploadProgressPercentage = computed(() => {
  const total = Number(uploadTotalBytes.value || flow.selectedFile?.size || 0)
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((uploadLoadedBytes.value / total) * 100)))
})
const uploadTransferredLabel = computed(() => {
  const total = Number(uploadTotalBytes.value || flow.selectedFile?.size || 0)
  const loaded = Math.min(uploadLoadedBytes.value, total || uploadLoadedBytes.value)
  if (!total) return 'Preparing upload...'
  return `Uploaded ${formatSize(loaded)} of ${formatSize(total)}`
})
const uploadSpeedLabel = computed(() => {
  if (!uploadBytesPerSecond.value || uploadBytesPerSecond.value <= 0) {
    return 'Speed calculating...'
  }
  return `Speed ${formatSize(uploadBytesPerSecond.value)}/s`
})
const uploadEtaLabel = computed(() => {
  if (uploadProgressPercentage.value >= 100) return 'ETA almost done'
  if (uploadEtaSeconds.value === null) return 'ETA calculating...'
  return `ETA ${formatEta(uploadEtaSeconds.value)}`
})

const progressPercentage = computed(() => {
  const raw = Number(flow.job?.progress ?? 0)
  if (!Number.isFinite(raw)) return 0
  return Math.max(0, Math.min(100, Math.round(raw)))
})

const flowPanelHeadline = computed(() => {
  if (flowStep.value === 'config') return 'Your Document'
  if (flowStep.value === 'payment') return 'Confirm payment details'
  if (flow.stage === 'uploading') return 'Uploading your PDF'
  if (flow.stage === 'download') return 'Download your processed PDF'
  if (flow.stage === 'error') return 'Processing error'
  return 'Realtime processing status'
})

const stepNumber = computed(() => {
  if (flowStep.value === 'config') return 1
  if (flowStep.value === 'payment') return 2
  return 3
})

const authTitle = computed(() => authStep.value === 'email'
  ? (authMode.value === 'login' ? 'Sign in with email' : 'Create your account')
  : 'Enter verification code')
const authSubtitle = computed(() => {
  if (authStep.value === 'otp') return 'We sent a one-time code to your email.'
  if (authMode.value === 'register') return 'Use your email to receive a one-time sign up code.'
  return 'Use your email to receive a one-time sign in code.'
})

const apiBase = () => String(config.public.apiBase || 'http://localhost:8000').replace(/\/$/, '')

function getLineIntervalFromDomain(): 5 | 10 {
  if (typeof window === 'undefined') return 10
  const host = window.location.hostname.toLowerCase()
  return (host === '5thlining.com' || host === 'www.5thlining.com') ? 5 : 10
}

watch(
  () => flow.selectedFile,
  async (file) => {
    if (!file) {
      flowPanelOpen.value = false
      flowStep.value = 'config'
      paymentPageCount.value = 0
      paymentAmount.value = 0
      paymentUnitPrice.value = 0
      quoteError.value = null
      quoteLoading.value = false
      resetUploadMetrics()
      return
    }

    flow.setUploadOptions({ line_interval: getLineIntervalFromDomain() })
    flowPanelOpen.value = true
    flowStep.value = 'config'
    flow.stage = 'config'
    panelError.value = null

    hydratePaymentContactFromUser(auth.user)
    await fetchPaymentQuote(file)
  },
  { immediate: true }
)

watch(
  () => auth.user,
  (user) => {
    hydratePaymentContactFromUser(user)
  },
  { immediate: true }
)

onMounted(async () => {
  auth.restore()

  try {
    const res = await $fetch<AppConfig>(`${apiBase()}/api/config`, {
      headers: authHeaders(),
    })
    flow.setConfig(res)
  } catch {
    flow.setConfig({
      enable_payment: true,
      price_per_page: 5,
      currency: 'KES',
      max_file_size_mb: 500,
      max_pages: 3000,
    })
  }

  flow.setUploadOptions({ line_interval: getLineIntervalFromDomain() })

  if (auth.token) {
    try {
      const me = await $fetch<{ user: AuthUser }>(`${apiBase()}/api/auth/me`, {
        headers: auth.authHeaders(),
      })
      auth.setUser(me.user)
      hydratePaymentContactFromUser(me.user)
    } catch {
      auth.clearAuth()
    }
  }
})

onUnmounted(() => {
  stopPaymentPolling()
  stopJobPolling()
  unsubscribeFromJobChannel()
})

function authHeaders() {
  return auth.authHeaders()
}

function resetUploadMetrics(totalBytes = 0) {
  uploadLoadedBytes.value = 0
  uploadTotalBytes.value = totalBytes
  uploadBytesPerSecond.value = null
  uploadEtaSeconds.value = null
  uploadStartedAt = 0
}

function updateUploadMetrics(loaded: number, total: number) {
  uploadLoadedBytes.value = Math.max(0, loaded)
  uploadTotalBytes.value = Math.max(total, loaded, uploadTotalBytes.value)

  if (!uploadStartedAt) {
    uploadStartedAt = Date.now()
  }

  const elapsedSeconds = Math.max((Date.now() - uploadStartedAt) / 1000, 0.25)
  const bytesPerSecond = loaded / elapsedSeconds
  uploadBytesPerSecond.value = bytesPerSecond > 0 ? bytesPerSecond : null

  const remainingBytes = Math.max(0, total - loaded)
  uploadEtaSeconds.value = bytesPerSecond > 0 ? Math.ceil(remainingBytes / bytesPerSecond) : null
}

function hydratePaymentContactFromUser(user: AuthUser | null | undefined) {
  if (!user) return

  if (user.email && !paymentEmail.value.trim()) {
    paymentEmail.value = user.email
  }

  if (user.phone && !paymentPhone.value.trim()) {
    paymentPhone.value = user.phone
  }
}

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

function maxAllowedFileSizeBytes(): number {
  return Number(flow.config?.max_file_size_mb ?? 500) * 1024 * 1024
}

function validateSelectedFile(file: File): string | null {
  if (!isPdfFile(file)) {
    return 'Only PDF files are allowed.'
  }

  if (file.size > maxAllowedFileSizeBytes()) {
    return `This file is larger than the ${flow.config?.max_file_size_mb ?? 500} MB limit.`
  }

  return null
}

async function getPdfJs() {
  if (!process.client) {
    throw new Error('PDF page counting is only available in the browser.')
  }

  if (!pdfJsLibPromise) {
    pdfJsLibPromise = import('pdfjs-dist/webpack.mjs')
  }

  return await pdfJsLibPromise
}

async function detectPdfPageCount(file: File): Promise<number> {
  const pdfjs = await getPdfJs()
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let pdf: any = null
  const loadingTask = pdfjs.getDocument({
    data: await file.arrayBuffer(),
    useWorkerFetch: false,
    isEvalSupported: false,
  })

  try {
    pdf = await Promise.race([
      loadingTask.promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          void loadingTask.destroy().catch(() => {})
          reject(new Error('Page counting timed out in the browser.'))
        }, PDF_PAGE_COUNT_TIMEOUT_MS)
      }),
    ])

    return Number(pdf.numPages || 0)
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (pdf?.cleanup) {
      try {
        await pdf.cleanup()
      } catch {
        // Best-effort cleanup only; don't block the quote UI.
      }
    }
  }
}

async function fetchPaymentQuoteFromApi(file: File) {
  const form = new FormData()
  form.append('file', file)

  return await $fetch<{ page_count: number; unit_price: number; amount: number }>(`${apiBase()}/api/payments/quote`, {
    method: 'POST',
    body: form,
    headers: authHeaders(),
  })
}

function prepareNewFile(file: File) {
  stopPaymentPolling()
  stopJobPolling()
  unsubscribeFromJobChannel()

  panelError.value = null
  paymentStatusMessage.value = ''
  paymentAccountNotice.value = null

  flow.paymentReference = null
  flow.paymentPolling = false
  flow.jobId = null
  flow.job = null
  flow.error = null
  paymentPageCount.value = 0
  paymentAmount.value = 0
  paymentUnitPrice.value = 0
  quoteError.value = null
  quoteLoading.value = false
  resetUploadMetrics(file.size)

  flow.setSelectedFile(file)
}

function openFilePicker() {
  panelError.value = null
  fileInput.value?.click()
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  const validationError = validateSelectedFile(file)
  if (validationError) {
    panelError.value = validationError
    input.value = ''
    return
  }

  prepareNewFile(file)
  input.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]

  if (!file) return

  const validationError = validateSelectedFile(file)
  if (validationError) {
    panelError.value = validationError
    return
  }

  prepareNewFile(file)
}

async function fetchPaymentQuote(file: File) {
  quoteLoading.value = true
  quoteError.value = null

  try {
    try {
      const pageCount = await detectPdfPageCount(file)
      const maxPages = Number(flow.config?.max_pages ?? 0)

      if (pageCount < 1) {
        throw new Error('Could not determine page count.')
      }

      if (maxPages > 0 && pageCount > maxPages) {
        throw new Error(`This PDF has ${pageCount} pages, which is above the ${maxPages}-page limit.`)
      }

      const unitPrice = Number(flow.config?.price_per_page ?? 5)

      paymentPageCount.value = pageCount
      paymentUnitPrice.value = unitPrice
      paymentAmount.value = Number((pageCount * unitPrice).toFixed(2))
      return
    } catch (clientError: any) {
      const quote = await fetchPaymentQuoteFromApi(file)

      paymentPageCount.value = Number(quote.page_count || 0)
      paymentUnitPrice.value = Number(quote.unit_price || 0)
      paymentAmount.value = Number(quote.amount || 0)

      if (paymentPageCount.value > 0) {
        return
      }

      throw clientError
    }
  } catch (e: any) {
    paymentPageCount.value = 0
    paymentAmount.value = 0
    paymentUnitPrice.value = 0

    const errorName = String(e?.name || '')
    if (e?.data?.code === 'pdf_damaged' || errorName === 'InvalidPDFException' || errorName === 'FormatError') {
      quoteError.value = 'This PDF appears damaged or unsupported. Please re-export or re-download it and try again.'
    } else if (errorName === 'PasswordException') {
      quoteError.value = 'Password-protected PDFs are not supported yet. Please remove the password and try again.'
    } else {
      quoteError.value = e?.data?.message || 'Could not calculate page count and pricing.'
    }
  } finally {
    quoteLoading.value = false
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string | null): string {
  if (!value) return 'Unknown date'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

function formatEta(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(Number(seconds))) {
    return '--'
  }

  const total = Math.max(0, Math.floor(Number(seconds)))
  const mins = Math.floor(total / 60)
  const secs = total % 60

  if (mins <= 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

function statusBadgeClass(status: string): string {
  if (status === 'completed') return 'border-primary-200 bg-primary-50 text-primary-800'
  if (status === 'failed') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (status === 'deleted') return 'border-slate-200 bg-slate-100 text-slate-700'
  if (status === 'processing') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-primary-200 bg-primary-50 text-primary-800'
}

function parseXhrJson(xhr: XMLHttpRequest) {
  if (xhr.response && typeof xhr.response === 'object') {
    return xhr.response as Record<string, any>
  }

  if (!xhr.responseText) return null

  try {
    return JSON.parse(xhr.responseText) as Record<string, any>
  } catch {
    return null
  }
}

function createUploadError(xhr: XMLHttpRequest) {
  const data = parseXhrJson(xhr)
  return {
    data,
    status: xhr.status,
    message: data?.message || 'Could not upload your PDF.',
  }
}

function uploadPdf(form: FormData): Promise<{ job_id: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const totalBytes = Number(flow.selectedFile?.size || uploadTotalBytes.value || 0)

    uploadStartedAt = Date.now()
    uploadTotalBytes.value = totalBytes
    flow.stage = 'uploading'

    xhr.open('POST', `${apiBase()}/api/upload`)
    xhr.responseType = 'json'

    for (const [key, value] of Object.entries(authHeaders())) {
      if (value !== undefined && value !== null) {
        xhr.setRequestHeader(key, String(value))
      }
    }

    xhr.upload.onprogress = (event) => {
      const total = event.lengthComputable ? event.total : totalBytes
      updateUploadMetrics(event.loaded, total)
    }

    xhr.onerror = () => {
      reject({
        data: {
          message: 'Network error while uploading your PDF. Please try again.',
        },
      })
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        updateUploadMetrics(totalBytes || uploadLoadedBytes.value, totalBytes || uploadTotalBytes.value || 0)
        const data = parseXhrJson(xhr)
        resolve((data || {}) as { job_id: string })
        return
      }

      reject(createUploadError(xhr))
    }

    xhr.send(form)
  })
}

function openFlowPanel(step: 'config' | 'payment' | 'progress') {
  if (!flow.selectedFile) return

  if (step === 'payment') {
    goToPaymentStep()
    return
  }

  flowStep.value = step
  flowPanelOpen.value = true
  if (step === 'config') flow.stage = 'config'
}

function goToPaymentStep() {
  if (!flow.selectedFile) return
  if (quoteLoading.value) return
  if (paymentPageCount.value < 1) {
    panelError.value = quoteError.value || 'Could not determine page count. Please reselect your PDF.'
    return
  }

  if (paymentIsFree.value) {
    panelError.value = null

    if (!auth.isAuthenticated) {
      openAuthModal('login')
      authEmail.value = authEmail.value.trim() || paymentEmail.value.trim()
      panelError.value = 'Sign in to continue. This document is free and will be processed without payment.'
      return
    }

    paymentStatusMessage.value = 'No payment required. Starting processing...'
    paymentAccountNotice.value = 'No payment required for this document. Processing will start immediately.'
    submitUpload()
    return
  }

  flowStep.value = 'payment'
  flow.stage = 'payment'
}

function goToConfigStep() {
  flowStep.value = 'config'
  flow.stage = 'config'
}

function goToProgressStep(stage: 'uploading' | 'processing' = 'processing') {
  flowStep.value = 'progress'
  flowPanelOpen.value = true
  flow.stage = stage
}

function clearFile() {
  stopPaymentPolling()
  stopJobPolling()
  unsubscribeFromJobChannel()

  panelError.value = null
  paymentStatusMessage.value = ''
  paymentAccountNotice.value = null
  quoteLoading.value = false
  quoteError.value = null
  paymentPageCount.value = 0
  paymentAmount.value = 0
  paymentUnitPrice.value = 0
  resetUploadMetrics()

  flow.reset()
  flowPanelOpen.value = false
  flowStep.value = 'config'
}

function resetForAnother() {
  clearFile()
}

async function initiatePayment() {
  if (flow.paymentPolling || paymentConfirmed.value) return

  panelError.value = null

  const rawPhone = paymentPhone.value.replace(/\s/g, '')
  const phone = `254${rawPhone.slice(-9)}`
  const email = paymentEmail.value.trim()

  if (!email) {
    panelError.value = 'Please enter your email address.'
    return
  }

  if (!rawPhone) {
    panelError.value = 'Please enter an M-Pesa phone number.'
    return
  }

  if (paymentPageCount.value < 1) {
    panelError.value = 'Could not determine page count. Please reselect your PDF.'
    return
  }

  if (!/^(254[0-9]{9}|0[0-9]{9})$/.test(rawPhone)) {
    panelError.value = 'Use format 254XXXXXXXXX or 0XXXXXXXXX for M-Pesa phone number.'
    return
  }

  try {
    flow.paymentPolling = true
    paymentStatusMessage.value = 'Sending M-Pesa prompt...'

    const body = {
      phone,
      email,
      page_count: paymentPageCount.value,
    }
    const res = await $fetch<{ reference: string; created_account?: boolean; auth_token?: string | null; user?: AuthUser | null }>(`${apiBase()}/api/payments/initiate`, {
      method: 'POST',
      body,
      headers: authHeaders(),
    })

    if (res.auth_token && res.user) {
      auth.setAuth(res.auth_token, res.user)
    }
    if (res.user) {
      hydratePaymentContactFromUser(res.user)
    }

    paymentStatusMessage.value = paymentSimulationMode.value
      ? 'Payments are disabled in settings. Simulating successful payment...'
      : 'Prompt sent. Complete payment on your phone to continue.'
    paymentAccountNotice.value = res.created_account
      ? 'Account created for this email. Next time, sign in with email OTP.'
      : null

    startPaymentPolling(res.reference)
  } catch (e: any) {
    flow.paymentPolling = false
    const statusCode = Number(e?.response?.status || e?.statusCode || e?.status || 0)
    const errorCode = e?.data?.code

    if (errorCode === 'existing_user_sign_in_required' || statusCode === 409) {
      openAuthModal('login')
      authEmail.value = email
      authStep.value = 'email'
      authError.value = e?.data?.message || 'This email already has an account. Please sign in to continue.'
      panelError.value = null
      return
    }

    panelError.value = e?.data?.message || 'Could not initiate payment.'
  }
}

function startPaymentPolling(reference: string) {
  stopPaymentPolling()

  flow.paymentPolling = true
  paymentPollStartedAt = Date.now()

  paymentPollInterval = setInterval(async () => {
    try {
      const status = await $fetch<{ status: string }>(`${apiBase()}/api/payments/${reference}/status`, {
        headers: authHeaders(),
      })

      if (status.status === 'completed') {
        flow.setPaymentReference(reference)
        flow.paymentPolling = false
        paymentStatusMessage.value = 'Payment confirmed. Starting processing...'
        stopPaymentPolling()
        await submitUpload()
        return
      }

      if (status.status === 'failed' || status.status === 'cancelled') {
        flow.paymentPolling = false
        panelError.value = 'Payment failed or was cancelled. Please try again.'
        stopPaymentPolling()
        return
      }

      if (Date.now() - paymentPollStartedAt > PAYMENT_POLL_TIMEOUT_MS) {
        flow.paymentPolling = false
        panelError.value = 'Payment confirmation timed out. Start payment again.'
        stopPaymentPolling()
      }
    } catch {
      if (Date.now() - paymentPollStartedAt > PAYMENT_POLL_TIMEOUT_MS) {
        flow.paymentPolling = false
        panelError.value = 'Unable to confirm payment right now. Please retry.'
        stopPaymentPolling()
      }
    }
  }, PAYMENT_POLL_INTERVAL_MS)
}

function stopPaymentPolling() {
  if (paymentPollInterval) {
    clearInterval(paymentPollInterval)
    paymentPollInterval = null
  }
}

function handlePaymentPrimaryAction() {
  if (paymentIsFree.value) {
    submitUpload()
    return
  }

  if (paymentConfirmed.value) {
    submitUpload()
    return
  }

  initiatePayment()
}

async function submitUpload() {
  const file = flow.selectedFile

  panelError.value = null
  if (!file) {
    panelError.value = 'Please select a PDF first.'
    return
  }

  if (paymentRequiresCharge.value && !flow.paymentReference) {
    panelError.value = 'Payment must be completed before processing.'
    return
  }

  if (!auth.token) {
    panelError.value = 'Please login first to continue.'
    openAuthModal('login')
    return
  }

  uploading.value = true
  resetUploadMetrics(file.size)
  goToProgressStep('uploading')
  flow.jobId = null
  flow.job = null
  flow.error = null

  try {
    const form = new FormData()
    form.append('file', file)
    form.append('line_interval', String(flow.uploadOptions.line_interval))
    form.append('margin', flow.uploadOptions.margin)
    form.append('font_size_pt', String(flow.uploadOptions.font_size_pt))
    if (paymentRequiresCharge.value && flow.paymentReference) {
      form.append('payment_reference', flow.paymentReference)
    }

    const res = await uploadPdf(form)

    flow.setJobId(res.job_id)
    flow.setJob({
      status: 'processing',
      progress: 0,
      processed_pages: 0,
      total_pages: paymentPageCount.value,
      eta_seconds: null,
      error_message: null,
    })
    goToProgressStep('processing')

    await subscribeToJobChannel(res.job_id)
    await fetchJobSnapshot(res.job_id)
  } catch (e: any) {
    panelError.value = e?.data?.message || 'Could not upload your PDF.'
    if (paymentRequiresCharge.value) {
      goToPaymentStep()
    } else {
      goToConfigStep()
    }
  } finally {
    uploading.value = false
  }
}

async function ensurePusherClient() {
  if (pusherClient) return pusherClient

  if (!process.client || !config.public.pusherKey) {
    return null
  }

  const Pusher = (await import('pusher-js')).default

  const wsHost = String(config.public.pusherHost || '').trim()
  const scheme = String(config.public.pusherScheme || 'https')

  pusherClient = new Pusher(String(config.public.pusherKey), {
    cluster: String(config.public.pusherCluster || 'mt1'),
    forceTLS: scheme === 'https',
    wsHost: wsHost || undefined,
    wsPort: Number(config.public.pusherPort || 443),
    wssPort: Number(config.public.pusherPort || 443),
    enabledTransports: ['ws', 'wss'],
  })

  return pusherClient
}

async function subscribeToJobChannel(jobId: string) {
  unsubscribeFromJobChannel()

  const client = await ensurePusherClient()
  if (!client) {
    // Fallback only when websocket is not configured.
    startJobPolling()
    return
  }

  const channelName = `job.${jobId}`
  pusherChannel = client.subscribe(channelName)

  pusherChannel.bind('pdf.job.updated', (payload: JobPayload) => {
    flow.setJob(payload as any)

    if (payload.status === 'completed' || payload.status === 'failed') {
      unsubscribeFromJobChannel()
    }
  })
}

function unsubscribeFromJobChannel() {
  if (!pusherClient || !pusherChannel) return
  pusherClient.unsubscribe(pusherChannel.name)
  pusherChannel = null
}

async function fetchJobSnapshot(jobId: string) {
  try {
    const job = await $fetch<JobPayload>(`${apiBase()}/api/job/${jobId}`, {
      headers: authHeaders(),
    })
    flow.setJob(job as any)
  } catch {
    // Ignore transient fetch issues.
  }
}

function startJobPolling() {
  stopJobPolling()

  jobPollInterval = setInterval(async () => {
    if (!flow.jobId) return

    try {
      const job = await $fetch<JobPayload>(`${apiBase()}/api/job/${flow.jobId}`, {
        headers: authHeaders(),
      })

      flow.setJob(job as any)

      if (job.status === 'completed' || job.status === 'failed') {
        stopJobPolling()
      }
    } catch {
      // Keep polling fallback alive.
    }
  }, 2500)
}

function stopJobPolling() {
  if (jobPollInterval) {
    clearInterval(jobPollInterval)
    jobPollInterval = null
  }
}

function openAuthModal(mode: 'login' | 'register') {
  authMode.value = mode
  authStep.value = 'email'
  authError.value = null
  authMessage.value = null
  authOtpCode.value = ''
  authOtpExpiresIn.value = null
  authModalOpen.value = true

  if (auth.user?.email && !authEmail.value.trim()) {
    authEmail.value = auth.user.email
  } else if (!authEmail.value.trim() && paymentEmail.value.trim()) {
    authEmail.value = paymentEmail.value.trim()
  }
}

async function requestAuthOtp() {
  authLoading.value = true
  authError.value = null
  authMessage.value = null

  try {
    const res = await $fetch<{ message: string; otp_expires_in_seconds: number }>(`${apiBase()}/api/auth/request-otp`, {
      method: 'POST',
      body: {
        mode: authMode.value,
        email: authEmail.value.trim(),
      },
    })

    authStep.value = 'otp'
    authOtpCode.value = ''
    authOtpExpiresIn.value = Number(res.otp_expires_in_seconds || 0)
    authMessage.value = res.message || 'A one-time code has been sent.'
  } catch (e: any) {
    authError.value = e?.data?.message || 'Could not send OTP.'
  } finally {
    authLoading.value = false
  }
}

async function verifyAuthOtp() {
  authLoading.value = true
  authError.value = null
  authMessage.value = null

  try {
    const res = await $fetch<{ token: string; user: AuthUser; created_account?: boolean }>(`${apiBase()}/api/auth/verify-otp`, {
      method: 'POST',
      body: {
        email: authEmail.value.trim(),
        code: authOtpCode.value.trim(),
      },
    })

    auth.setAuth(res.token, res.user)
    hydratePaymentContactFromUser(res.user)
    if (res.created_account) {
      authMessage.value = 'Account created successfully.'
    }
    authModalOpen.value = false
  } catch (e: any) {
    authError.value = e?.data?.message || 'Could not verify OTP.'
  } finally {
    authLoading.value = false
  }
}

async function logout() {
  try {
    await $fetch(`${apiBase()}/api/auth/logout`, {
      method: 'POST',
      headers: authHeaders(),
    })
  } catch {
    // ignore logout API errors and clear local state
  }

  auth.clearAuth()
}

async function openHistory() {
  if (!auth.isAuthenticated) {
    openAuthModal('login')
    return
  }

  historyOpen.value = true
  await loadHistory()
}

async function loadHistory() {
  if (!auth.isAuthenticated) return

  historyLoading.value = true

  try {
    const res = await $fetch<{ jobs: HistoryJob[] }>(`${apiBase()}/api/me/jobs`, {
      headers: authHeaders(),
    })
    historyJobs.value = res.jobs || []
  } catch {
    historyJobs.value = []
  } finally {
    historyLoading.value = false
  }
}

async function downloadCurrentJob() {
  const jobId = flow.jobId
  if (!jobId) return

  const filename = flow.selectedFile?.name || 'document.pdf'
  downloadingCurrentJob.value = true

  try {
    await downloadJobById(jobId, filename)
  } finally {
    downloadingCurrentJob.value = false
  }
}

async function downloadHistoryJob(job: HistoryJob) {
  historyDownloadingJobId.value = job.id

  try {
    await downloadJobById(job.id, job.filename)
  } finally {
    historyDownloadingJobId.value = null
  }
}

function buildDownloadFilename(originalFilename: string): string {
  const base = originalFilename.replace(/\.pdf$/i, '') || 'document'
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const h = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  const timestamp = `${y}-${m}-${d}_${h}${min}${s}`
  return `tenthlining.ai_${timestamp}_${base}.pdf`
}

async function downloadJobById(jobId: string, sourceFilename: string) {
  if (!auth.token) {
    openAuthModal('login')
    return
  }

  panelError.value = null

  try {
    const blob = await $fetch<Blob>(`${apiBase()}/api/job/${jobId}/download`, {
      headers: authHeaders(),
      responseType: 'blob',
    })

    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = buildDownloadFilename(sourceFilename)
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  } catch (e: any) {
    panelError.value = e?.data?.message || 'Could not download the processed document.'
  }
}
</script>

<style scoped>

/* .app-shell {
  background:
    radial-gradient(1000px 520px at 90% -18%, rgba(216, 201, 150, 0.28), transparent 64%),
    radial-gradient(820px 440px at -8% 108%, rgba(32, 40, 72, 0.16), transparent 62%),
    linear-gradient(180deg, #fcf9ef 0%, #f5edd7 100%);
} */

.app-shell {
  /* background:
    radial-gradient(1000px 520px at 90% -18%, rgba(216, 201, 150, 0.28), transparent 64%),
    radial-gradient(820px 440px at -8% 108%, rgba(32, 40, 72, 0.16), transparent 62%), */
}

.dropzone-card {
  background: rgba(255, 255, 255, 0.88);
  border-color: #cbd5e1;
  box-shadow: 0 35px 70px -45px rgba(15, 23, 42, 0.45);
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
}

.dropzone-card:hover {
  transform: translateY(-2px);
  border-color: #202848;
  box-shadow: 0 42px 84px -52px rgba(32, 40, 72, 0.42);
}

.dropzone-card.dragging {
  border-color: #202848;
  background: rgba(252, 249, 239, 0.94);
  transform: translateY(-2px) scale(1.002);
}

.ambient-lines {
  position: absolute;
  inset: 0;
  opacity: 0.32;
  background-image:
    linear-gradient(to right, rgba(32, 40, 72, 0.16) 1px, transparent 1px),
    linear-gradient(to right, rgba(216, 201, 150, 0.2) 1px, transparent 1px);
  background-size: 72px 100%, 18px 100%;
  animation: move-lines 1s linear infinite;
}

.ambient-orb {
  position: absolute;
  width: 360px;
  height: 360px;
  border-radius: 9999px;
  filter: blur(48px);
  opacity: 0.3;
}

.ambient-orb-a {
  top: 8%;
  left: -120px;
  background: rgba(216, 201, 150, 0.5);
  animation: float-orb-a 8s ease-in-out infinite;
}

.ambient-orb-b {
  right: -100px;
  bottom: 2%;
  background: rgba(32, 40, 72, 0.26);
  animation: float-orb-b 10s ease-in-out infinite;
}

@keyframes move-lines {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-72px);
  }
}

@keyframes float-orb-a {
  0%, 100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(36px, -18px, 0);
  }
}

@keyframes float-orb-b {
  0%, 100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(-28px, 20px, 0);
  }
}

@media (max-width: 640px) {
  .ambient-lines {
    opacity: 0.2;
    animation-duration: 24s;
  }

  .ambient-orb {
    width: 260px;
    height: 260px;
    filter: blur(36px);
    opacity: 0.2;
  }
}

.animate-fade-up {
  animation: fade-up 0.55s ease both;
}

.animate-fade-up-delay {
  animation: fade-up 0.55s ease both;
  animation-delay: 90ms;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.24s ease;
}

.panel-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.2s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}

.auth-mode-enter-active,
.auth-mode-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.auth-mode-enter-from {
  opacity: 0;
  transform: translateX(18px);
}

.auth-mode-leave-to {
  opacity: 0;
  transform: translateX(-18px);
}
</style>
