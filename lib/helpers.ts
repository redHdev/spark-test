import { parse } from 'url';

export function getBaseURL() {
  const url = process?.env?.SITE_URL || process?.env?.VERCEL_URL || 'http://localhost:3000';
  return url.includes('http') ? url : `https://${url}`;
}

export function formatPrice({ locale, currency, amount }: { locale?: string; currency?: string; amount?: number }) {
  return new Intl.NumberFormat(locale ?? 'en-US', {
    style: 'currency',
    currency: currency ?? 'USD',
    minimumFractionDigits: 0,
  }).format((amount ?? 0) / 100);
}

/**
 * This helper invalidates the router cache so that the next navigation will run the middleware again
 * See https://github.com/clerkinc/javascript/blob/712c8ea792693a335d9bf39c28e550216cb71bcb/packages/nextjs/src/client/invalidateNextRouterCache.ts for more details
 */
export const invalidateNextRouterCache = () => {
  if (typeof window === 'undefined') return;

  const invalidate = (cache: any) => {
    Object.keys(cache).forEach((key) => {
      delete cache[key];
    });
  };

  try {
    invalidate((window as any).next.router.sdc);
    invalidate((window as any).next.router.sbc);
  } catch (e) {
    return;
  }
};

export const getDomainName = () => {
  const urlString = process?.env?.SITE_URL || 'http://localhost:3000';

  const parsedUrl = parse(urlString);

  // Extract the hostname (domain) from the parsed URL
  const domain = parsedUrl.hostname;

  return domain;
}
