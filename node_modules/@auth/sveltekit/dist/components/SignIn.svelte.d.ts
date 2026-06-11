import { SvelteComponentTyped } from "svelte";
import type { signIn } from "../actions";
declare const __propDef: {
    props: {
        [x: string]: any;
        className?: string | undefined;
        provider?: Partial<Parameters<typeof signIn>[0]>;
        signInPage?: string | undefined;
        options?: Parameters<typeof signIn>[1] | undefined;
        authorizationParams?: Parameters<typeof signIn>[2] | undefined;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        credentials: {};
        email: {};
        submitButton: {};
    };
};
export type SignInProps = typeof __propDef.props;
export type SignInEvents = typeof __propDef.events;
export type SignInSlots = typeof __propDef.slots;
export default class SignIn extends SvelteComponentTyped<SignInProps, SignInEvents, SignInSlots> {
}
export {};
//# sourceMappingURL=SignIn.svelte.d.ts.map