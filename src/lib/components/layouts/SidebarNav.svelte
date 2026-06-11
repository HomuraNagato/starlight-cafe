<script lang="ts" context="module">
  import type { Component } from 'svelte';
  import type { LucideProps } from '@lucide/svelte';

  export type SidebarNavItem = {
    id: string;
    label: string;
    href?: string;
    badge?: string;
    disabled?: boolean;
    icon?: Component<LucideProps>;
  };
</script>

<script lang="ts">
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';

  export let title = '';
  export let eyebrow = '';
  export let items: SidebarNavItem[] = [];
  export let activeId = items[0]?.id ?? '';
  export let collapsed = false;
  export let collapsible = false;
  export let onSelect: (item: SidebarNavItem) => void = () => {};

  function selectItem(item: SidebarNavItem) {
    if (item.disabled) return;
    onSelect(item);
  }
</script>

<aside class="lg:sticky lg:top-20 lg:self-start">
  <nav
    class={`rounded border border-base-300 bg-base-100 p-2 shadow-sm lg:min-h-[calc(100vh-7rem)] ${
      collapsed ? 'lg:w-16' : 'lg:w-56'
    }`}
    aria-label={title || 'Section navigation'}
  >
    <div
      class={`hidden px-3 pb-3 pt-2 lg:flex ${collapsed ? 'justify-center px-1' : 'items-start justify-between gap-3'}`}
    >
      {#if !collapsed && (title || eyebrow)}
        <div>
          {#if eyebrow}
            <p class="text-xs font-medium uppercase tracking-[0.18em] text-base-content/45">
              {eyebrow}
            </p>
          {/if}
          {#if title}
            <h2 class="mt-1 text-sm font-semibold text-base-content">{title}</h2>
          {/if}
        </div>
      {/if}

      {#if collapsible}
        <button
          class="btn btn-ghost btn-circle btn-xs"
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          on:click={() => (collapsed = !collapsed)}
        >
          <ChevronLeft
            aria-hidden="true"
            size={16}
            class={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      {/if}
    </div>

    {#if collapsed && title}
      <div class="hidden justify-center pb-2 lg:flex">
        <span class="text-xs font-semibold text-base-content/50" {title}>
          {title.slice(0, 1).toUpperCase()}
        </span>
      </div>
    {/if}

    <ul
      class="menu menu-horizontal flex-nowrap gap-1 overflow-x-auto p-0 lg:menu-vertical lg:gap-1 lg:overflow-visible"
    >
      {#each items as item}
        <li>
          {#if item.href}
            <a
              href={item.disabled ? undefined : item.href}
              aria-disabled={item.disabled}
              title={collapsed ? item.label : undefined}
              class={`min-h-9 whitespace-nowrap text-sm ${
                collapsed ? 'lg:justify-center lg:px-0' : 'lg:justify-between'
              } ${
                activeId === item.id ? 'active' : ''
              } ${item.disabled ? 'disabled pointer-events-none opacity-45' : ''}`}
              on:click={() => selectItem(item)}
            >
              <span class={collapsed ? 'hidden lg:inline-flex' : 'inline-flex items-center gap-2'}>
                {#if item.icon}
                  <svelte:component this={item.icon} aria-hidden="true" size={17} />
                {/if}
                {#if !collapsed}
                  <span>{item.label}</span>
                {/if}
              </span>
              <span class={collapsed ? 'lg:hidden' : 'hidden'}>
                {item.label}
              </span>
              {#if item.badge && !collapsed}
                <span class="badge badge-sm badge-ghost">{item.badge}</span>
              {/if}
            </a>
          {:else}
            <button
              type="button"
              aria-current={activeId === item.id ? 'page' : undefined}
              aria-disabled={item.disabled}
              title={collapsed ? item.label : undefined}
              class={`min-h-9 whitespace-nowrap text-sm ${
                collapsed ? 'lg:justify-center lg:px-0' : 'lg:justify-between'
              } ${
                activeId === item.id ? 'active' : ''
              } ${item.disabled ? 'disabled pointer-events-none opacity-45' : ''}`}
              on:click={() => selectItem(item)}
            >
              <span class={collapsed ? 'hidden lg:inline-flex' : 'inline-flex items-center gap-2'}>
                {#if item.icon}
                  <svelte:component this={item.icon} aria-hidden="true" size={17} />
                {/if}
                {#if !collapsed}
                  <span>{item.label}</span>
                {/if}
              </span>
              <span class={collapsed ? 'lg:hidden' : 'hidden'}>
                {item.label}
              </span>
              {#if item.badge && !collapsed}
                <span class="badge badge-sm badge-ghost">{item.badge}</span>
              {/if}
            </button>
          {/if}
        </li>
      {/each}
    </ul>
  </nav>
</aside>
