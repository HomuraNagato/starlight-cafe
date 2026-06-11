<script lang="ts">
  import { onMount } from 'svelte';
  import Images from '@lucide/svelte/icons/images';
  import { messages } from '$lib/i18n/messages';
  import AlbumCard from '$lib/photos/components/AlbumCard.svelte';
  import { isAlbumSortMode, sortAlbums, type AlbumSortMode } from '$lib/photos/sort';
  import type { PhotoAlbum } from '$lib/photos/types';

  export let data: { albums: PhotoAlbum[]; error?: string };

  const ALBUM_SORT_STORAGE_KEY = 'starlight-photo-album-sort-mode';

  let albumSortMode: AlbumSortMode = 'newest';

  $: sortedAlbums = sortAlbums(data.albums, albumSortMode);

  onMount(() => {
    const storedSortMode = localStorage.getItem(ALBUM_SORT_STORAGE_KEY);

    if (isAlbumSortMode(storedSortMode)) {
      albumSortMode = storedSortMode;
    }
  });

  function setAlbumSortMode(nextMode: AlbumSortMode) {
    albumSortMode = nextMode;
    localStorage.setItem(ALBUM_SORT_STORAGE_KEY, nextMode);
  }
</script>

<svelte:head>
  <title>{$messages.photos.pageTitle}</title>
</svelte:head>

<main class="min-h-[calc(100vh-3.5rem)] bg-base-200">
  <div class="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
    <header
      class="flex flex-col gap-3 border-b border-base-300 pb-5 md:flex-row md:items-end md:justify-between"
    >
      <div class="min-w-0">
        <div class="breadcrumbs p-0 text-sm text-base-content/55">
          <ul>
            <li>{$messages.photos.albums}</li>
          </ul>
        </div>
        <p
          class="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"
        >
          <Images class="h-4 w-4" aria-hidden="true" />
          {$messages.photos.albums}
        </p>
        <h1 class="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
          {$messages.photos.title}
        </h1>
        <p class="mt-1 max-w-2xl text-sm text-base-content/65">
          {$messages.photos.subtitle}
        </p>
      </div>
    </header>

    {#if data.error}
      <section class="grid min-h-72 place-items-center rounded border border-error/30 bg-base-100">
        <div class="max-w-md px-5 text-center">
          <p class="text-sm font-medium text-error">{$messages.photos.unableToLoad}</p>
          <p class="mt-2 text-sm text-base-content/60">{$messages.photos.tryAgainLater}</p>
        </div>
      </section>
    {:else if data.albums.length === 0}
      <section class="grid min-h-72 place-items-center rounded border border-base-300 bg-base-100">
        <p class="text-sm text-base-content/60">{$messages.photos.empty}</p>
      </section>
    {:else}
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm text-base-content/60">
          {data.albums.length}
          {$messages.photos.albums}
        </p>

        <div class="flex items-center gap-2">
          <span class="text-xs font-medium uppercase tracking-wide text-base-content/55">
            {$messages.photos.sort}
          </span>
          <select
            class="select select-bordered select-sm min-h-9"
            aria-label={$messages.photos.sort}
            bind:value={albumSortMode}
            onchange={() => setAlbumSortMode(albumSortMode)}
          >
            <option value="title-asc">{$messages.photos.filename}</option>
            <option value="newest">{$messages.photos.newest}</option>
            <option value="oldest">{$messages.photos.oldest}</option>
          </select>
        </div>
      </div>

      <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {#each sortedAlbums as album}
          <AlbumCard {album} />
        {/each}
      </section>
    {/if}
  </div>
</main>
