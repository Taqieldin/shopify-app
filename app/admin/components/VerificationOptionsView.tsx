import { useState, useEffect } from 'react';
import { authFetch } from '../../utils/api';
import {
  Page,
  Layout,
  Card,
  DataTable,
  Button,
  Banner,
  Badge,
  Checkbox,
  InlineStack,
  Text,
} from '@shopify/polaris';

type Method = 'NFC' | 'QR' | 'SERIAL_LOOKUP' | 'MANUAL';

const ALL_METHODS: Method[] = ['NFC', 'QR', 'SERIAL_LOOKUP', 'MANUAL'];

interface ProductWithMethods {
  id: string;
  title: string;
  category?: string;
  piece_count: number;
  verification_methods: Method[];
}

export function VerificationOptionsView() {
  const [products, setProducts] = useState<ProductWithMethods[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Method[]>>({});

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/api/admin/verification-options');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
        const next: Record<string, Method[]> = {};
        for (const p of data.data) next[p.id] = p.verification_methods;
        setDrafts(next);
      } else {
        setError(data.error?.message || 'Failed to load products');
      }
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const toggleMethod = (productId: string, method: Method) => {
    setDrafts((prev) => {
      const current = prev[productId] || [];
      return {
        ...prev,
        [productId]: current.includes(method)
          ? current.filter((m) => m !== method)
          : [...current, method],
      };
    });
  };

  const hasChanges = (product: ProductWithMethods) => {
    const draft = drafts[product.id];
    if (!draft) return false;
    const a = [...product.verification_methods].sort().join(',');
    const b = [...draft].sort().join(',');
    return a !== b;
  };

  const saveMethods = async (product: ProductWithMethods) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await authFetch(`/api/admin/verification-options/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methods: drafts[product.id] }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(`Verification options saved for ${product.title}`);
        loadProducts();
      } else {
        setError(data.error?.message || 'Failed to save verification options');
      }
    } catch (err) {
      setError('Failed to save verification options');
    } finally {
      setLoading(false);
    }
  };

  const rows = products.map((product) => {
    const draft = drafts[product.id] || product.verification_methods;
    return [
      <div key="title">
        <Text as="span" variant="bodyMd" fontWeight="semibold">
          {product.title}
        </Text>
        {product.category && (
          <Text as="p" variant="bodySm" tone="subdued">
            {product.category}
          </Text>
        )}
      </div>,
      <Text as="span" key="pieces" variant="bodyMd">
        {product.piece_count}
      </Text>,
      <InlineStack key="methods" gap="200" wrap>
        {ALL_METHODS.map((method) => (
          <Checkbox
            key={method}
            label={method}
            checked={draft.includes(method)}
            onChange={() => toggleMethod(product.id, method)}
          />
        ))}
      </InlineStack>,
      <Button
        key="save"
        size="slim"
        loading={loading}
        disabled={!hasChanges(product)}
        onClick={() => saveMethods(product)}
      >
        Save
      </Button>,
    ];
  });

  return (
    <Page title="Verification Options" subtitle="Choose which methods customers can use to verify each product line. NFC/QR toggles also respect shop-level feature flags; MANUAL always stays available for atelier staff.">
      <Layout>
        <Layout.Section>
          {error && (
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          )}
          {success && (
            <Banner tone="success" onDismiss={() => setSuccess(null)}>
              {success}
            </Banner>
          )}
          <Card>
            <DataTable
              columnContentTypes={['text', 'numeric', 'text', 'text']}
              headings={['Product', 'Pieces', 'Verification Methods', '']}
              rows={rows}
            />
          </Card>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <Badge tone="info">How it works</Badge>
            <Text as="p" variant="bodyMd">
              When a customer taps, scans or types a serial, the allowed methods
              are checked against this product's configuration. Disabled methods
              are rejected with a clear message before any telemetry is recorded.
            </Text>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}