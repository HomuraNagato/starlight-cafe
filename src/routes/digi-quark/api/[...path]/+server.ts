import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const apiBase = env.DIGI_QUARK_API_BASE_URL ?? 'http://127.0.0.1:4012';

async function proxy({ params, request, url }: Parameters<RequestHandler>[0]) {
  const target = new URL(`${apiBase}/${params.path ?? ''}`);
  target.search = url.search;

  const body =
    request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();
  const response = await fetch(target, {
    method: request.method,
    headers: {
      'content-type': request.headers.get('content-type') ?? 'application/json',
    },
    body,
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
