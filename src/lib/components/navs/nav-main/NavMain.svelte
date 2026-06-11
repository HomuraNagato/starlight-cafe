<script lang="ts">
  import { page } from '$app/stores';
  import ThemeIconToggle from '$lib/components/themes/theme-icon-toggle.svelte';
  import { messages } from '$lib/i18n/messages';
  import type { Messages } from '$lib/i18n/translations';
  import AuthButton from './AuthButton.svelte';
  import Language from './language.svelte';

  let mobileMenu: HTMLDetailsElement | null = null;

  type NavMessageKey = Exclude<keyof Messages['nav'], 'home' | 'openMenu'>;

  const navItems: Array<{ id: NavMessageKey; href: string }> = [
    { id: 'digiQuant', href: '/digi-quark' },
    { id: 'photos', href: '/photos' },
    { id: 'anime', href: '/anime' },
    { id: 'radio', href: '/radio' },
  ];

  $: pathname = $page.url.pathname;
  $: homeActive = pathname === '/';
  $: navLinks = navItems.map((item) => ({
    ...item,
    label: $messages.nav[item.id],
    active: pathname === item.href || pathname.startsWith(`${item.href}/`),
  }));

  function closeMobileMenu() {
    if (mobileMenu) {
      mobileMenu.open = false;
    }
  }

  function closeMobileMenuOnOutsideClick(event: MouseEvent) {
    if (!mobileMenu?.open || !(event.target instanceof Node)) {
      return;
    }

    if (!mobileMenu.contains(event.target)) {
      closeMobileMenu();
    }
  }
</script>

<svelte:window onclick={closeMobileMenuOnOutsideClick} />

<nav
  aria-label="Main navigation"
  class="navbar sticky top-0 z-50 min-h-14 border-b border-base-300 bg-base-100 px-3 shadow-sm sm:px-4"
>
  <div aria-label="navbar-start" class="navbar-start min-w-0 gap-1">
    <a
      href="/"
      id="nav-home"
      class={`btn btn-ghost btn-circle btn-sm ${homeActive ? 'btn-active' : ''}`}
      aria-label={$messages.nav.home}
      title={$messages.nav.home}
      data-sveltekit-reload
    >
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-5 w-5"
      >
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </svg>
    </a>

    <details bind:this={mobileMenu} class="dropdown md:hidden">
      <summary class="btn btn-ghost btn-circle btn-sm" aria-label={$messages.nav.openMenu}>
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-5 w-5"
        >
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      </summary>
      <ul
        class="menu dropdown-content z-[60] mt-2 w-48 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
      >
        {#each navLinks as item}
          <li>
            <a
              href={item.href}
              class={item.active ? 'active' : ''}
              data-sveltekit-reload
              onclick={closeMobileMenu}>{item.label}</a
            >
          </li>
        {/each}
      </ul>
    </details>
  </div>

  <div aria-label="navbar-center" class="navbar-center hidden md:flex">
    <ul class="menu menu-horizontal flex-nowrap gap-1 rounded-box p-0">
      {#each navLinks as item}
        <li>
          <a
            href={item.href}
            id={`nav-${item.id}`}
            class={`h-9 px-3 text-sm ${item.active ? 'active' : ''}`}
            data-sveltekit-reload
          >
            {item.label}
          </a>
        </li>
      {/each}
    </ul>
  </div>

  <div aria-label="navbar-end" class="navbar-end min-w-0 gap-2">
    <Language />
    <ThemeIconToggle />
    <AuthButton />
  </div>
</nav>
