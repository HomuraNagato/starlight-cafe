import { setEnvDefaults as coreSetEnvDefaults, skipCSRFCheck } from "@auth/core";
import { dev, building } from "$app/environment";
import { base } from "$app/paths";
export function setEnvDefaults(envObject, config) {
    config.trustHost ??= dev;
    config.basePath = `${base}/auth`;
    config.skipCSRFCheck = skipCSRFCheck;
    if (building)
        return;
    coreSetEnvDefaults(envObject, config);
}
