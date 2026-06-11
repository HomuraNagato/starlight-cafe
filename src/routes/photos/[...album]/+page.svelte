<script lang="ts">
  import { onMount } from 'svelte';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Check from '@lucide/svelte/icons/check';
  import Images from '@lucide/svelte/icons/images';
  import Share2 from '@lucide/svelte/icons/share-2';
  import { messages } from '$lib/i18n/messages';
  import PhotoCard from '$lib/photos/components/PhotoCard.svelte';
  import PhotoViewer from '$lib/photos/components/PhotoViewer.svelte';
  import {
    isPhotoSortMode,
    isPhotoViewMode,
    sortPhotos,
    type PhotoSortMode,
    type PhotoViewMode,
  } from '$lib/photos/sort';
  import type { PhotoImage } from '$lib/photos/types';

  export let data: { album: string; images: PhotoImage[]; error?: string };

  const VIEW_MODE_STORAGE_KEY = 'starlight-photo-view-mode';
  const SORT_MODE_STORAGE_KEY = 'starlight-photo-sort-mode';

  let copiedAlbumLink = false;
  let copiedImageId = '';
  let isPreparingThumbnails = false;
  let thumbnailPreparationFailed = false;
  let viewMode: PhotoViewMode = 'square';
  let sortMode: PhotoSortMode = 'filename-asc';
  let selectedImage: PhotoImage | null = null;

  $: sortedImages = sortPhotos(data.images, sortMode);
  $: gridClass =
    viewMode === 'large'
      ? 'grid gap-3 lg:grid-cols-2'
      : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  $: imageClass =
    viewMode === 'square'
      ? 'aspect-square w-full bg-base-300 object-cover'
      : viewMode === 'fit'
        ? 'aspect-square w-full bg-base-300 object-contain p-2'
        : 'max-h-[calc(100vh-13rem)] min-h-80 w-full bg-base-300 object-contain';

  onMount(() => {
    const storedMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY);

    if (isPhotoViewMode(storedMode)) {
      viewMode = storedMode;
    }

    const storedSortMode = localStorage.getItem(SORT_MODE_STORAGE_KEY);

    if (isPhotoSortMode(storedSortMode)) {
      sortMode = storedSortMode;
    }

    if (!data.error && data.images.length > 0) {
      void prewarmAlbumThumbnails();
    }
  });

  function setViewMode(nextMode: PhotoViewMode) {
    viewMode = nextMode;
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, nextMode);
  }

  function setSortMode(nextMode: PhotoSortMode) {
    sortMode = nextMode;
    localStorage.setItem(SORT_MODE_STORAGE_KEY, nextMode);
  }

  async function prewarmAlbumThumbnails() {
    isPreparingThumbnails = true;
    thumbnailPreparationFailed = false;

    try {
      const response = await fetch(`/photos/api/albums/${encodeURIComponent(data.album)}/prewarm`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Thumbnail prewarm failed with status ${response.status}`);
      }
    } catch (error) {
      console.error(error);
      thumbnailPreparationFailed = true;
    } finally {
      window.setTimeout(() => {
        isPreparingThumbnails = false;
      }, 1600);
    }
  }

  async function copyImageLink(image: PhotoImage) {
    const url = new URL(image.imageUrl, window.location.href).toString();
    await navigator.clipboard.writeText(url);
    copiedImageId = image.id;

    setTimeout(() => {
      if (copiedImageId === image.id) {
        copiedImageId = '';
      }
    }, 1800);
  }

  async function copyAlbumLink() {
    await navigator.clipboard.writeText(window.location.href);
    copiedAlbumLink = true;

    setTimeout(() => {
      copiedAlbumLink = false;
    }, 1800);
  }

  function openViewbox(image: PhotoImage) {
    selectedImage = image;
  }

  function handleViewboxClose() {
    selectedImage = null;
  }

  function selectedImageIndex() {
    if (!selectedImage) {
      return -1;
    }

    return sortedImages.findIndex((image) => image.id === selectedImage?.id);
  }

  function showPreviousImage() {
    const currentIndex = selectedImageIndex();

    if (currentIndex < 0 || sortedImages.length === 0) {
      return;
    }

    selectedImage = sortedImages[currentIndex <= 0 ? sortedImages.length - 1 : currentIndex - 1];
  }

  function showNextImage() {
    const currentIndex = selectedImageIndex();

    if (currentIndex < 0 || sortedImages.length === 0) {
      return;
    }

    selectedImage = sortedImages[currentIndex >= sortedImages.length - 1 ? 0 : currentIndex + 1];
  }

  function showFirstImage() {
    if (sortedImages.length === 0) {
      return;
    }

    selectedImage = sortedImages[0];
  }

  function showLastImage() {
    if (sortedImages.length === 0) {
      return;
    }

    selectedImage = sortedImages[sortedImages.length - 1];
  }

  function copySelectedImageLink() {
    if (!selectedImage) {
      return;
    }

    void copyImageLink(selectedImage);
  }
</script>

<svelte:head>
  <title>{data.album} | {$messages.photos.title}</title>
</svelte:head>

<main class="min-h-[calc(100vh-3.5rem)] bg-base-200">
  <div class="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
    <header
      class="flex flex-col gap-3 border-b border-base-300 pb-5 md:flex-row md:items-end md:justify-between"
    >
      <div class="min-w-0">
        <div class="breadcrumbs p-0 text-sm text-base-content/55">
          <ul>
            <li>
              <a href="/photos">{$messages.photos.albums}</a>
            </li>
            <li>{data.album}</li>
          </ul>
        </div>
        <a class="btn btn-ghost btn-sm mb-3 w-fit" href="/photos">
          <ArrowLeft class="h-4 w-4" aria-hidden="true" />
          {$messages.photos.backToAlbums}
        </a>
        <p
          class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"
        >
          <Images class="h-4 w-4" aria-hidden="true" />
          {$messages.photos.photos}
        </p>
        <h1 class="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">{data.album}</h1>
        <p class="mt-1 max-w-2xl text-sm text-base-content/65">
          {data.images.length}
          {$messages.photos.photos}
        </p>
      </div>
      <button type="button" class="btn btn-ghost btn-sm w-fit" onclick={copyAlbumLink}>
        {#if copiedAlbumLink}
          <Check class="h-4 w-4 text-success" aria-hidden="true" />
          {$messages.photos.copied}
        {:else}
          <Share2 class="h-4 w-4" aria-hidden="true" />
          {$messages.photos.copyAlbumLink}
        {/if}
      </button>
    </header>

    {#if data.error}
      <section class="grid min-h-72 place-items-center rounded border border-error/30 bg-base-100">
        <div class="max-w-md px-5 text-center">
          <p class="text-sm font-medium text-error">{$messages.photos.unableToLoad}</p>
          <p class="mt-2 text-sm text-base-content/60">{$messages.photos.tryAgainLater}</p>
        </div>
      </section>
    {:else if data.images.length === 0}
      <section class="grid min-h-72 place-items-center rounded border border-base-300 bg-base-100">
        <p class="text-sm text-base-content/60">{$messages.photos.empty}</p>
      </section>
    {:else}
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-sm text-base-content/60">
            {data.images.length}
            {$messages.photos.photos}
          </p>

          {#if isPreparingThumbnails}
            <span class="badge badge-ghost gap-2">
              <span class="loading loading-spinner loading-xs"></span>
              {$messages.photos.preparingThumbnails}
            </span>
          {/if}

          {#if thumbnailPreparationFailed}
            <span class="badge badge-warning">{$messages.photos.thumbnailPreparationFailed}</span>
          {/if}
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xs font-medium uppercase tracking-wide text-base-content/55">
              {$messages.photos.sort}
            </span>
            <select
              class="select select-bordered select-sm min-h-9"
              aria-label={$messages.photos.sort}
              bind:value={sortMode}
              onchange={() => setSortMode(sortMode)}
            >
              <option value="filename-asc">{$messages.photos.filename}</option>
              <option value="newest">{$messages.photos.newest}</option>
              <option value="oldest">{$messages.photos.oldest}</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-medium uppercase tracking-wide text-base-content/55">
              {$messages.photos.view}
            </span>
            <div class="join">
              <button
                type="button"
                class={`btn join-item btn-sm ${viewMode === 'square' ? 'btn-primary' : 'btn-ghost'}`}
                aria-pressed={viewMode === 'square'}
                onclick={() => setViewMode('square')}
              >
                {$messages.photos.square}
              </button>
              <button
                type="button"
                class={`btn join-item btn-sm ${viewMode === 'fit' ? 'btn-primary' : 'btn-ghost'}`}
                aria-pressed={viewMode === 'fit'}
                onclick={() => setViewMode('fit')}
              >
                {$messages.photos.fit}
              </button>
              <button
                type="button"
                class={`btn join-item btn-sm ${viewMode === 'large' ? 'btn-primary' : 'btn-ghost'}`}
                aria-pressed={viewMode === 'large'}
                onclick={() => setViewMode('large')}
              >
                {$messages.photos.large}
              </button>
            </div>
          </div>
        </div>
      </div>

      <section class={gridClass}>
        {#each sortedImages as image}
          <PhotoCard
            {image}
            {imageClass}
            {copiedImageId}
            onOpen={openViewbox}
            onCopy={(photo) => void copyImageLink(photo)}
          />
        {/each}
      </section>
    {/if}
  </div>
</main>

<PhotoViewer
  images={sortedImages}
  {selectedImage}
  {copiedImageId}
  onClose={handleViewboxClose}
  onCopy={(photo) => void copyImageLink(photo)}
  onPrevious={showPreviousImage}
  onNext={showNextImage}
  onFirst={showFirstImage}
  onLast={showLastImage}
/>
