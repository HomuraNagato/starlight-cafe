<script lang="ts">
  import { page } from '$app/stores';
  import { LogIn } from '@lucide/svelte';

  $: callbackUrl = $page.url.searchParams.get('callbackUrl') ?? '/';
</script>

<svelte:head>
  <title>Sign in | Starlight Cafe</title>
</svelte:head>

<main class="min-h-[calc(100vh-3.5rem)] bg-base-100">
  <section
    class="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-md flex-col justify-center px-5 py-12"
  >
    <div class="space-y-5 border-y border-base-300 py-8">
      <div class="space-y-2">
        <p class="text-sm font-medium uppercase tracking-wide text-primary">Private cafe</p>
        <h1 class="text-3xl font-semibold text-base-content">Sign in</h1>
        <p class="text-sm leading-6 text-base-content/70">
          Use your Google account to continue to Starlight Cafe.
        </p>
      </div>

      <form method="POST" action="/auth/signin/google">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <button type="submit" class="btn btn-primary w-full">
          <LogIn aria-hidden="true" class="h-4 w-4" />
          Continue with Google
        </button>
      </form>
    </div>
  </section>
</main>
