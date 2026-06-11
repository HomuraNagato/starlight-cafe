<script lang="ts">
  import { page } from '$app/stores';
  import BriefcaseBusiness from '@lucide/svelte/icons/briefcase-business';
  import ChartCandlestick from '@lucide/svelte/icons/chart-candlestick';
  import LibraryBig from '@lucide/svelte/icons/library-big';
  import SidebarNav, { type SidebarNavItem } from '$lib/components/layouts/SidebarNav.svelte';

  const sidebarItems: SidebarNavItem[] = [
    { id: 'portfolio', label: 'Portfolio', href: '/digi-quark', icon: BriefcaseBusiness },
    { id: 'watchlist', label: 'Watchlist', href: '/digi-quark/watchlist', icon: ChartCandlestick },
    { id: 'algorithms', label: 'Algorithms', href: '/digi-quark/algorithms', icon: LibraryBig },
  ];

  let sidebarCollapsed = false;

  $: activeId = $page.url.pathname.startsWith('/digi-quark/algorithms')
    ? 'algorithms'
    : $page.url.pathname.startsWith('/digi-quark/watchlist')
      ? 'watchlist'
      : 'portfolio';
</script>

<div
  class={`mx-auto grid max-w-[96rem] gap-5 px-4 py-5 sm:px-6 lg:px-8 ${
    sidebarCollapsed ? 'lg:grid-cols-[4rem_minmax(0,1fr)]' : 'lg:grid-cols-[14rem_minmax(0,1fr)]'
  }`}
>
  <SidebarNav
    eyebrow="Digi Quant"
    title="Workspace"
    items={sidebarItems}
    {activeId}
    collapsible
    bind:collapsed={sidebarCollapsed}
  />

  <slot />
</div>
