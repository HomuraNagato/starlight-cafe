<script lang="ts">
  import { change_language, locale, language_options } from '$lib/stores/language.store';
</script>

<select
  class="select select-bordered select-sm h-10 py-0 pl-2 pr-8"
  aria-label="Language"
  bind:value={$locale}
  onchange={() => change_language($locale)}
>
  {#each language_options as option}
    <option value={option.id}>{option.nativeName}</option>
  {/each}
</select>
