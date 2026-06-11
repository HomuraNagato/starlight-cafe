<script>import { enhance } from "$app/forms";
export let className = "";
export let provider = "";
export let signInPage = "signin";
export let options = void 0;
export let authorizationParams = void 0;
const callbackUrl = options instanceof FormData ? options.get("redirectTo") : options?.redirectTo;
const redirect = options instanceof FormData ? options.get("redirect") : options?.redirectTo;
const redirectTo = callbackUrl;
const authorizationParamsInputs = authorizationParams ? typeof authorizationParams === "string" && authorizationParams ? new URLSearchParams(authorizationParams) : authorizationParams : void 0;
</script>

<form
  method="POST"
  action={`/${signInPage}`}
  use:enhance
  class={`signInButton ${className}`}
  {...$$restProps}
>
  <input type="hidden" name="providerId" value={provider} />
  {#if callbackUrl}
    <input type="hidden" name="callbackUrl" value={callbackUrl} />
  {/if}
  {#if redirect}
    <input type="hidden" name="redirect" value={redirect} />
  {/if}
  {#if redirectTo}
    <input type="hidden" name="redirectTo" value={redirectTo} />
  {/if}
  {#if authorizationParamsInputs}
    {#each Object.entries(authorizationParamsInputs) as [key, value]}
      <input type="hidden" name={`authorizationParams-${key}`} {value} />
    {/each}
  {/if}
  {#if provider === "credentials"}
    <slot name="credentials" />
  {/if}
  <!-- TODO: Filter by provider type only -->
  {#if provider === "email" || provider === "sendgrid" || provider === "resend"}
    <slot name="email">
      <label
        class="section-header"
        for={`input-email-for-${provider}-provider`}
      >
        Email
      </label>
      <input
        id="input-email-for-email-provider"
        type="email"
        name="email"
        placeholder="email@example.com"
        required
      />
    </slot>
  {/if}
  <button type="submit">
    <slot name="submitButton">Signin{provider ? ` with ${provider}` : ""}</slot>
  </button>
</form>
