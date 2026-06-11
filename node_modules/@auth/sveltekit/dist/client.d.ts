import type { ProviderId } from "@auth/core/providers";
export interface SignInOptions<Redirect extends boolean = true> extends Record<string, unknown> {
    /** @deprecated Use `redirectTo` instead. */
    callbackUrl?: string;
    /**
     * Specify where the user should be redirected to after a successful signin.
     *
     * By default, it is the page the sign-in was initiated from.
     */
    redirectTo?: string;
    /**
     * You might want to deal with the signin response on the same page, instead of redirecting to another page.
     * For example, if an error occurs (like wrong credentials given by the user), you might want to show an inline error message on the input field.
     *
     * For this purpose, you can set this to option `redirect: false`.
     */
    redirect?: Redirect;
}
export interface SignInResponse {
    error: string | undefined;
    code: string | undefined;
    status: number;
    ok: boolean;
    url: string | null;
}
export interface SignOutParams<Redirect extends boolean = true> {
    /** @deprecated Use `redirectTo` instead. */
    callbackUrl?: string;
    /**
     * If you pass `redirect: false`, the page will not reload.
     * The session will be deleted, and `useSession` is notified, so any indication about the user will be shown as logged out automatically.
     * It can give a very nice experience for the user.
     */
    redirectTo?: string;
    /** [Documentation](https://next-auth.js.org/getting-started/client#using-the-redirect-false-option-1 */
    redirect?: Redirect;
}
/** Match `inputType` of `new URLSearchParams(inputType)` */
export type SignInAuthorizationParams = string | string[][] | Record<string, string> | URLSearchParams;
/**
 * Client-side method to initiate a signin flow
 * or send the user to the signin page listing all possible providers.
 *
 * [Documentation](https://authjs.dev/reference/sveltekit/client#signin)
 */
/**
 * Initiates a signin flow or sends the user to the signin page listing all possible providers.
 * Handles CSRF protection.
 *
 * @note This method can only be used from Client Components ("use client" or Pages Router).
 * For Server Actions, use the `signIn` method imported from the `auth` config.
 */
export declare function signIn(provider?: ProviderId, options?: SignInOptions<true>, authorizationParams?: SignInAuthorizationParams): Promise<void>;
export declare function signIn(provider?: ProviderId, options?: SignInOptions<false>, authorizationParams?: SignInAuthorizationParams): Promise<SignInResponse>;
export interface SignOutResponse {
    url: string;
}
/**
 * Initiate a signout, by destroying the current session.
 * Handles CSRF protection.
 *
 * @note This method can only be used from Client Components ("use client" or Pages Router).
 * For Server Actions, use the `signOut` method imported from the `auth` config.
 */
export declare function signOut(options?: SignOutParams<true>): Promise<void>;
export declare function signOut(options?: SignOutParams<false>): Promise<SignOutResponse>;
//# sourceMappingURL=client.d.ts.map