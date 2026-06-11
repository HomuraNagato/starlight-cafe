import { redirect } from "@sveltejs/kit";
import { parse } from "set-cookie-parser";
import { env } from "$env/dynamic/private";
import { Auth, createActionURL, raw } from "@auth/core";
import { setEnvDefaults } from "./env";
export async function signIn(provider, options = {}, authorizationParams, config, event) {
    const { request, url: { protocol }, } = event;
    const headers = new Headers(request.headers);
    const { redirect: shouldRedirect = true, redirectTo, ...rest } = options instanceof FormData ? Object.fromEntries(options) : options;
    const callbackUrl = redirectTo?.toString() ?? headers.get("Referer") ?? "/";
    const signInURL = createActionURL("signin", protocol, headers, env, config);
    if (!provider) {
        signInURL.searchParams.append("callbackUrl", callbackUrl);
        if (shouldRedirect)
            redirect(302, signInURL.toString());
        return signInURL.toString();
    }
    let url = `${signInURL}/${provider}?${new URLSearchParams(authorizationParams)}`;
    let foundProvider = {};
    for (const providerConfig of config.providers) {
        const { options, ...defaults } = typeof providerConfig === "function" ? providerConfig() : providerConfig;
        const id = options?.id ?? defaults.id;
        if (id === provider) {
            foundProvider = {
                id,
                type: options?.type ?? defaults.type,
            };
            break;
        }
    }
    if (!foundProvider.id) {
        const url = `${signInURL}?${new URLSearchParams({ callbackUrl })}`;
        if (shouldRedirect)
            redirect(302, url);
        return url;
    }
    if (foundProvider.type === "credentials") {
        url = url.replace("signin", "callback");
    }
    headers.set("Content-Type", "application/x-www-form-urlencoded");
    const body = new URLSearchParams({ ...rest, callbackUrl });
    const req = new Request(url, { method: "POST", headers, body });
    const res = await Auth(req, { ...config, raw });
    for (const c of res?.cookies ?? []) {
        event.cookies.set(c.name, c.value, { path: "/", ...c.options });
    }
    if (shouldRedirect) {
        return redirect(302, res.redirect);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res.redirect;
}
export async function signOut(options, config, event) {
    const { request, url: { protocol }, } = event;
    const headers = new Headers(request.headers);
    headers.set("Content-Type", "application/x-www-form-urlencoded");
    const url = createActionURL("signout", protocol, headers, env, config);
    const callbackUrl = options?.redirectTo ?? headers.get("Referer") ?? "/";
    const body = new URLSearchParams({ callbackUrl });
    const req = new Request(url, { method: "POST", headers, body });
    const res = await Auth(req, { ...config, raw });
    for (const c of res?.cookies ?? [])
        event.cookies.set(c.name, c.value, { path: "/", ...c.options });
    if (options?.redirect ?? true)
        return redirect(302, res.redirect);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res;
}
export async function auth(event, config) {
    setEnvDefaults(env, config);
    config.trustHost ??= true;
    const { request: req, url: { protocol }, } = event;
    const sessionUrl = createActionURL("session", protocol, req.headers, env, config);
    const request = new Request(sessionUrl, {
        headers: { cookie: req.headers.get("cookie") ?? "" },
    });
    const response = await Auth(request, config);
    const authCookies = parse(response.headers.getSetCookie());
    for (const cookie of authCookies) {
        const { name, value, ...options } = cookie;
        // @ts-expect-error - Review: SvelteKit and set-cookie-parser are mismatching
        event.cookies.set(name, value, { path: "/", ...options });
    }
    const { status = 200 } = response;
    const data = await response.json();
    if (!data || !Object.keys(data).length)
        return null;
    if (status === 200)
        return data;
    throw new Error(data.message);
}
