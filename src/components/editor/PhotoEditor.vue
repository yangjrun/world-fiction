<script setup lang="ts">
import { ref } from 'vue';
import { usePhotoEditor } from './use-photo-editor';
import type { PhotoSpec } from '@/lib/photo/types';

const props = defineProps<{ spec: PhotoSpec; mattingModelId?: string }>();

const editor = usePhotoEditor(props.spec, props.mattingModelId ?? 'u2netp');
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
  return `${Math.round(bytes / 1024)}KB`;
}
</script>

<template>
  <section class="rounded-xl border border-ink-200 bg-white p-5 shadow-sm" aria-labelledby="editor-heading">
    <h2 id="editor-heading" class="text-lg font-semibold text-ink-900">
      Make your {{ spec.documentName }}
    </h2>
    <p class="mt-1 text-sm text-ink-600">
      Everything runs on your device. Your photo is never uploaded.
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
      <p class="text-sm text-ink-600">Drag a photo here, or</p>
      <button
        type="button"
        class="mt-3 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        @click="fileInput?.click()"
      >
        Choose a photo
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="sr-only"
        @change="onFiles(($event.target as HTMLInputElement).files)"
      />
      <p class="mt-3 text-xs text-ink-400">JPEG, PNG or WebP, up to 25MB</p>
    </div>

    <!-- Status -->
    <p v-if="editor.isBusy.value" class="mt-4 text-sm text-ink-600" role="status" aria-live="polite">
      {{ editor.status.value === 'loading-models' ? 'Loading the on-device models, this happens once…' : 'Processing your photo…' }}
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
          :alt="`Your finished ${spec.documentName}`"
          class="rounded-md border border-ink-200"
          :width="editor.result.value.plan.outputWidthPx / 2"
        />
        <p class="mt-2 text-xs text-ink-400">
          {{ editor.result.value.plan.outputWidthPx }}&times;{{ editor.result.value.plan.outputHeightPx }}px,
          {{ kb(editor.result.value.bytes) }}
        </p>
      </div>

      <div class="space-y-4">
        <p v-if="editor.blockingFindings.value.length === 0" class="text-sm font-medium text-ok-500">
          Meets every requirement we can measure.
        </p>
        <ul v-else class="space-y-1 text-sm text-bad-500" role="alert">
          <li v-for="f in editor.blockingFindings.value" :key="f.code">{{ f.message }}</li>
        </ul>
        <ul v-if="editor.warnings.value.length" class="space-y-1 text-sm text-warn-500">
          <li v-for="f in editor.warnings.value" :key="f.code">{{ f.message }}</li>
        </ul>

        <fieldset v-if="editor.backgroundColors.value.length > 1">
          <legend class="text-sm font-medium text-ink-800">Background</legend>
          <div class="mt-2 flex gap-2">
            <button
              v-for="(color, index) in editor.backgroundColors.value"
              :key="color"
              type="button"
              class="size-8 rounded border-2"
              :class="editor.backgroundIndex.value === index ? 'border-brand-600' : 'border-ink-200'"
              :style="{ backgroundColor: color }"
              :aria-label="`Use background ${color}`"
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
            Download photo
          </a>
          <a
            v-if="editor.sheetUrl.value"
            :href="editor.sheetUrl.value"
            :download="`${spec.id}-4x6-sheet.jpg`"
            class="rounded-md border border-ink-200 px-4 py-2 text-sm font-medium text-ink-800 hover:bg-ink-50"
          >
            Download 4&times;6in sheet ({{ editor.sheetCount.value }} copies)
          </a>
          <button
            type="button"
            class="rounded-md px-4 py-2 text-sm text-ink-600 hover:text-ink-900"
            @click="editor.reset()"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
