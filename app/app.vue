<template>
  <div class="min-h-screen app-shell text-slate-900">
    <header class="sticky h-16 top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur">
      <div class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
        <NuxtLink to="/" class="flex items-center gap-3">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white shadow-md shadow-primary-500/25">
            10
          </span>
          <div class="leading-tight">
            <p class="text-[16px] font-semibold tracking-tight text-slate-900">LegalLine</p>
            <p class="text-[16px] font-medium uppercase tracking-[0.12em] text-slate-500">Tenth Lining</p>
          </div>
        </NuxtLink>

        <div class="flex items-center gap-2 sm:gap-3">
          <template v-if="auth.isAuthenticated && auth.user">
            <span class="hidden rounded-full bg-slate-100 px-3 py-1 text-[14px] font-semibold text-slate-700 sm:inline-flex">
              {{ auth.user.email }}
            </span>
            <UButton size="lg" variant="soft" color="primary" class="rounded-lg text-[16px]" @click="openHistory">
              My documents
            </UButton>
            <UButton size="lg" variant="ghost" color="gray" class="rounded-lg text-[16px]" @click="logout">
              Logout
            </UButton>
          </template>
          <template v-else>
            <UButton size="lg" variant="ghost" color="gray" class="rounded-lg text-[16px]" @click="openAuthModal('login')">
              Login
            </UButton>
            <UButton size="lg" color="primary" class="rounded-lg text-[16px]" @click="openAuthModal('register')">
              Sign up
            </UButton>
          </template>
        </div>
      </div>
    </header>

    <main class="relative overflow-hidden">
      <div v-if="!showResetPassword" aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
        <div class="ambient-lines" />
        <div class="ambient-orb ambient-orb-a" />
        <div class="ambient-orb ambient-orb-b" />
      </div>

      <section v-if="showResetPassword" class="mx-auto w-full max-w-md px-4 pb-16 pt-16 sm:px-6">
        <div class="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.45)]">
          <h1 class="text-2xl font-semibold text-slate-900">Set your password</h1>
          <p class="mt-2 text-sm text-slate-600">
            Create a secure password to continue using LegalLine.
          </p>

          <div class="mt-6 space-y-4">
            <UFormField label="Email">
              <UInput v-model="resetEmail" type="email" size="lg" class="w-full" />
            </UFormField>
            <UFormField label="New password">
              <UInput v-model="resetPassword" type="password" size="lg" class="w-full" />
            </UFormField>
            <UFormField label="Confirm password">
              <UInput v-model="resetPasswordConfirmation" type="password" size="lg" class="w-full" />
            </UFormField>

            <UAlert v-if="resetError" color="error" :title="resetError" />
            <UAlert v-if="resetMessage" color="success" :title="resetMessage" />

            <UButton block size="lg" color="primary" class="rounded-xl py-3" :loading="resetLoading" @click="submitResetPassword">
              Save password
            </UButton>

            <UButton block size="lg" variant="ghost" color="gray" class="rounded-xl" @click="exitResetMode">
              Back to home
            </UButton>
          </div>
        </div>
      </section>

      <section
        v-if="!showResetPassword"
        class="bg-blue-500 mx-auto w-full max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:px-10"
      >
        <div class="mx-auto max-w-3xl text-center animate-fade-up">
          <p class="text-sm font-semibold uppercase tracking-[0.16em] text-primary-600">Tenth Lining</p>
          <h1 class="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Add legal line numbers to your PDF in minutes
          </h1>
          <p class="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Upload one PDF, configure numbering, complete payment, and download your file from the same flow.
          </p>
        </div>

        <div class="mt-12">
          <div
            v-if="!flow.selectedFile"
            class="dropzone-card cursor-pointer mx-auto max-w-3xl rounded-3xl border-2 border-dashed p-8 text-center sm:p-12"
            :class="isDragging ? 'dragging' : ''"
            @click="fileInput?.click()"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
          >
            <input ref="fileInput" type="file" accept=".pdf,application/pdf" class="hidden" @change="onFileSelect">

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
                @click.stop="fileInput?.click()"
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

          <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.45)] sm:p-8 animate-fade-up">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold uppercase tracking-[0.12em] text-primary-600">File Ready</p>
                  <h2 class="mt-2 text-2xl font-semibold text-slate-900">{{ flow.selectedFile.name }}</h2>
                  <p class="mt-1 text-sm text-slate-500">{{ formatSize(flow.selectedFile.size) }}</p>
                </div>
                <UBadge color="primary" variant="soft" class="rounded-full px-3 py-1 text-xs font-semibold">
                  1 PDF selected
                </UBadge>
              </div>

              <div class="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p class="text-sm leading-relaxed text-slate-600">
                  Continue in the right panel to configure options, pay, and track realtime progress.
                </p>
                <div class="mt-4 flex flex-wrap gap-3">
                  <UButton color="primary" class="rounded-xl px-5 font-semibold" @click="openFlowPanel('config')">
                    Open setup panel
                  </UButton>
                  <UButton variant="soft" color="primary" class="rounded-xl px-5 font-semibold" @click="openFlowPanel('payment')">
                    Go to payment
                  </UButton>
                  <UButton variant="ghost" color="gray" class="rounded-xl px-5" @click="clearFile">
                    Remove file
                  </UButton>
                </div>
              </div>

              <input ref="fileInput" type="file" accept=".pdf,application/pdf" class="hidden" @change="onFileSelect">
            </div>

            <div class="rounded-3xl border border-slate-200/80 bg-white/80 p-6 backdrop-blur sm:p-8 animate-fade-up-delay">
              <h3 class="text-lg font-semibold text-slate-900">How it works</h3>
              <ol class="mt-4 space-y-4 text-sm text-slate-600">
                <li class="flex gap-3">
                  <span class="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">1</span>
                  <span>Set margin and font size (line interval is fixed at 10).</span>
                </li>
                <li class="flex gap-3">
                  <span class="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">2</span>
                  <span>Pay with M-Pesa and auto-link to your account.</span>
                </li>
                <li class="flex gap-3">
                  <span class="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">3</span>
                  <span>Watch live processing progress and download in step 3.</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        <USlideover
          :overlay="false"
          :open="flowPanelOpen"
          side="right"
          :title="flowPanelTitle"
          class="!w-full sm:!max-w-xl top-16 right-0 fixed "
          @update:open="flowPanelOpen = $event"
        >
          <template #content>
            <div class="flex h-full flex-col bg-white">
              <div class="border-b border-slate-200 p-6 sm:p-8">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.12em] text-primary-600">
                      Step {{ stepNumber }} of 3
                    </p>
                    <h3 class="mt-1 text-xl font-semibold text-slate-900">{{ flowPanelHeadline }}</h3>
                  </div>
                  <UBadge
                    :color="flow.stage === 'download' ? 'success' : 'primary'"
                    variant="soft"
                    class="rounded-full px-3 py-1 text-xs font-semibold"
                  >
                    {{ flow.stage === 'download' ? 'Completed' : paymentConfirmed ? 'Payment confirmed' : 'Payment required' }}
                  </UBadge>
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
    
              <div class="flex-1 overflow-y-auto p-6 sm:p-8">
                <Transition name="panel-slide" mode="out-in">
                  <div v-if="flowStep === 'config'" key="config" class="space-y-6">
                    <p class="text-sm leading-relaxed text-slate-600">
                      Set how line numbers should appear on your PDF margins. Line interval is fixed at every 10 lines.
                    </p>
    
                    <UFormField label="Margin side">
                      <URadioGroup
                        v-model="flow.uploadOptions.margin"
                        :items="marginItems"
                        orientation="horizontal"
                        variant="card"
                        class="w-full"
                      />
                    </UFormField>
    
                    <UFormField label="Font size">
                      <USelect
                        v-model="flow.uploadOptions.font_size_pt"
                        :items="fontSizeItems"
                        size="xl"
                        class="w-full"
                        placeholder="Choose font size"
                      />
                    </UFormField>
    
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      Amount due:
                      <strong class="text-slate-900">{{ paymentAmountLabel }}</strong>
                    </div>
                  </div>
    
                  <div v-else-if="flowStep === 'payment'" key="payment" class="space-y-6">
                    <UButton variant="ghost" color="gray" size="sm" icon="i-heroicons-arrow-left" class="-ml-2" @click="goToConfigStep">
                      Back to options
                    </UButton>
    
                    <UAlert
                      color="info"
                      icon="i-heroicons-device-phone-mobile"
                      :title="paymentEnabled ? 'M-Pesa payment required' : 'Payment simulation mode'"
                      :description="paymentEnabled
                        ? 'Enter email and phone, then approve the STK prompt on your phone.'
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
    
                    <UButton
                      v-if="!paymentConfirmed"
                      block
                      size="lg"
                      color="primary"
                      class="rounded-xl py-3 text-base font-semibold"
                      :loading="flow.paymentPolling"
                      :disabled="!paymentPhone.trim() || !paymentEmail.trim()"
                      @click="initiatePayment"
                    >
                      {{ flow.paymentPolling ? 'Waiting for payment confirmation...' : 'Pay with M-Pesa' }}
                    </UButton>
    
                    <div v-if="flow.paymentPolling" class="rounded-2xl border border-primary-200 bg-primary-50 p-4">
                      <div class="flex items-center gap-3 text-primary-700">
                        <UIcon name="i-heroicons-arrow-path" class="h-5 w-5 animate-spin" />
                        <p class="text-sm font-medium">Awaiting customer payment...</p>
                      </div>
                      <p class="mt-2 text-sm text-primary-700/80">
                        {{ paymentStatusMessage || 'Check your phone and complete the M-Pesa prompt.' }}
                      </p>
                    </div>
    
                    <div v-if="paymentConfirmed" class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <div class="flex items-center gap-2 text-emerald-700">
                        <UIcon name="i-heroicons-check-circle" class="h-5 w-5" />
                        <p class="text-sm font-semibold">Payment confirmed</p>
                      </div>
                      <p class="mt-1 text-sm text-emerald-700/90">
                        You can now start processing this document.
                      </p>
                    </div>
                  </div>
    
                  <div v-else key="progress" class="space-y-6">
                    <UButton
                      v-if="flow.stage !== 'processing'"
                      variant="ghost"
                      color="gray"
                      size="sm"
                      icon="i-heroicons-arrow-left"
                      class="-ml-2"
                      @click="goToPaymentStep"
                    >
                      Back to payment
                    </UButton>
    
                    <div v-if="flow.stage === 'processing'" class="space-y-4">
                      <UAlert
                        color="info"
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
    
                    <div v-else-if="flow.stage === 'download'" class="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                      <UIcon name="i-heroicons-check-circle" class="mx-auto h-12 w-12 text-emerald-600" />
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
                        Back to payment
                      </UButton>
                    </div>
    
                    <div v-else class="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                      Start processing to see realtime progress here.
                    </div>
                  </div>
                </Transition>
              </div>
    
              <div class="border-t border-slate-200 bg-white p-6 sm:p-8">
                <Transition name="panel-fade" mode="out-in">
                  <div v-if="flowStep === 'config'" key="config-footer" class="space-y-3">
                    <UButton block size="lg" color="primary" class="rounded-xl py-3 text-base font-semibold" @click="goToPaymentStep">
                      Next: Payment
                    </UButton>
                  </div>
    
                  <div v-else-if="flowStep === 'payment'" key="payment-footer" class="space-y-3">
                    <UButton
                      block
                      size="lg"
                      color="primary"
                      class="rounded-xl py-3 text-base font-semibold"
                      :loading="uploading"
                      :disabled="!paymentConfirmed || uploading"
                      @click="submitUpload"
                    >
                      {{ uploading ? 'Preparing upload...' : 'Start Tenth Lining' }}
                    </UButton>
                    <p class="text-center text-xs text-slate-500">
                      We only start processing after confirmed payment.
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
            </div>
          </template>
        </USlideover>
      </section>
      
    </main>


    <UModal :open="authModalOpen" @update:open="authModalOpen = $event">
      <template #content>
        <div class="p-6 sm:p-8">
          <div class="mx-auto w-full max-w-md">
            <div class="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 class="text-2xl font-semibold tracking-tight text-slate-900">
                  {{ authMode === 'login' ? 'Sign in' : authMode === 'register' ? 'Create account' : 'Forgot password' }}
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
              <div :key="authMode" class="space-y-4">
                <div
                  v-if="authMessage"
                  class="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-800"
                >
                  {{ authMessage }}
                </div>

                <div
                  v-if="authError"
                  class="rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700"
                >
                  {{ authError }}
                </div>

                <UFormField v-if="authMode === 'register'" label="Full name">
                  <UInput v-model="registerName" size="lg" class="w-full" placeholder="Jane Doe" />
                </UFormField>

                <UFormField label="Email address">
                  <UInput v-model="authEmail" type="email" size="lg" class="w-full" placeholder="you@example.com" />
                </UFormField>

                <UFormField v-if="authMode !== 'forgot'" label="Password">
                  <UInput v-model="authPassword" type="password" size="lg" class="w-full" placeholder="Enter password" />
                </UFormField>

                <UFormField v-if="authMode === 'register'" label="Confirm password">
                  <UInput v-model="authPasswordConfirmation" type="password" size="lg" class="w-full" placeholder="Repeat password" />
                </UFormField>

                <p v-if="authMode === 'forgot'" class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                  We will send a secure reset link to this email.
                </p>

                <UButton
                  v-if="authMode === 'login'"
                  block
                  size="lg"
                  color="primary"
                  class="rounded-xl py-3 text-base font-semibold shadow-sm"
                  :loading="authLoading"
                  @click="login"
                >
                  Sign in
                </UButton>
                <UButton
                  v-else-if="authMode === 'register'"
                  block
                  size="lg"
                  color="primary"
                  class="rounded-xl py-3 text-base font-semibold shadow-sm"
                  :loading="authLoading"
                  @click="register"
                >
                  Create account
                </UButton>
                <UButton
                  v-else
                  block
                  size="lg"
                  color="primary"
                  class="rounded-xl py-3 text-base font-semibold shadow-sm"
                  :loading="authLoading"
                  @click="sendForgotPassword"
                >
                  Send reset link
                </UButton>

                <div class="mt-4 text-sm">
                  <div v-if="authMode === 'login'" class="flex items-center justify-between gap-4">
                    <button
                      type="button"
                      class="cursor-pointer font-medium text-primary-700 transition hover:text-primary-800 hover:underline"
                      @click="openAuthModal('forgot')"
                    >
                      Forgot password?
                    </button>
                    <p class="text-slate-600">
                      Don't have an account?
                      <button
                        type="button"
                        class="cursor-pointer font-medium text-primary-700 transition hover:text-primary-800 hover:underline"
                        @click="openAuthModal('register')"
                      >
                        Sign up
                      </button>
                    </p>
                  </div>

                  <div v-else-if="authMode === 'register'" class="text-center text-slate-600">
                    Already have an account?
                    <button
                      type="button"
                      class="cursor-pointer font-medium text-primary-700 transition hover:text-primary-800 hover:underline"
                      @click="openAuthModal('login')"
                    >
                      Sign in
                    </button>
                  </div>

                  <div v-else class="text-center text-slate-600">
                    Remember your password?
                    <button
                      type="button"
                      class="cursor-pointer font-medium text-primary-700 transition hover:text-primary-800 hover:underline"
                      @click="openAuthModal('login')"
                    >
                      Sign in
                    </button>
                  </div>
                </div>
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
                  <UBadge :color="statusColor(job.status)" variant="soft">
                    {{ job.status }}
                  </UBadge>
                </div>

                <p class="mt-2 text-xs text-slate-600">
                  Progress: {{ job.progress }}%
                  <span v-if="job.total_pages"> · {{ job.processed_pages }}/{{ job.total_pages }} pages</span>
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
import { useFlowStore, type AppConfig } from '~/stores/flow'
import { useAuthStore, type AuthUser } from '~/stores/auth'

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
  eta_seconds: number | null
  error_message: string | null
  created_at: string | null
  download_url: string | null
}

const config = useRuntimeConfig()
const route = useRoute()
const router = useRouter()

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

const authModalOpen = ref(false)
const authMode = ref<'login' | 'register' | 'forgot'>('login')
const authLoading = ref(false)
const authError = ref<string | null>(null)
const authMessage = ref<string | null>(null)
const authEmail = ref('')
const registerName = ref('')
const authPassword = ref('')
const authPasswordConfirmation = ref('')

const resetToken = ref('')
const resetEmail = ref('')
const resetPassword = ref('')
const resetPasswordConfirmation = ref('')
const resetLoading = ref(false)
const resetError = ref<string | null>(null)
const resetMessage = ref<string | null>(null)

const historyOpen = ref(false)
const historyLoading = ref(false)
const historyJobs = ref<HistoryJob[]>([])
const downloadingCurrentJob = ref(false)
const historyDownloadingJobId = ref<string | null>(null)

const PAYMENT_POLL_INTERVAL_MS = 2000
const PAYMENT_POLL_TIMEOUT_MS = 8 * 60 * 1000

const marginItems = [
  { label: 'Left margin', value: 'left' },
  { label: 'Right margin', value: 'right' },
]

const fontSizeItems = [
  { label: '8 pt', value: 8 },
  { label: '9 pt', value: 9 },
  { label: '10 pt', value: 10 },
]

let paymentPollInterval: ReturnType<typeof setInterval> | null = null
let paymentPollStartedAt = 0
let jobPollInterval: ReturnType<typeof setInterval> | null = null
let pusherClient: any = null
let pusherChannel: any = null

const paymentConfirmed = computed(() => !!flow.paymentReference)
const paymentEnabled = computed(() => flow.config?.enable_payment !== false)
const paymentSimulationMode = computed(() => !paymentEnabled.value)
const paymentAmountLabel = computed(() => {
  const currency = flow.config?.currency || 'KES'
  const amount = flow.config?.price_per_document ?? 100
  return `${currency} ${amount}`
})

const progressPercentage = computed(() => {
  const raw = Number(flow.job?.progress ?? 0)
  if (!Number.isFinite(raw)) return 0
  return Math.max(0, Math.min(100, Math.round(raw)))
})

const flowPanelTitle = computed(() => {
  if (flowStep.value === 'config') return 'Tenth Lining Setup'
  if (flowStep.value === 'payment') return 'Payment & Processing'
  return 'Processing progress'
})

const flowPanelHeadline = computed(() => {
  if (flowStep.value === 'config') return 'Choose your numbering style'
  if (flowStep.value === 'payment') return 'Confirm payment details'
  if (flow.stage === 'download') return 'Download your processed PDF'
  if (flow.stage === 'error') return 'Processing error'
  return 'Realtime processing status'
})

const stepNumber = computed(() => {
  if (flowStep.value === 'config') return 1
  if (flowStep.value === 'payment') return 2
  return 3
})

const showResetPassword = computed(() => route.query.auth === 'reset-password')

const authSubtitle = computed(() => {
  if (authMode.value === 'register') return 'Create your frontend account to track your jobs.'
  if (authMode.value === 'forgot') return 'We will send a secure reset link to your email.'
  return 'Access your previous work and continue processing PDFs.'
})

const apiBase = () => String(config.public.apiBase || 'http://localhost:8000').replace(/\/$/, '')

watch(
  () => flow.selectedFile,
  (file) => {
    if (!file) {
      flowPanelOpen.value = false
      flowStep.value = 'config'
      return
    }

    flowPanelOpen.value = true
    flowStep.value = 'config'
    flow.stage = 'config'
    panelError.value = null

    hydratePaymentContactFromUser(auth.user)
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

watch(
  () => route.query,
  () => {
    if (route.query.auth === 'reset-password') {
      resetToken.value = String(route.query.token || '')
      resetEmail.value = String(route.query.email || '')
      authModalOpen.value = false
      flowPanelOpen.value = false
    }
  },
  { immediate: true }
)

onMounted(async () => {
  auth.restore()

  try {
    const res = await $fetch<AppConfig>(`${apiBase()}/api/config`)
    flow.setConfig(res)
  } catch {
    flow.setConfig({
      enable_payment: true,
      price_per_document: 100,
      currency: 'KES',
      max_file_size_mb: 500,
      max_pages: 3000,
    })
  }

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

  flow.setSelectedFile(file)
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  if (!isPdfFile(file)) {
    panelError.value = 'Only PDF files are allowed.'
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

  if (!isPdfFile(file)) {
    panelError.value = 'Only PDF files are allowed.'
    return
  }

  prepareNewFile(file)
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

function statusColor(status: string): 'success' | 'warning' | 'error' | 'primary' | 'neutral' {
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'error'
  if (status === 'processing') return 'warning'
  return 'primary'
}

function openFlowPanel(step: 'config' | 'payment' | 'progress') {
  if (!flow.selectedFile) return
  flowStep.value = step
  flowPanelOpen.value = true
  if (step === 'config') flow.stage = 'config'
  if (step === 'payment') flow.stage = 'payment'
}

function goToPaymentStep() {
  if (!flow.selectedFile) return
  flowStep.value = 'payment'
  flow.stage = 'payment'
}

function goToConfigStep() {
  flowStep.value = 'config'
  flow.stage = 'config'
}

function goToProgressStep() {
  flowStep.value = 'progress'
  flowPanelOpen.value = true
  flow.stage = 'processing'
}

function clearFile() {
  stopPaymentPolling()
  stopJobPolling()
  unsubscribeFromJobChannel()

  panelError.value = null
  paymentStatusMessage.value = ''
  paymentAccountNotice.value = null

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

  if (!/^(254[0-9]{9}|0[0-9]{9})$/.test(rawPhone)) {
    panelError.value = 'Use format 254XXXXXXXXX or 0XXXXXXXXX for M-Pesa phone number.'
    return
  }

  try {
    flow.paymentPolling = true
    paymentStatusMessage.value = 'Sending M-Pesa prompt...'

    const body = { phone, email }
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
      ? 'Account created for this email. Next time you log in, use Forgot password to set your password.'
      : null

    startPaymentPolling(res.reference)
  } catch (e: any) {
    flow.paymentPolling = false
    const statusCode = Number(e?.response?.status || e?.statusCode || e?.status || 0)
    const errorCode = e?.data?.code

    if (errorCode === 'existing_user_sign_in_required' || statusCode === 409) {
      openAuthModal('login')
      authEmail.value = email
      authPassword.value = ''
      authPasswordConfirmation.value = ''
      registerName.value = ''
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
        paymentStatusMessage.value = 'Payment confirmed. You can now process the document.'
        stopPaymentPolling()
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

async function submitUpload() {
  const file = flow.selectedFile

  panelError.value = null
  if (!file) {
    panelError.value = 'Please select a PDF first.'
    return
  }

  if (!flow.paymentReference) {
    panelError.value = 'Payment must be completed before processing.'
    return
  }

  if (!auth.token) {
    panelError.value = 'Please login first to continue.'
    openAuthModal('login')
    return
  }

  uploading.value = true
  goToProgressStep()
  flow.setJob({
    status: 'processing',
    progress: 0,
    processed_pages: 0,
    total_pages: 0,
    eta_seconds: null,
    error_message: null,
  })

  try {
    const form = new FormData()
    form.append('file', file)
    form.append('margin', flow.uploadOptions.margin)
    form.append('font_size_pt', String(flow.uploadOptions.font_size_pt))
    form.append('payment_reference', flow.paymentReference)

    const res = await $fetch<{ job_id: string }>(`${apiBase()}/api/upload`, {
      method: 'POST',
      body: form,
      headers: authHeaders(),
    })

    flow.setJobId(res.job_id)
    goToProgressStep()

    await subscribeToJobChannel(res.job_id)
    await fetchJobSnapshot(res.job_id)
  } catch (e: any) {
    panelError.value = e?.data?.message || 'Could not upload your PDF.'
    goToPaymentStep()
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

function openAuthModal(mode: 'login' | 'register' | 'forgot') {
  authMode.value = mode
  authError.value = null
  authMessage.value = null
  authModalOpen.value = true

  if (auth.user?.email && !authEmail.value.trim()) {
    authEmail.value = auth.user.email
  } else if (!authEmail.value.trim() && paymentEmail.value.trim()) {
    authEmail.value = paymentEmail.value.trim()
  }
}

async function login() {
  authLoading.value = true
  authError.value = null
  authMessage.value = null

  try {
    const res = await $fetch<{ token: string; user: AuthUser }>(`${apiBase()}/api/auth/login`, {
      method: 'POST',
      body: {
        email: authEmail.value.trim(),
        password: authPassword.value,
      },
    })

    auth.setAuth(res.token, res.user)
    hydratePaymentContactFromUser(res.user)
    authModalOpen.value = false
  } catch (e: any) {
    authError.value = e?.data?.message || 'Could not login.'
  } finally {
    authLoading.value = false
  }
}

async function register() {
  authLoading.value = true
  authError.value = null
  authMessage.value = null

  try {
    const res = await $fetch<{ token: string; user: AuthUser }>(`${apiBase()}/api/auth/register`, {
      method: 'POST',
      body: {
        name: registerName.value.trim(),
        email: authEmail.value.trim(),
        password: authPassword.value,
        password_confirmation: authPasswordConfirmation.value,
      },
    })

    auth.setAuth(res.token, res.user)
    hydratePaymentContactFromUser(res.user)
    authModalOpen.value = false
  } catch (e: any) {
    authError.value = e?.data?.message || 'Could not register.'
  } finally {
    authLoading.value = false
  }
}

async function sendForgotPassword() {
  authLoading.value = true
  authError.value = null
  authMessage.value = null

  try {
    await $fetch<{ message: string }>(`${apiBase()}/api/auth/forgot-password`, {
      method: 'POST',
      body: {
        email: authEmail.value.trim(),
      },
    })
    authMessage.value = `Password reset email sent to ${authEmail.value.trim()}.`
  } catch (e: any) {
    authError.value = e?.data?.message || 'Could not send reset link.'
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

async function submitResetPassword() {
  resetLoading.value = true
  resetError.value = null
  resetMessage.value = null

  try {
    const res = await $fetch<{ message: string }>(`${apiBase()}/api/auth/reset-password`, {
      method: 'POST',
      body: {
        token: resetToken.value,
        email: resetEmail.value.trim(),
        password: resetPassword.value,
        password_confirmation: resetPasswordConfirmation.value,
      },
    })

    resetMessage.value = res.message || 'Password reset successful.'
  } catch (e: any) {
    resetError.value = e?.data?.message || 'Could not reset password.'
  } finally {
    resetLoading.value = false
  }
}

function exitResetMode() {
  router.push({
    path: '/',
    query: {},
  })
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
    anchor.download = `numbered-${sourceFilename}`
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
.app-shell {
  background:
    radial-gradient(1000px 500px at 90% -15%, rgba(37, 99, 235, 0.11), transparent 62%),
    radial-gradient(800px 420px at -8% 105%, rgba(59, 130, 246, 0.09), transparent 60%),
    linear-gradient(180deg, #f7fbff 0%, #eef2f7 100%);
}

.dropzone-card {
  background: rgba(255, 255, 255, 0.88);
  border-color: #cbd5e1;
  box-shadow: 0 35px 70px -45px rgba(15, 23, 42, 0.45);
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
}

.dropzone-card:hover {
  transform: translateY(-2px);
  border-color: #3b82f6;
  box-shadow: 0 40px 80px -50px rgba(37, 99, 235, 0.45);
}

.dropzone-card.dragging {
  border-color: #2563eb;
  background: rgba(239, 246, 255, 0.92);
  transform: translateY(-2px) scale(1.002);
}

.ambient-lines {
  position: absolute;
  inset: 0;
  opacity: 0.3;
  background-image:
    linear-gradient(to right, rgba(59, 130, 246, 0.12) 1px, transparent 1px),
    linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 72px 100%, 18px 100%;
  animation: move-lines 18s linear infinite;
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
  background: rgba(56, 189, 248, 0.45);
  animation: float-orb-a 8s ease-in-out infinite;
}

.ambient-orb-b {
  right: -100px;
  bottom: 2%;
  background: rgba(59, 130, 246, 0.35);
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
