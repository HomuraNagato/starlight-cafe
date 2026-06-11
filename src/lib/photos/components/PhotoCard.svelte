<script lang="ts">
  import Check from '@lucide/svelte/icons/check';
  import Download from '@lucide/svelte/icons/download';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import LinkIcon from '@lucide/svelte/icons/link';
  import { messages } from '$lib/i18n/messages';
  import { dateFor, dimensionsFor } from '$lib/photos/format';
  import type { PhotoImage } from '$lib/photos/types';

  export let image: PhotoImage;
  export let imageClass = '';
  export let copiedImageId = '';
  export let onOpen: (image: PhotoImage) => void = () => {};
  export let onCopy: (image: PhotoImage) => void = () => {};
</script>

<figure class="overflow-hidden rounded border border-base-300 bg-base-100 shadow-sm">
  <button
    type="button"
    class="block w-full"
    aria-label={`${$messages.photos.view}: ${image.filename}`}
    onclick={() => onOpen(image)}
  >
    <img class={imageClass} src={image.thumbUrl} alt={image.filename} loading="lazy" />
  </button>
  <figcaption class="flex items-start justify-between gap-2 p-2">
    <div class="min-w-0">
      <span class="block truncate text-xs font-medium text-base-content/70">
        {image.filename}
      </span>
      <span class="mt-1 block truncate text-xs text-base-content/45">
        {#if dateFor(image)}
          {dateFor(image)}
        {/if}
        {#if dimensionsFor(image)}
          {dateFor(image) ? ' · ' : ''}{dimensionsFor(image)}
        {/if}
      </span>
    </div>
    <div class="flex shrink-0 items-center gap-1">
      <a
        class="btn btn-ghost btn-xs btn-square"
        href={image.imageUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={$messages.photos.viewOriginal}
        title={$messages.photos.viewOriginal}
      >
        <ExternalLink class="h-4 w-4" aria-hidden="true" />
      </a>
      <button
        type="button"
        class="btn btn-ghost btn-xs btn-square"
        aria-label={$messages.photos.copyLink}
        title={$messages.photos.copyLink}
        onclick={() => onCopy(image)}
      >
        {#if copiedImageId === image.id}
          <Check class="h-4 w-4 text-success" aria-hidden="true" />
        {:else}
          <LinkIcon class="h-4 w-4" aria-hidden="true" />
        {/if}
      </button>
      <a
        class="btn btn-ghost btn-xs btn-square"
        href={image.downloadUrl}
        aria-label={$messages.photos.download}
        title={$messages.photos.download}
      >
        <Download class="h-4 w-4" aria-hidden="true" />
      </a>
    </div>
  </figcaption>
</figure>
