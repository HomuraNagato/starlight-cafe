import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { isPublicPath, isTailscaleRequest } from '$lib/auth/access';
import { logServerError } from '$lib/server/logging';
import { handle as authHandle } from './auth';

const forwardedHttpsHandle: Handle = async ({ event, resolve }) => {
  const forwardedProto = event.request.headers.get('x-forwarded-proto');
  const forwardedHost =
    event.request.headers.get('x-forwarded-host') ?? event.request.headers.get('host');

  if (forwardedProto === 'https' && forwardedHost) {
    const publicUrl = new URL(event.request.url);
    publicUrl.protocol = 'https:';
    publicUrl.host = forwardedHost;

    Object.defineProperty(event, 'url', {
      configurable: true,
      value: publicUrl,
    });

    Object.defineProperty(event, 'request', {
      configurable: true,
      value: new Request(publicUrl, event.request),
    });
  }

  return resolve(event);
};

const authorizationHandle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  if (isPublicPath(pathname) || isTailscaleRequest(event.url)) {
    return resolve(event);
  }

  const session = await getSession(event);

  if (!session?.user) {
    const callbackUrl = `${event.url.pathname}${event.url.search}`;
    throw redirect(303, `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return resolve(event);
};

export const handle = sequence(forwardedHttpsHandle, authHandle, authorizationHandle);

async function getSession(event: Parameters<Handle>[0]['event']) {
  try {
    return await event.locals.auth();
  } catch (error) {
    logServerError('authorizationHandle.event.locals.auth', error, {
      pathname: event.url.pathname,
      search: event.url.search,
    });

    throw error;
  }
}

export const handleError: HandleServerError = ({ error, event, message, status }) => {
  logServerError('handleError', error, {
    pathname: event.url.pathname,
    search: event.url.search,
    message,
    status,
  });

  return {
    message,
  };
};
