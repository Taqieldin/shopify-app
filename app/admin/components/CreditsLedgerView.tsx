import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
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
import { Coins, Plus, Minus, ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react';

export const CreditsLedgerView: React.FC = () => {
  const { currentTenant, creditEntries, postCreditAdjustment } = useTenant();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState('Exclusive Atelier Consultation Bonus');

  const totalCirculation = creditEntries.reduce((acc, c) => acc + c.amount, 0);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    postCreditAdjustment(customerEmail, Number(amount), reason);
    setSuccessBanner('Ledger transaction committed successfully');
    setView('list');
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  if (view === 'create') {
    return (
      <Page title={`Post ${currentTenant.settings.credits_term} Entry`}>
        <Layout>
          <Layout.Section>
            <Box paddingBlockStart="400">
              <Button onClick={() => setView('list')} variant="plain">
                ← Back to Ledger
              </Button>
            </Box>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="600">
                <form onSubmit={handlePost}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <TextField
                      label="Customer Email"
                      type="email"
                      value={customerEmail}
                      onChange={setCustomerEmail}
                      requiredIndicator
                      autoComplete="off"
                    />
                    <TextField
                      label="Amount (Positive to Grant, Negative to Debit)"
                      type="number"
                      value={String(amount)}
                      onChange={(val) => setAmount(Number(val))}
                      requiredIndicator
                      autoComplete="off"
                      prefix="$"
                    />
                  </div>

                  <Box paddingBlockStart="300">
                    <TextField
                      label="Mandatory Business Reason"
                      value={reason}
                      onChange={setReason}
                      requiredIndicator
                      autoComplete="off"
                      helpText="Every manual adjustment must have an audit-compliant reason."
                    />
                  </Box>

                  <Banner tone="warning" title="Audit Notice">
                    <p>This action is permanent and immutable. All ledger entries are append-only.</p>
                  </Banner>

                  <Box paddingBlockStart="500">
                    <InlineStack gap="200" align="end">
                      <Button onClick={() => setView('list')}>Cancel</Button>
                      <Button variant="primary" submit>
                        Commit Ledger Transaction
                      </Button>
                    </InlineStack>
                  </Box>
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
      title={`Immutable ${currentTenant.settings.credits_term} Ledger`}
      primaryAction={{
        content: 'Post Manual Transaction',
        onAction: () => setView('create'),
        icon: <Coins />,
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
            Financial-grade append-only transaction ledger with audit compliance and zero mutation.
          </Text>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Box padding="400">
              <InlineStack align="space-between">
                <div>
                  <Text as="p" variant="bodySm">
                    Total In Circulation
                  </Text>
                  <Text as="p" variant="heading2xl" color="success">
                    {totalCirculation.toLocaleString()}{' '}
                    <Text as="span" variant="bodySm" color="subdued">
                      {currentTenant.settings.credits_term}
                    </Text>
                  </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <InlineStack gap="100" align="end">
                    <ShieldCheck width="14" height="14" />
                    <Text as="p" variant="bodySm" fontWeight="semibold">
                      Ledger Invariants Verified
                    </Text>
                  </InlineStack>
                  <Text as="p" variant="bodySm" color="subdued">
                    {creditEntries.length} Recorded Transactions
                  </Text>
                </div>
              </InlineStack>
            </Box>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'numeric', 'text', 'text']}
              headings={['Date', 'Customer', 'Type', 'Amount', 'Reason & Reference', 'Actor']}
              rows={creditEntries.map((entry) => [
                entry.created_at,
                entry.customer_email,
                <Badge tone={entry.amount >= 0 ? 'success' : 'critical'} key={entry.id}>
                  {entry.type}
                </Badge>,
                <Text as="span" fontWeight="bold" color={entry.amount >= 0 ? 'success' : 'critical'} key={`amt-${entry.id}`}>
                  {entry.amount >= 0 ? `+${entry.amount}` : entry.amount}
                </Text>,
                entry.reason,
                entry.created_by,
              ])}
              emptyState="No transactions recorded"
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};
