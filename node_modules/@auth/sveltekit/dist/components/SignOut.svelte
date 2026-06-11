<script>import { enhance } from "$app/forms";
export let className = "";
export let options = void 0;
export let signOutPage = "signout";
</script>

<form
  method="POST"
  action={`/${signOutPage}`}
  use:enhance
  class={`signOutButton ${className}`}
  {...$$restProps}
>
  {#if options}
    {#if options?.redirect}
      <input type="hidden" name="redirect" value={options.redirect} />
    {/if}
    {#if options?.redirectTo}
      <input type="hidden" name="redirectTo" value={options.redirectTo} />
    {/if}
  {/if}
  <button type="submit">
    <slot name="submitButton">Sign Out</slot>
  </button>
</form>
