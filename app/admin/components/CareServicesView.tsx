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
import { Wrench, Shield, Plus, CheckCircle, Clock, FileText, User } from 'lucide-react';

export const CareServicesView: React.FC = () => {
  const { currentTenant, serviceCases, pieces, createServiceCase, updateServiceStatus } = useTenant();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [selectedSerial, setSelectedSerial] = useState(pieces[0]?.serial || '');
  const [serviceType, setServiceType] = useState('Annual Leather Spa & Edge Restoration');
  const [technician, setTechnician] = useState('');
  const [internalNotes, setInternalNotes] = useState('Inspect stitching tension and edge coating resin.');
  const [customerNotes, setCustomerNotes] = useState('Your piece is undergoing master leather conditioning.');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createServiceCase({
      serial: selectedSerial,
      service_type: serviceType,
      technician_name: technician,
      internal_notes: internalNotes,
      customer_notes: customerNotes,
      warranty_covered: true,
    });
    setSuccessBanner('Service ticket created successfully');
    setView('list');
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  if (view === 'create') {
    return (
      <Page title="Create Atelier Service Ticket">
        <Layout>
          <Layout.Section>
            <Box paddingBlockStart="400">
              <Button onClick={() => setView('list')} variant="plain">
                ← Back to Service Cases
              </Button>
            </Box>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="600">
                <form onSubmit={handleCreate}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Select
                      label="Select Physical Piece"
                      options={pieces.map((p) => ({
                        label: `${p.serial} — ${p.product_title}`,
                        value: p.serial,
                      }))}
                      value={selectedSerial}
                      onChange={setSelectedSerial}
                    />
                    <TextField
                      label="Service Type"
                      value={serviceType}
                      onChange={setServiceType}
                      requiredIndicator
                      autoComplete="off"
                    />
                  </div>

                  <Box paddingBlockStart="300">
                    <TextField
                      label="Assigned Master Artisan / Technician"
                      value={technician}
                      onChange={setTechnician}
                      requiredIndicator
                      autoComplete="off"
                    />
                  </Box>

                  <Box paddingBlockStart="300">
                    <TextField
                      label="Customer-Facing Note"
                      value={customerNotes}
                      onChange={setCustomerNotes}
                      multiline={2}
                      autoComplete="off"
                    />
                  </Box>

                  <Box paddingBlockStart="300">
                    <TextField
                      label="Confidential Internal Notes"
                      value={internalNotes}
                      onChange={setInternalNotes}
                      multiline={2}
                      autoComplete="off"
                      helpText="This note is hidden from the customer."
                    />
                  </Box>

                  <Box paddingBlockStart="500">
                    <InlineStack gap="200" align="end">
                      <Button onClick={() => setView('list')}>Cancel</Button>
                      <Button variant="primary" submit>
                        Create Service Ticket
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
      title="Care, Restoration & Warranty Service"
      primaryAction={{
        content: 'Open Service Ticket',
        onAction: () => setView('create'),
        icon: <Plus />,
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
            Manage atelier service tickets with strict isolation between internal technician logs and customer updates.
          </Text>
        </Layout.Section>

        {serviceCases.map((srv) => (
          <Layout.Section key={srv.id}>
            <Card>
              <Box padding="500">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="200" blockAlign="center">
                    <Badge tone={srv.status === 'COMPLETED' ? 'success' : 'info'}>
                      {srv.case_number}
                    </Badge>
                    <Text as="span" variant="bodyMd" fontWeight="bold">
                      {srv.service_type}
                    </Text>
                  </InlineStack>
                  <Badge tone={srv.status === 'COMPLETED' ? 'success' : 'info'}>
                    {srv.status}
                  </Badge>
                </InlineStack>

                <Box paddingBlockStart="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Serial: <strong>{srv.serial}</strong> • Technician: {srv.technician_name}
                  </Text>
                </Box>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <Box padding="300" borderRadius="200" borderColor="border" borderWidth="100">
                    <Badge>Customer-Facing Updates</Badge>
                    <Box paddingBlockStart="100">
                      <Text as="p" variant="bodySm" tone="subdued">
                        "{srv.customer_notes}"
                      </Text>
                    </Box>
                  </Box>
                  <Box padding="300" borderRadius="200" borderColor="border-critical" borderWidth="100">
                    <Badge tone="critical">Confidential Internal Notes</Badge>
                    <Box paddingBlockStart="100">
                      <Text as="p" variant="bodySm">
                        {srv.internal_notes}
                      </Text>
                    </Box>
                  </Box>
                </div>

                {srv.status !== 'COMPLETED' && (
                  <Box paddingBlockStart="300">
                    <Button
                      variant="primary"
                      onClick={() => updateServiceStatus(srv.id, 'COMPLETED', 'Service and care completed successfully.')}
                    >
                      Mark Completed
                    </Button>
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
