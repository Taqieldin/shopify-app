import React, { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  Banner,
  Badge,
  Text,
  Box,
  Spinner,
  InlineStack,
  Select,
  DataTable,
} from '@shopify/polaris';
import { authFetch } from '../../utils/api';
import { Flame, Plus, Clock, Crown, Sparkles, CheckCircle2, Lock, Tag } from 'lucide-react';

export const EarlyAccessView: React.FC = () => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newTier, setNewTier] = useState('Atelier Privilège');
  const [newStartDate, setNewStartDate] = useState('');

  useEffect(() => {
    authFetch('/api/admin/early-access')
      .then((res) => res.json())
      .then((data) => setRules(data.rules ?? data ?? []))
      .catch(() => setRules([]));
  }, []);

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule = {
      id: `ea-${Date.now()}`,
      product_title: newTitle,
      shopify_product_id: `gid://shopify/Product/${Date.now()}`,
      tier_required: newTier,
      starts_at: `${newStartDate} 09:00`,
      ends_at: `${newStartDate} 23:59`,
      status: 'SCHEDULED',
      reservations_count: 0,
    };

    setRules([newRule, ...rules]);
    setNewTitle('');
    setSuccessBanner('Drop rule scheduled successfully');
    setView('list');
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  if (view === 'create') {
    return (
      <Page title="Create Early Access Drop">
        <Layout>
          <Layout.Section>
            <Box paddingBlockStart="400">
              <Button onClick={() => setView('list')} variant="plain">
                ← Back to Drop Rules
              </Button>
            </Box>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="600">
                <form onSubmit={handleCreateRule}>
                  <InlineStack gap="600" blockAlign="start">
                    <div style={{ flex: 1 }}>
                      <Box paddingBlockEnd="300">
                        <Text as="h2" variant="headingMd">
                          Schedule New Private Drop
                        </Text>
                      </Box>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <TextField
                          label="Product Title"
                          value={newTitle}
                          onChange={setNewTitle}
                          placeholder="e.g. Master Complication Tourbillon"
                          requiredIndicator
                          autoComplete="off"
                        />
                        <Select
                          label="Required Membership Tier"
                          options={[
                            { label: 'All Registered Members', value: 'All Members' },
                            { label: 'Atelier Privilège', value: 'Atelier Privilège' },
                            { label: 'Privé Patron (Top Tier Only)', value: 'Privé Patron' },
                          ]}
                          value={newTier}
                          onChange={setNewTier}
                        />
                      </div>

                      <Box paddingBlockStart="300">
                        <TextField
                          label="Launch Date"
                          type="date"
                          value={newStartDate}
                          onChange={setNewStartDate}
                          requiredIndicator
                          autoComplete="off"
                        />
                      </Box>

                      <Box paddingBlockStart="500">
                        <InlineStack gap="200" align="end">
                          <Button onClick={() => setView('list')}>Cancel</Button>
                          <Button variant="primary" submit>
                            Schedule Drop
                          </Button>
                        </InlineStack>
                      </Box>
                    </div>
                  </InlineStack>
                </form>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="VIP Early Access Private Drops"
      primaryAction={{
        content: 'New Private Drop Rule',
        onAction: () => setView('create'),
        icon: Plus,
      }}
    >
      <Layout>
        {successBanner && (
          <Layout.Section>
            <Banner tone="success">
              <p>{successBanner}</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Text as="p" variant="bodySm">
            Gate upcoming limited editions and seasonal product launches by patron membership tier.
          </Text>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'numeric']}
              headings={['Product', 'Status', 'Tier Required', 'Window', 'Reservations']}
              rows={rules.map((r) => [
                r.product_title,
                <Badge tone={r.status === 'ACTIVE' ? 'success' : 'info'} key={r.id}>
                  {r.status}
                </Badge>,
                r.tier_required,
                `${r.starts_at} → ${r.ends_at}`,
                `${r.reservations_count} Reserved`,
              ])}
              emptyState="No drop rules configured yet"
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};
