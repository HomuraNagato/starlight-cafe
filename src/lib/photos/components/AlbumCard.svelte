<script lang="ts">
  import CalendarDays from '@lucide/svelte/icons/calendar-days';
  import ImageIcon from '@lucide/svelte/icons/image';
  import { messages } from '$lib/i18n/messages';
  import { formatDate } from '$lib/photos/format';
  import type { PhotoAlbum } from '$lib/photos/types';

  export let album: PhotoAlbum;
</script>

<a
  class="group overflow-hidden rounded border border-base-300 bg-base-100 shadow-sm transition hover:border-primary hover:shadow-md"
  href={`/photos/${encodeURIComponent(album.id)}`}
>
  <div class="aspect-[4/3] bg-base-300">
    {#if album.coverThumbUrl}
      <img
        class="h-full w-full object-cover transition group-hover:scale-[1.02]"
        src={album.coverThumbUrl}
        alt=""
        loading="lazy"
      />
    {:else}
      <div class="grid h-full place-items-center">
        <ImageIcon class="h-10 w-10 text-base-content/40" aria-hidden="true" />
      </div>
    {/if}
  </div>
  <div class="p-3">
    <h2 class="line-clamp-2 text-sm font-semibold leading-snug">{album.title}</h2>
    <p class="mt-1 text-xs text-base-content/55">
      {album.imageCount}
      {$messages.photos.photos}
    </p>
    <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/50">
      {#if album.modifiedAt}
        <span class="inline-flex items-center gap-1">
          <CalendarDays class="h-3.5 w-3.5" aria-hidden="true" />
          {formatDate(album.modifiedAt)}
        </span>
      {/if}
      {#if album.coverFilename}
        <span class="truncate">
          {$messages.photos.cover}: {album.coverFilename}
        </span>
      {/if}
    </div>
  </div>
</a>
