import type { LayoutServerLoad } from './$types';
import { isTailscaleRequest } from '$lib/auth/access';
import { logServerError } from '$lib/server/logging';

export const load: LayoutServerLoad = async (event) => {
  return {
    authBypassed: isTailscaleRequest(event.url),
    session: await getSession(event),
  };
};

async function getSession(event: Parameters<LayoutServerLoad>[0]) {
  try {
    return await event.locals.auth();
  } catch (error) {
    logServerError('layout.server.event.locals.auth', error, {
      pathname: event.url.pathname,
      search: event.url.search,
    });

    throw error;
  }
}
