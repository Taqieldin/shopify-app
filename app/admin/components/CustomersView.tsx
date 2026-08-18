import React, { useState, useEffect } from 'react';
import { authFetch } from '../../utils/api';
import { useTenant } from '../../context/TenantContext';
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
import { Users } from 'lucide-react';

interface Customer {
  id: string;
  name?: string;
  email: string;
  tier?: string;
  pieces_count?: number;
  credits_balance?: number;
  registered_since?: string;
  total_spend?: string;
}

export const CustomersView: React.FC = () => {
  const { currentTenant } = useTenant();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    authFetch('/api/admin/customers')
      .then((res) => res.json())
      .then((data) => {
        const raw = data.data;
        if (Array.isArray(raw)) {
          setCustomers(raw);
        } else if (raw?.customers && Array.isArray(raw.customers)) {
          setCustomers(raw.customers);
        } else {
          setCustomers([]);
        }
      })
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => {
    const name = (c.name || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const tier = (c.tier || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q) || tier.includes(q);
  });

  const rows = filtered.map((c) => [
    <Text as="span" key="name" variant="bodyMd" fontWeight="semibold">
      {c.name || '—'}
    </Text>,
    <Text as="span" key="email" variant="bodyMd">
      {c.email}
    </Text>,
    <Badge key="tier" tone={c.tier ? 'attention' : 'info'}>
      {c.tier || 'Unassigned'}
    </Badge>,
    <Text as="span" key="pieces" variant="bodyMd">
      {c.pieces_count ?? 0}
    </Text>,
    <Text as="span" key="credits" variant="bodyMd">
      {(c.credits_balance ?? 0).toLocaleString()} pts
    </Text>,
    <Text as="span" key="registered" variant="bodySm">
      {c.registered_since || '—'}
    </Text>,
    <Text as="span" key="spend" variant="bodyMd">
      {c.total_spend || '—'}
    </Text>,
  ]);

  return (
    <Page title="Collector Directory & VIP Circle" subtitle="Verified owners, lifetime client profiles, patron tiers, and active vault piece counts.">
      <Layout>
        <Layout.Section>
          <Card>
            <Box padding="400">
              <TextField
                prefix={<Search className="w-4 h-4 text-zinc-400" />}
                placeholder="Search by name, email or tier..."
                value={search}
                onChange={setSearch}
                autoComplete="off"
                clearButton
                onClear={() => setSearch('')}
              />
            </Box>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="large" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Users className="w-10 h-10 text-zinc-600" />
                <Text as="p" variant="bodyMd" alignment="center" tone="subdued">
                  {search ? `No collectors matching "${search}"` : 'No collector profiles yet'}
                </Text>
                <Text as="p" variant="bodySm" alignment="center" tone="subdued">
                  Collector profiles are created when customers purchase or register pieces.
                </Text>
              </div>
            ) : (
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'numeric', 'numeric', 'text', 'text']}
                headings={['Collector', 'Email', 'Tier', 'Pieces', currentTenant.settings.credits_term, 'Member Since', 'Lifetime Volume']}
                rows={rows}
              />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};
