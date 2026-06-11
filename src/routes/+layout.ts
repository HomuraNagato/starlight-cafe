import { redirect } from '@sveltejs/kit';
import { isPublicPath } from '$lib/auth/access';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ data, url }) => {
  if (!isPublicPath(url.pathname) && !data.authBypassed && !data.session?.user) {
    const callbackUrl = `${url.pathname}${url.search}`;
    throw redirect(303, `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return data;
};
