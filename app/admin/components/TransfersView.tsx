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
} from '@shopify/polaris';
import { ArrowRightLeft, ShieldCheck, CheckCircle2, Copy, ExternalLink, Clock, FileCheck } from 'lucide-react';

export const TransfersView: React.FC = () => {
  const { currentTenant, transfers, initiateTransfer, acceptTransfer, pieces } = useTenant();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [selectedSerial, setSelectedSerial] = useState(pieces[0]?.serial || '');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    initiateTransfer(selectedSerial, recipientEmail, recipientName);
    setSuccessBanner('Transfer invitation token generated successfully');
    setRecipientEmail('');
    setRecipientName('');
    setView('list');
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (view === 'create') {
    return (
      <Page title="Initiate Ownership Transfer">
        <Layout>
          <Layout.Section>
            <Box paddingBlockStart="400">
              <Button onClick={() => setView('list')} variant="plain">
                ← Back to Transfers
              </Button>
            </Box>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="600">
                <form onSubmit={handleInitiate}>
                  <Select
                    label="Select Piece to Transfer"
                    options={pieces
                      .filter((p) => p.status === 'REGISTERED')
                      .map((p) => ({
                        label: `${p.serial} — ${p.product_title} (Owner: ${p.active_owner?.name || 'Unknown'})`,
                        value: p.serial,
                      }))}
                    value={selectedSerial}
                    onChange={setSelectedSerial}
                  />

                  <Box paddingBlockStart="300">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <TextField
                        label="Recipient Email Address"
                        type="email"
                        value={recipientEmail}
                        onChange={setRecipientEmail}
                        requiredIndicator
                        placeholder="recipient@example.com"
                        autoComplete="off"
                      />
                      <TextField
                        label="Recipient Full Name (Optional)"
                        value={recipientName}
                        onChange={setRecipientName}
                        placeholder="e.g. Sophie Laurent"
                        autoComplete="off"
                      />
                    </div>
                  </Box>

                  <Box paddingBlockStart="500">
                    <InlineStack gap="200" align="end">
                      <Button onClick={() => setView('list')}>Cancel</Button>
                      <Button variant="primary" submit>
                        Generate Invitation Token
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
      title="Ownership Transfers & Provenance"
      primaryAction={{
        content: 'Initiate Assisted Transfer',
        onAction: () => setView('create'),
        icon: <ArrowRightLeft />,
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
            Secure single-use token lifecycle with automated Digital Transfer Certificate generation.
          </Text>
        </Layout.Section>

        {transfers.map((trf) => (
          <Layout.Section key={trf.id}>
            <Card>
              <Box padding="500">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="200" blockAlign="center">
                    <Badge tone="warning">{trf.serial}</Badge>
                    <Text as="span" variant="bodyMd" fontWeight="bold">
                      {trf.product_title}
                    </Text>
                  </InlineStack>
                  <Badge tone={trf.status === 'COMPLETED' ? 'success' : 'warning'}>
                    {trf.status}
                  </Badge>
                </InlineStack>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <Box padding="300" borderRadius="200" borderColor="border" borderWidth="100">
                    <Text as="p" variant="bodySm" color="subdued">
                      Current Owner (Sender):
                    </Text>
                    <Text as="p" variant="bodySm" fontWeight="semibold">
                      {trf.sender_email}
                    </Text>
                  </Box>
                  <Box padding="300" borderRadius="200" borderColor="border" borderWidth="100">
                    <Text as="p" variant="bodySm" color="subdued">
                      Designated Recipient:
                    </Text>
                    <Text as="p" variant="bodySm" fontWeight="semibold">
                      {trf.recipient_email} {trf.recipient_name && `(${trf.recipient_name})`}
                    </Text>
                  </Box>
                </div>

                {trf.status === 'COMPLETED' && trf.certificate_number && (
                  <Box paddingBlockStart="300">
                    <Banner tone="success" title="Ownership Transfer Certificate Issued">
                      <p>Certificate No: {trf.certificate_number}</p>
                      <p>Hash: {trf.verification_hash?.slice(0, 16)}...</p>
                    </Banner>
                  </Box>
                )}

                {trf.status === 'PENDING' && (
                  <Box paddingBlockStart="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="100">
                        <Text as="span" variant="bodySm" color="subdued">
                          Token: {trf.transfer_token.slice(0, 18)}...
                        </Text>
                        <Button
                          size="slim"
                          onClick={() => copyToClipboard(trf.transfer_token)}
                        >
                          <Copy width="12" height="12" /> {copiedToken === trf.transfer_token ? 'Copied' : 'Copy'}
                        </Button>
                      </InlineStack>
                      <Button
                        variant="primary"
                        onClick={() =>
                          acceptTransfer(trf.transfer_token, trf.recipient_email, trf.recipient_name || 'New Collector')
                        }
                      >
                        Simulate Recipient Acceptance
                      </Button>
                    </InlineStack>
                  </Box>
                )}
              </Box>
            </Card>
          </Layout.Section>
        ))}
      </Layout>
    </Page>
  );
};
