import type { RequestEvent } from "@sveltejs/kit";
import type { SvelteKitAuthConfig } from "./types";
type SignInParams = Parameters<App.Locals["signIn"]>;
export declare function signIn(provider: SignInParams[0], options: SignInParams[1], authorizationParams: SignInParams[2], config: SvelteKitAuthConfig, event: RequestEvent): Promise<any>;
type SignOutParams = Parameters<App.Locals["signOut"]>;
export declare function signOut(options: SignOutParams[0], config: SvelteKitAuthConfig, event: RequestEvent): Promise<any>;
export declare function auth(event: RequestEvent, config: SvelteKitAuthConfig): ReturnType<App.Locals["auth"]>;
export {};
//# sourceMappingURL=actions.d.ts.map