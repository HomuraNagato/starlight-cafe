<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let open = false;
  export let title = '';
  export let size = 'max-w-lg';
  export let closeOnBackdrop = true;

  const dispatch = createEventDispatcher<{ close: void }>();

  function close() {
    dispatch('close');
  }

  function handleBackdrop(event: MouseEvent) {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      close();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') {
      close();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <div class="modal modal-open" role="presentation" on:mousedown={handleBackdrop}>
    <div class={`modal-box ${size}`} role="dialog" aria-modal="true" aria-label={title}>
      <div class="mb-4 flex items-center justify-between gap-4">
        <h2 class="text-base font-semibold">{title}</h2>
        <button class="btn btn-ghost btn-sm" type="button" on:click={close}>Close</button>
      </div>

      <slot />

      {#if $$slots.actions}
        <div class="modal-action">
          <slot name="actions" />
        </div>
      {/if}
    </div>
  </div>
{/if}
