<script lang="ts">
  import { page } from '$app/stores';
  import { signOut } from '@auth/sveltekit/client';
  import { LogIn, LogOut, UserRound } from '@lucide/svelte';

  $: session = $page.data.session;
  $: user = session?.user;
  $: callbackPath =
    $page.url.pathname === '/login'
      ? ($page.url.searchParams.get('callbackUrl') ?? '/')
      : `${$page.url.pathname}${$page.url.search}`;

  function currentUrl() {
    return new URL(`${$page.url.pathname}${$page.url.search}`, window.location.origin).toString();
  }
</script>

{#if user}
  <div class="dropdown dropdown-end">
    <button
      type="button"
      class="btn btn-ghost btn-circle btn-sm"
      aria-label="Account menu"
      title={user.name ?? user.email ?? 'Account'}
    >
      {#if user.image}
        <img
          src={user.image}
          alt=""
          referrerpolicy="no-referrer"
          class="h-7 w-7 rounded-full object-cover"
        />
      {:else}
        <UserRound aria-hidden="true" class="h-5 w-5" />
      {/if}
    </button>
    <ul
      class="menu dropdown-content z-[60] mt-2 w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
    >
      <li class="menu-title min-w-0">
        <span class="truncate">{user.name ?? user.email ?? 'Signed in'}</span>
      </li>
      <li>
        <button type="button" onclick={() => signOut({ redirectTo: currentUrl() })}>
          <LogOut aria-hidden="true" class="h-4 w-4" />
          Sign out
        </button>
      </li>
    </ul>
  </div>
{:else}
  <form method="POST" action="/auth/signin/google">
    <input type="hidden" name="callbackUrl" value={callbackPath} />
    <button
      type="submit"
      class="btn btn-ghost btn-circle btn-sm"
      aria-label="Sign in with Google"
      title="Sign in with Google"
    >
      <LogIn aria-hidden="true" class="h-5 w-5" />
    </button>
  </form>
{/if}
