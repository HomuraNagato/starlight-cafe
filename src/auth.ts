import { SvelteKitAuth } from '@auth/sveltekit';
import Google from '@auth/sveltekit/providers/google';
import { env } from '$env/dynamic/private';

export const { handle, signIn, signOut } = SvelteKitAuth({
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: env.AUTH_SECRET,
  useSecureCookies: true,
  callbacks: {
    redirect({ url, baseUrl }) {
      const publicBaseUrl = env.PUBLIC_BASE_URL ?? baseUrl;
      const publicOrigin = new URL(publicBaseUrl).origin;

      if (url.startsWith('/')) {
        return `${publicOrigin}${url}`;
      }

      const targetUrl = new URL(url);

      if (targetUrl.hostname === new URL(publicOrigin).hostname) {
        return `${publicOrigin}${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
      }

      return publicOrigin;
    },
  },
  trustHost: true,
});
