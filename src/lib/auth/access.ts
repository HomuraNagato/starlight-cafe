export const PUBLIC_PATH_PREFIXES = [
  '/auth/',
  '/_app/',
  '/@fs/',
  '/@id/',
  '/@vite/',
  '/node_modules/',
  '/images/',
  '/icons/',
];

export const PUBLIC_PATHS = new Set([
  '/auth',
  '/login',
  '/favicon.ico',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/robots.txt',
]);

const DIRECT_AUTH_BYPASS_HOSTS = new Set(['garnetmoon']);

export function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.has(pathname) || PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export function isTailscaleAddress(address: string) {
  const normalizedAddress = address.startsWith('::ffff:') ? address.slice(7) : address;
  const parts = normalizedAddress.split('.').map((part) => Number(part));

  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  return parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127;
}

export function isTailscaleRequest(url: URL) {
  const hostname = url.hostname.toLowerCase();

  return (
    isTailscaleAddress(hostname) ||
    hostname.endsWith('.ts.net') ||
    DIRECT_AUTH_BYPASS_HOSTS.has(hostname)
  );
}
