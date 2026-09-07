<script setup lang="ts">
import { ref } from 'vue';
import { usePhotoEditor } from './use-photo-editor';
import type { Locale } from '@/i18n/config';
import { interpolate } from '@/i18n/ui';
import type { PhotoSpec } from '@/lib/photo/types';

const props = defineProps<{
  spec: PhotoSpec;
  locale: Locale;
  messages: Record<string, string>;
  mattingModelId?: string;
}>();

function t(key: string, params?: Record<string, string>): string {
  return interpolate(props.messages[key] ?? key, params);
}

const number = new Intl.NumberFormat(props.locale);
const editor = usePhotoEditor(props.spec, props.mattingModelId ?? 'u2netp', props.locale, t);
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

function onFiles(files: FileList | null | undefined): void {
  const file = files?.[0];
  if (file) void editor.acceptFile(file);
}

function onDrop(event: DragEvent): void {
  isDragging.value = false;
  onFiles(event.dataTransfer?.files);
}

function kb(bytes: number): string {
  return `${number.format(Math.round(bytes / 1024))} ${t('unit.kb')}`;
}
</script>

<template>
  <section class="rounded-xl border border-ink-200 bg-white p-5 shadow-sm" aria-labelledby="editor-heading">
    <h2 id="editor-heading" class="text-lg font-semibold text-ink-900">
      {{ t('editor.heading', { documentName: spec.documentName }) }}
    </h2>
    <p class="mt-1 text-sm text-ink-600">
      {{ t('editor.privacy') }}
    </p>

    <!-- Drop zone -->
    <div
      v-if="editor.status.value === 'idle' || editor.status.value === 'error'"
      class="mt-4 rounded-lg border-2 border-dashed p-8 text-center transition-colors"
      :class="isDragging ? 'border-brand-500 bg-brand-50' : 'border-ink-200'"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <p class="text-sm text-ink-600">{{ t('editor.drag') }}</p>
      <button
        type="button"
        class="mt-3 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        @click="fileInput?.click()"
      >
        {{ t('editor.choose') }}
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="sr-only"
        :aria-label="t('editor.choose')"
        @change="onFiles(($event.target as HTMLInputElement).files)"
      />
      <p class="mt-3 text-xs text-ink-400">{{ t('editor.formats') }}</p>
    </div>

    <!-- Status -->
    <p v-if="editor.isBusy.value" class="mt-4 text-sm text-ink-600" role="status" aria-live="polite">
      {{ t(editor.status.value === 'loading-models' ? 'editor.loading' : 'editor.processing') }}
    </p>

    <p
      v-if="editor.status.value === 'error' && editor.errorMessage.value"
      class="mt-4 rounded-md border border-bad-500/30 bg-bad-500/5 p-3 text-sm text-bad-500"
      role="alert"
    >
      {{ editor.errorMessage.value }}
    </p>

    <!-- Result -->
    <div v-if="editor.status.value === 'done' && editor.result.value" class="mt-5 grid gap-6 sm:grid-cols-[auto_1fr]">
      <div>
        <img
          :src="editor.photoUrl.value"
          :alt="t('editor.result-alt', { documentName: spec.documentName })"
          class="rounded-md border border-ink-200"
          :width="editor.result.value.plan.outputWidthPx / 2"
        />
        <p class="mt-2 text-xs text-ink-400">
          {{ editor.result.value.plan.outputWidthPx }}&times;{{ editor.result.value.plan.outputHeightPx }} {{ t('unit.px') }},
          {{ kb(editor.result.value.bytes) }}
        </p>
      </div>

      <div class="space-y-4">
        <p v-if="editor.blockingFindings.value.length === 0" class="text-sm font-medium text-ok-500">
          {{ t('editor.compliant') }}
        </p>
        <ul v-else class="space-y-1 text-sm text-bad-500" role="alert">
          <li v-for="f in editor.blockingFindings.value" :key="f.code">{{ f.message }}</li>
        </ul>
        <ul v-if="editor.warnings.value.length" class="space-y-1 text-sm text-warn-500">
          <li v-for="f in editor.warnings.value" :key="f.code">{{ f.message }}</li>
        </ul>

        <fieldset v-if="editor.backgroundColors.value.length > 1">
          <legend class="text-sm font-medium text-ink-800">{{ t('spec.background') }}</legend>
          <div class="mt-2 flex gap-2">
            <button
              v-for="(color, index) in editor.backgroundColors.value"
              :key="color"
              type="button"
              class="size-8 rounded border-2"
              :class="editor.backgroundIndex.value === index ? 'border-brand-600' : 'border-ink-200'"
              :style="{ backgroundColor: color }"
              :aria-label="t('editor.use-background', { color })"
              :aria-pressed="editor.backgroundIndex.value === index"
              @click="editor.backgroundIndex.value = index; editor.process()"
            />
          </div>
        </fieldset>

        <div class="flex flex-wrap gap-3">
          <a
            :href="editor.photoUrl.value"
            :download="`${spec.id}.jpg`"
            class="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {{ t('editor.download-photo') }}
          </a>
          <a
            v-if="editor.sheetUrl.value"
            :href="editor.sheetUrl.value"
            :download="`${spec.id}-4x6-sheet.jpg`"
            class="rounded-md border border-ink-200 px-4 py-2 text-sm font-medium text-ink-800 hover:bg-ink-50"
          >
            {{ t('editor.download-sheet', { count: number.format(editor.sheetCount.value) }) }}
          </a>
          <button
            type="button"
            class="rounded-md px-4 py-2 text-sm text-ink-600 hover:text-ink-900"
            @click="editor.reset()"
          >
            {{ t('editor.reset') }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
