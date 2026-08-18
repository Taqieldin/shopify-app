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
import { AlertTriangle, ShieldAlert, Lock, CheckCircle, ShieldCheck } from 'lucide-react';

export const LostStolenView: React.FC = () => {
  const { currentTenant, pieces, reportTheft } = useTenant();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [selectedSerial, setSelectedSerial] = useState(pieces[0]?.serial || '');
  const [reportType, setReportType] = useState<'LOST' | 'STOLEN'>('STOLEN');
  const [notes, setNotes] = useState('Reported stolen during transit.');

  const stolenPieces = pieces.filter((p) => p.status === 'STOLEN' || p.status === 'LOST');

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    reportTheft(selectedSerial, reportType, notes);
    setSuccessBanner('Serial locked and blacklist flag applied successfully');
    setView('list');
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  if (view === 'create') {
    return (
      <Page title="Report Lost / Stolen Piece">
        <Layout>
          <Layout.Section>
            <Box paddingBlockStart="400">
              <Button onClick={() => setView('list')} variant="plain">
                ← Back to Blacklist
              </Button>
            </Box>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="600">
                <form onSubmit={handleReport}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Select
                      label="Select Piece"
                      options={pieces.map((p) => ({
                        label: `${p.serial} — ${p.product_title}`,
                        value: p.serial,
                      }))}
                      value={selectedSerial}
                      onChange={setSelectedSerial}
                    />
                    <Select
                      label="Report Type"
                      options={[
                        { label: 'Stolen (Theft / Burglary)', value: 'STOLEN' },
                        { label: 'Lost (Unaccounted)', value: 'LOST' },
                      ]}
                      value={reportType}
                      onChange={(val) => setReportType(val as 'LOST' | 'STOLEN')}
                    />
                  </div>

                  <Box paddingBlockStart="300">
                    <TextField
                      label="Incident Notes / Police Report"
                      value={notes}
                      onChange={setNotes}
                      multiline={2}
                      autoComplete="off"
                    />
                  </Box>

                  <Banner tone="critical" title="Warning">
                    <p>
                      This will lock all transfers and mark the piece for fraud alert on future NFC scans.
                    </p>
                  </Banner>

                  <Box paddingBlockStart="500">
                    <InlineStack gap="200" align="end">
                      <Button onClick={() => setView('list')}>Cancel</Button>
                      <Button variant="primary" tone="critical" submit>
                        Lock Serial & Flag Blacklist
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
      title="Lost & Stolen Product Blacklist"
      primaryAction={{
        content: 'Report Lost or Stolen Piece',
        onAction: () => setView('create'),
        icon: <ShieldAlert />,
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
            Automated transfer lockouts, public scan fraud alerts, and law-enforcement incident tracking.
          </Text>
        </Layout.Section>

        {stolenPieces.length === 0 ? (
          <Layout.Section>
            <Card>
              <Box padding="800" alignment="center">
                <InlineStack direction="column" gap="200" align="center">
                  <ShieldCheck width="32" height="32" color="success" />
                  <Text as="h3" variant="headingMd">
                    No Active Stolen or Flagged Pieces
                  </Text>
                  <Text as="p" variant="bodySm" color="subdued">
                    All physical serial numbers for {currentTenant.settings.brand_name} are verified in good standing.
                  </Text>
                </InlineStack>
              </Box>
            </Card>
          </Layout.Section>
        ) : (
          stolenPieces.map((piece) => (
            <Layout.Section key={piece.id}>
              <Card>
                <Box padding="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="200" blockAlign="center">
                      <Badge tone="critical">{piece.status}</Badge>
                      <Text as="span" variant="bodyMd" fontWeight="bold" color="critical">
                        {piece.serial}
                      </Text>
                      <Text as="span" variant="bodySm">
                        {piece.product_title}
                      </Text>
                    </InlineStack>
                    <Badge tone="critical">Fraud Alert Active</Badge>
                  </InlineStack>
                  <Box paddingBlockStart="100">
                    <Text as="p" variant="bodySm" color="subdued">
                      Ownership Transfer: <strong>LOCKED</strong>
                    </Text>
                  </Box>
                </Box>
              </Card>
            </Layout.Section>
          ))
        )}
      </Layout>
    </Page>
  );
};
