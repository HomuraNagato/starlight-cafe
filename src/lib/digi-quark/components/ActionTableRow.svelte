<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let rowKey: string;
  export let selected = false;
  export let selectable = false;
  export let revealed = false;
  export let busy = false;
  export let actionLabel = 'Remove';
  export let busyLabel = 'Removing';
  export let confirmAction = false;

  const dispatch = createEventDispatcher<{
    select: void;
    reveal: { key: string };
    hide: void;
    action: void;
    confirm: void;
    menu: { key: string; x: number; y: number };
  }>();

  let dragStartX = 0;
  let dragging = false;

  function startDrag(event: PointerEvent) {
    dragging = true;
    dragStartX = event.clientX;
  }

  function finishDrag(event: PointerEvent) {
    if (!dragging) return;
    const deltaX = event.clientX - dragStartX;
    if (deltaX < -48) {
      dispatch('reveal', { key: rowKey });
    } else if (deltaX > 32) {
      dispatch('hide');
    }
    dragging = false;
  }

  function openMenu(event: MouseEvent) {
    event.preventDefault();
    dispatch('menu', { key: rowKey, x: event.clientX, y: event.clientY });
  }

  function requestAction() {
    dispatch(confirmAction ? 'confirm' : 'action');
  }
</script>

<tr
  class={`group touch-pan-y transition ${selectable ? 'cursor-pointer hover:bg-base-200' : ''} ${revealed ? '-translate-x-2 bg-error/10' : ''}`}
  class:bg-base-200={selected}
  on:pointerdown={startDrag}
  on:pointerup={finishDrag}
  on:pointercancel={() => (dragging = false)}
  on:contextmenu={openMenu}
  on:click={() => selectable && dispatch('select')}
>
  <slot />
  <td class="text-right">
    <button
      class={`btn btn-error btn-xs transition-opacity ${revealed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      type="button"
      disabled={busy}
      on:click|stopPropagation={requestAction}
    >
      {busy ? busyLabel : actionLabel}
    </button>
  </td>
</tr>
