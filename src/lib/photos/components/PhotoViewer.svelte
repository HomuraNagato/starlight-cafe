<script lang="ts">
  import { tick } from 'svelte';
  import CalendarDays from '@lucide/svelte/icons/calendar-days';
  import Camera from '@lucide/svelte/icons/camera';
  import Check from '@lucide/svelte/icons/check';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Download from '@lucide/svelte/icons/download';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import HardDrive from '@lucide/svelte/icons/hard-drive';
  import LinkIcon from '@lucide/svelte/icons/link';
  import Ruler from '@lucide/svelte/icons/ruler';
  import X from '@lucide/svelte/icons/x';
  import { messages } from '$lib/i18n/messages';
  import { dateFor, dimensionsFor, formatBytes } from '$lib/photos/format';
  import type { PhotoImage } from '$lib/photos/types';

  export let images: PhotoImage[] = [];
  export let selectedImage: PhotoImage | null = null;
  export let copiedImageId = '';
  export let onClose: () => void = () => {};
  export let onCopy: (image: PhotoImage) => void = () => {};
  export let onPrevious: () => void = () => {};
  export let onNext: () => void = () => {};
  export let onFirst: () => void = () => {};
  export let onLast: () => void = () => {};

  let viewboxDialog: HTMLDialogElement | null = null;

  $: selectedImagePosition = selectedImage
    ? images.findIndex((image) => image.id === selectedImage?.id)
    : -1;
  $: if (selectedImage) {
    void showDialog();
  }

  async function showDialog() {
    await tick();

    if (selectedImage && !viewboxDialog?.open) {
      viewboxDialog?.showModal();
    }
  }

  function closeViewbox() {
    viewboxDialog?.close();
  }

  function handleViewboxClose() {
    onClose();
  }

  function copySelectedImageLink() {
    if (!selectedImage) {
      return;
    }

    onCopy(selectedImage);
  }

  function handleViewboxKeydown(event: KeyboardEvent) {
    if (!selectedImage || !viewboxDialog?.open) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onPrevious();
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onNext();
    }

    if (event.key === 'Home') {
      event.preventDefault();
      onFirst();
    }

    if (event.key === 'End') {
      event.preventDefault();
      onLast();
    }

    if (event.key === 'Escape') {
      closeViewbox();
    }
  }
</script>

<svelte:window onkeydown={handleViewboxKeydown} />

<dialog bind:this={viewboxDialog} class="modal" onclose={handleViewboxClose}>
  {#if selectedImage}
    <div
      class="modal-box flex max-h-[92dvh] max-w-6xl flex-col gap-3 overflow-hidden bg-black p-0 text-white"
    >
      <div class="flex min-h-14 items-center justify-between gap-3 border-b border-white/10 px-3">
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-white">{selectedImage.filename}</p>
          {#if selectedImagePosition >= 0}
            <p class="text-xs text-white/55">
              {selectedImagePosition + 1} / {images.length}
            </p>
          {/if}
          <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45">
            {#if dateFor(selectedImage)}
              <span class="inline-flex items-center gap-1">
                <CalendarDays class="h-3.5 w-3.5" aria-hidden="true" />
                {dateFor(selectedImage)}
              </span>
            {/if}
            {#if dimensionsFor(selectedImage)}
              <span class="inline-flex items-center gap-1">
                <Ruler class="h-3.5 w-3.5" aria-hidden="true" />
                {dimensionsFor(selectedImage)}
              </span>
            {/if}
            <span class="inline-flex items-center gap-1">
              <HardDrive class="h-3.5 w-3.5" aria-hidden="true" />
              {formatBytes(selectedImage.metadata.sizeBytes)}
            </span>
            {#if selectedImage.metadata.cameraModel}
              <span class="inline-flex items-center gap-1">
                <Camera class="h-3.5 w-3.5" aria-hidden="true" />
                {selectedImage.metadata.cameraModel}
              </span>
            {/if}
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1">
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-square text-white hover:bg-white/10"
            aria-label={$messages.photos.copyLink}
            title={$messages.photos.copyLink}
            onclick={copySelectedImageLink}
          >
            {#if copiedImageId === selectedImage.id}
              <Check class="h-5 w-5 text-success" aria-hidden="true" />
            {:else}
              <LinkIcon class="h-5 w-5" aria-hidden="true" />
            {/if}
          </button>
          <a
            class="btn btn-ghost btn-sm btn-square text-white hover:bg-white/10"
            href={selectedImage.imageUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={$messages.photos.viewOriginal}
            title={$messages.photos.viewOriginal}
          >
            <ExternalLink class="h-5 w-5" aria-hidden="true" />
          </a>
          <a
            class="btn btn-ghost btn-sm btn-square text-white hover:bg-white/10"
            href={selectedImage.downloadUrl}
            aria-label={$messages.photos.download}
            title={$messages.photos.download}
          >
            <Download class="h-5 w-5" aria-hidden="true" />
          </a>
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-square text-white hover:bg-white/10"
            aria-label={$messages.photos.close}
            title={$messages.photos.close}
            onclick={closeViewbox}
          >
            <X class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div class="relative grid min-h-0 flex-1 place-items-center bg-black p-3">
        <img
          class="max-h-[calc(92dvh-5rem)] max-w-full object-contain"
          src={selectedImage.thumbUrl}
          alt={selectedImage.filename}
        />

        <button
          type="button"
          class="absolute inset-y-0 left-0 flex w-1/3 items-center justify-start bg-transparent px-3 text-white/0 transition hover:bg-white/5 hover:text-white/70 focus-visible:text-white"
          aria-label={$messages.photos.previous}
          onclick={onPrevious}
        >
          <ChevronLeft class="h-7 w-7" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="absolute inset-y-0 right-0 flex w-1/3 items-center justify-end bg-transparent px-3 text-white/0 transition hover:bg-white/5 hover:text-white/70 focus-visible:text-white"
          aria-label={$messages.photos.next}
          onclick={onNext}
        >
          <ChevronRight class="h-7 w-7" aria-hidden="true" />
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop bg-black/85">
      <button aria-label={$messages.photos.close}>{$messages.photos.close}</button>
    </form>
  {/if}
</dialog>
