import { SvelteComponentTyped } from "svelte";
import type { signOut } from "../actions";
declare const __propDef: {
    props: {
        [x: string]: any;
        className?: string | undefined;
        options?: Parameters<typeof signOut>[0];
        signOutPage?: string | undefined;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        submitButton: {};
    };
};
export type SignOutProps = typeof __propDef.props;
export type SignOutEvents = typeof __propDef.events;
export type SignOutSlots = typeof __propDef.slots;
export default class SignOut extends SvelteComponentTyped<SignOutProps, SignOutEvents, SignOutSlots> {
}
export {};
//# sourceMappingURL=SignOut.svelte.d.ts.map