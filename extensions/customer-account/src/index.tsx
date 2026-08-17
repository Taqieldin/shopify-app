import { useEffect, useState } from 'react';
import {
  reactExtension,
  useSessionToken,
  useAuthenticatedAccountCustomer,
  useSettings,
  BlockStack,
  InlineStack,
  Heading,
  Text,
  Badge,
  Banner,
  Button,
  SkeletonText,
} from '@shopify/ui-extensions-react/customer-account';

// Absolute URL of the deployed app backend.
// Configured via extension settings in the Shopify admin.
// Falls back to the current origin for local development.

interface MembershipData {
  membership?: {
    tier?: { name?: string; tier_level?: number };
    status?: string;
  };
  tiers?: Array<{ name: string; tier_level: number }>;
}

interface CreditsData {
  balance?: number;
}

interface CollectionData {
  collection?: unknown[];
  pieces?: unknown[];
}

interface VaultData {
  membership: MembershipData;
  credits: CreditsData;
  collection: CollectionData;
}

function decodeTokenPayload(token: string): Record<string, unknown> {
  const [, payload] = token.split('.');
  if (!payload) return {};
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Customer Private Club & Collector Vault
 * Target: customer-account.page.render
 * Renders membership status, credits, and owned pieces by calling the app backend.
 *
 * The session token is sent as a Bearer token. The backend currently uses it to
 * route requests (shop domain and customer id are read from the token claims);
 * production hardening should validate the token signature against Shopify's
 * public keys before trusting its claims.
 */
export default reactExtension('customer-account.page.render', () => <PrivateClubPage />);

function PrivateClubPage() {
  const sessionToken = useSessionToken();
  const customer = useAuthenticatedAccountCustomer();
  const settings = useSettings();
  const appApiBase = (settings as any)?.app_api_url || '';
  const [data, setData] = useState<VaultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadVault() {
      if (!appApiBase) {
        if (!cancelled) {
          setError('App backend URL is not configured. Please contact your store administrator.');
          setLoading(false);
        }
        return;
      }
      try {
        const token = await sessionToken.get();
        const claims = decodeTokenPayload(token);
        const shopDomain = String(claims.dest || '')
          .replace(/^https?:\/\//, '')
          .replace(/\/+$/, '');

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        };
        if (shopDomain) headers['x-shopify-shop-domain'] = shopDomain;
        if (customer?.id) headers['x-shopify-customer-id'] = customer.id;

        const [membershipRes, creditsRes, collectionRes] = await Promise.all([
          fetch(`${appApiBase}/api/customer/me/membership`, { headers }),
          fetch(`${appApiBase}/api/customer/me/credits`, { headers }),
          fetch(`${appApiBase}/api/customer/me/collection`, { headers }),
        ]);

        const [membership, credits, collection] = await Promise.all([
          membershipRes.json(),
          creditsRes.json(),
          collectionRes.json(),
        ]);

        if (!cancelled) {
          setData({
            membership: membership.success ? membership.data : {},
            credits: credits.success ? credits.data : {},
            collection: collection.success ? collection.data : {},
          });
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load your Private Club vault. Please try again later.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadVault();
    return () => {
      cancelled = true;
    };
  }, [sessionToken, customer]);

  if (loading) {
    return (
      <BlockStack gap="base">
        <SkeletonText lines={1} />
        <SkeletonText lines={2} />
        <SkeletonText lines={1} />
      </BlockStack>
    );
  }

  if (error) {
    return (
      <Banner tone="critical">
        <Text>{error}</Text>
      </Banner>
    );
  }

  const tierName = data?.membership?.membership?.tier?.name || 'Collector';
  const creditsBalance = data?.credits?.balance ?? 0;
  const pieces = data?.collection?.collection || data?.collection?.pieces || [];

  return (
    <BlockStack gap="base">
      <Heading>Private Club</Heading>
      <Text>Welcome back. Your membership and collected pieces live here.</Text>

      <BlockStack gap="small">
        <InlineStack gap="small" blockAlignment="center">
          <Badge tone="critical">Member</Badge>
          <Text emphasis="bold">{tierName}</Text>
        </InlineStack>
        <InlineStack gap="small" blockAlignment="center">
          <Text>Credits:</Text>
          <Text emphasis="bold">{creditsBalance}</Text>
        </InlineStack>
        <InlineStack gap="small" blockAlignment="center">
          <Text>My Pieces:</Text>
          <Text emphasis="bold">{pieces.length}</Text>
        </InlineStack>
      </BlockStack>

      <Button to={`${appApiBase}/passport`} accessibilityLabel="Open your collector vault">
        View My Collection
      </Button>
    </BlockStack>
  );
}