export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  if (typeof window !== 'undefined') {
    const host = new URLSearchParams(window.location.search).get('host');
    if (host) {
      try {
        const decoded = atob(host);
        const shopMatch = decoded.match(/([^.]+\.myshopify\.com)/);
        if (shopMatch) {
          headers['x-shopify-shop-domain'] = shopMatch[1];
        }
      } catch {
        headers['x-shopify-shop-domain'] = host;
      }
    }
    const shop = new URLSearchParams(window.location.search).get('shop');
    if (shop) {
      headers['x-shopify-shop-domain'] = shop;
    }
  }

  headers['x-user-role'] = 'MERCHANT_OWNER';
  return headers;
}

export async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const existingHeaders = init?.headers instanceof Headers
    ? Object.fromEntries(init.headers.entries())
    : Array.isArray(init?.headers)
      ? Object.fromEntries(init!.headers)
      : (init?.headers as Record<string, string>) || {};

  return fetch(url, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...existingHeaders,
    },
  });
}
