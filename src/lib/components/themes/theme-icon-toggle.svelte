<script lang="ts">
  import { onMount } from 'svelte';

  import Sun from './sun.svelte';
  import Moon from './moon.svelte';

  let dark_mode = false;
  $: moon_swap = dark_mode ? 'swap-off' : 'swap-on';
  $: sun_swap = dark_mode ? 'swap-on' : 'swap-off';
  $: theme = getTheme();

  onMount(() => {
    const saved = window.localStorage.getItem('theme');
    dark_mode = saved
      ? saved === 'forest'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme();
  });

  function getTheme() {
    return dark_mode ? 'forest' : 'winter';
  }

  function applyTheme() {
    const nextTheme = getTheme();
    document.documentElement.dataset.theme = nextTheme;
    document.body.dataset.theme = nextTheme;
    window.localStorage.setItem('theme', nextTheme);
  }

  function toggleTheme() {
    dark_mode = !dark_mode;
    applyTheme();
  }
</script>

<button
  type="button"
  class="btn btn-ghost btn-circle btn-sm"
  aria-label="Toggle theme"
  on:click={toggleTheme}
>
  <span class="swap swap-rotate {dark_mode ? 'swap-active' : ''}">
    <Moon swap={moon_swap}></Moon>
    <Sun swap={sun_swap}></Sun>
  </span>
</button>
