import React, { useState, useEffect } from 'react';
import { authFetch } from '../../utils/api';
import {
  Page,
  Layout,
  Card,
  DataTable,
  TextField,
  Badge,
  Text,
  Box,
  Spinner,
} from '@shopify/polaris';
import { Search, ShieldCheck } from 'lucide-react';

interface Warranty {
  id: string;
  serial: string;
  product_title?: string;
  customer_email?: string;
  warranty_type: string;
  status: string;
  start_date: string;
  end_date: string;
  claims_count?: number;
}

export const WarrantiesView: React.FC = () => {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    authFetch('/api/admin/services')
      .then((res) => res.json())
      .then((data) => {
        const raw = data.data;
        if (Array.isArray(raw)) {
          setWarranties(raw);
        } else if (raw?.warranties && Array.isArray(raw.warranties)) {
          setWarranties(raw.warranties);
        } else {
          setWarranties([]);
        }
      })
      .catch(() => setWarranties([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = warranties.filter((w) => {
    const serial = (w.serial || '').toLowerCase();
    const email = (w.customer_email || '').toLowerCase();
    const title = (w.product_title || '').toLowerCase();
    const q = search.toLowerCase();
    return serial.includes(q) || email.includes(q) || title.includes(q);
  });

  const rows = filtered.map((w) => [
    <Text as="span" key="serial" variant="bodyMd" fontWeight="semibold">
      {w.serial}
    </Text>,
    <Text as="span" key="title" variant="bodyMd">
      {w.product_title || '—'}
    </Text>,
    <Text as="span" key="email" variant="bodyMd">
      {w.customer_email || '—'}
    </Text>,
    <Text as="span" key="type" variant="bodyMd">
      {w.warranty_type}
    </Text>,
    <Badge key="status" tone={w.status === 'ACTIVE' ? 'success' : 'attention'}>
      {w.status}
    </Badge>,
    <Text as="span" key="period" variant="bodySm">
      {w.start_date} → {w.end_date}
    </Text>,
    <Text as="span" key="claims" variant="bodyMd">
      {w.claims_count ?? 0}
    </Text>,
  ]);

  return (
    <Page title="Warranty & Atelier Guarantees" subtitle="Tracking multi-year and lifetime warranty registrations, active coverage periods, and service claims.">
      <Layout>
        <Layout.Section>
          <Card>
            <Box padding="400">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="large" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <ShieldCheck className="w-10 h-10 text-zinc-600" />
                  <Text as="p" variant="bodyMd" alignment="center" tone="subdued">
                    {search ? `No warranties matching "${search}"` : 'No warranty registrations yet'}
                  </Text>
                  <Text as="p" variant="bodySm" alignment="center" tone="subdued">
                    Warranty records appear here when pieces with warranty coverage are registered.
                  </Text>
                </div>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'numeric']}
                  headings={['Serial', 'Product', 'Collector', 'Warranty Type', 'Status', 'Coverage Period', 'Claims']}
                  rows={rows}
                />
              )}
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};
