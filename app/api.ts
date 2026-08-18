export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);

    const shop = params.get('shop');
    if (shop) headers['x-shopify-shop-domain'] = shop;

    if (!headers['x-shopify-shop-domain']) {
      const host = params.get('host');
      if (host) {
        try {
          const decoded = atob(host);
          const storeMatch = decoded.match(/store\/([a-z0-9-]+)/);
          if (storeMatch) {
            headers['x-shopify-shop-domain'] = `${storeMatch[1]}.myshopify.com`;
          }
        } catch {
          headers['x-shopify-shop-domain'] = host;
        }
      }
    }

    if (!headers['x-shopify-shop-domain']) {
      headers['x-shopify-shop-domain'] = 'gorgerine-0siwxdiv.myshopify.com';
    }
  }

  headers['x-user-role'] = 'MERCHANT_OWNER';
  return headers;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options?.headers,
      },
    });
    const json = await res.json();
    if (json.success === false) {
      console.error(`[API] ${options?.method || 'GET'} ${path} failed:`, json.error);
      return null;
    }
    return json.data as T;
  } catch (err) {
    console.error(`[API] ${options?.method || 'GET'} ${path} error:`, err);
    return null;
  }
}
