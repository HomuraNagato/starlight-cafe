<script lang="ts">
  import { messages } from '$lib/i18n/messages';
</script>

<svelte:head>
  <title>{$messages.home.pageTitle}</title>
</svelte:head>

<main class="min-h-screen bg-base-100">
  <section
    class="hero min-h-[calc(100vh-7rem)] bg-cover bg-center sm:min-h-[calc(100vh-6rem)]"
    style="background-image: linear-gradient(90deg, rgba(15, 23, 42, 0.68), rgba(15, 23, 42, 0.30) 48%, rgba(15, 23, 42, 0.10)), url('/images/wallpapers/Fate%20Saber%20candy%20in%20mouth.jpg');"
  >
    <div
      class="hero-content w-full justify-start px-6 py-20 text-left text-white sm:px-10 lg:px-16"
    >
      <div class="max-w-2xl">
        <h1 class="text-4xl font-semibold leading-tight sm:text-6xl">{$messages.home.title}</h1>
        <p class="mt-5 max-w-xl text-base leading-7 text-white/82 sm:text-lg">
          {$messages.home.subtitle}
        </p>
      </div>
    </div>
  </section>

  <section class="border-t border-base-300 bg-base-100 px-6 py-8 sm:px-10 lg:px-16">
    <div class="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-base font-semibold">{$messages.home.progressTitle}</h2>
        <p class="mt-1 text-sm text-base-content/65">
          {$messages.home.progressText}
        </p>
      </div>
    </div>
  </section>
</main>
