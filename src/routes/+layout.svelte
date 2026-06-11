<script lang="ts">
  import { onMount } from 'svelte';
  import '../tailwind.pcss';
  import NavMain from '$lib/components/navs/nav-main/NavMain.svelte';
  import { initialize_language } from '$lib/stores/language.store';

  onMount(() => {
    initialize_language();
  });
</script>

<NavMain />

<div>
  <slot></slot>
</div>
