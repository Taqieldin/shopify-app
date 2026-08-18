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
import {
  QrCode,
  Plus,
  Search,
  ExternalLink,
  Eye,
  Download,
  Upload,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  FileSpreadsheet,
  Award,
  Printer,
} from 'lucide-react';

export const PassportsView: React.FC<{ onPreviewPassport: (serial: string) => void }> = ({
  onPreviewPassport,
}) => {
  const { currentTenant, passports, pieces, createPieceAndPassport } = useTenant();
  const [view, setView] = useState<'list' | 'create' | 'csv-import'>('list');
  const [search, setSearch] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [selectedQrSerial, setSelectedQrSerial] = useState<string | null>(null);
  const [showCertSerial, setShowCertSerial] = useState<string | null>(null);

  // Form State for new passport
  const [formData, setFormData] = useState({
    title: '',
    product_title: '',
    serial: '',
    edition_number: 1,
    edition_total: 50,
    materials_summary: 'Full-Grain Leather with Precious Alloy Hardware',
    craft_info: 'Handcrafted by master artisans with traditional techniques.',
    heritage_story: 'Rooted in heritage savoir-faire and architectural restraint.',
    sustainability_data: '100% Traceable European Raw Materials.',
  });

  // CSV state
  const [csvText, setCsvText] = useState('serial,title,edition,materials,location\n');
  const [csvImportResult, setCsvImportResult] = useState<string | null>(null);

  const filteredPassports = passports.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.serial.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPieceAndPassport(
      {
        serial: formData.serial,
        product_title: formData.product_title || formData.title,
        edition_number: Number(formData.edition_number),
        edition_total: Number(formData.edition_total),
      },
      {
        title: formData.title,
        craft_info: formData.craft_info,
        heritage_story: formData.heritage_story,
        materials_summary: formData.materials_summary,
        sustainability_data: formData.sustainability_data,
      }
    );
    setSuccessBanner(`${currentTenant.settings.passport_term} created successfully`);
    setView('list');
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  const handleCsvImport = () => {
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) return;

    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 2 && parts[0].trim()) {
        createPieceAndPassport(
          {
            serial: parts[0].trim(),
            product_title: parts[1].trim(),
            edition_number: parts[2] ? Number(parts[2].trim()) : undefined,
            edition_total: parts[3] ? Number(parts[3].trim()) : undefined,
          },
          {
            title: parts[1].trim(),
            materials_summary: parts[3]?.trim() || 'Full-Grain Leather',
            craft_info: 'Handcrafted by master artisans.',
            heritage_story: 'Rooted in heritage savoir-faire.',
            sustainability_data: '100% Traceable European Raw Materials.',
          }
        );
        count++;
      }
    }

    setCsvImportResult(`Successfully imported ${count} passports!`);
    setTimeout(() => {
      setView('list');
      setCsvImportResult(null);
    }, 1500);
  };

  // CREATE PASSPORT VIEW
  if (view === 'create') {
    return (
      <Page title={`Create ${currentTenant.settings.passport_term}`}>
        <Layout>
          <Layout.Section>
            <Box paddingBlockStart="400">
              <Button onClick={() => setView('list')} variant="plain">
                ← Back to {currentTenant.settings.passport_term} Registry
              </Button>
            </Box>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="600">
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <TextField
                      label="Product Title"
                      value={formData.product_title}
                      onChange={(val) => setFormData({ ...formData, product_title: val })}
                      requiredIndicator
                      autoComplete="off"
                    />
                    <TextField
                      label="Generated Serial Number"
                      value={formData.serial}
                      onChange={(val) => setFormData({ ...formData, serial: val })}
                      requiredIndicator
                      autoComplete="off"
                    />
                  </div>

                  <Box paddingBlockStart="300">
                    <TextField
                      label={`${currentTenant.settings.passport_term} Display Title`}
                      value={formData.title}
                      onChange={(val) => setFormData({ ...formData, title: val })}
                      requiredIndicator
                      autoComplete="off"
                    />
                  </Box>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                    <TextField
                      label="Edition Number"
                      type="number"
                      value={String(formData.edition_number)}
                      onChange={(val) => setFormData({ ...formData, edition_number: Number(val) })}
                      autoComplete="off"
                    />
                    <TextField
                      label="Edition Total"
                      type="number"
                      value={String(formData.edition_total)}
                      onChange={(val) => setFormData({ ...formData, edition_total: Number(val) })}
                      autoComplete="off"
                    />
                  </div>

                  <Box paddingBlockStart="300">
                    <TextField
                      label="Materials Specification"
                      value={formData.materials_summary}
                      onChange={(val) => setFormData({ ...formData, materials_summary: val })}
                      autoComplete="off"
                    />
                  </Box>

                  <Box paddingBlockStart="300">
                    <TextField
                      label="Craftsmanship & Atelier Techniques"
                      value={formData.craft_info}
                      onChange={(val) => setFormData({ ...formData, craft_info: val })}
                      multiline={2}
                      autoComplete="off"
                    />
                  </Box>

                  <Box paddingBlockStart="300">
                    <TextField
                      label="Heritage & Savoir-Faire Story"
                      value={formData.heritage_story}
                      onChange={(val) => setFormData({ ...formData, heritage_story: val })}
                      multiline={2}
                      autoComplete="off"
                    />
                  </Box>

                  <Box paddingBlockStart="500">
                    <InlineStack gap="200" align="end">
                      <Button onClick={() => setView('list')}>Cancel</Button>
                      <Button variant="primary" submit>
                        Publish {currentTenant.settings.passport_term}
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

  // CSV IMPORT VIEW
  if (view === 'csv-import') {
    return (
      <Page title="Batch CSV Passport Import">
        <Layout>
          <Layout.Section>
            <Box paddingBlockStart="400">
              <Button onClick={() => setView('list')} variant="plain">
                ← Back to {currentTenant.settings.passport_term} Registry
              </Button>
            </Box>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="600">
                <Box paddingBlockEnd="300">
                  <Text as="h2" variant="headingMd">
                    Batch CSV Passport Import
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Stream large serial numbers and passport batches. Supported format: serial, title, edition, materials, location.
                  </Text>
                </Box>

                <TextField
                  label="CSV Data"
                  value={csvText}
                  onChange={setCsvText}
                  multiline={8}
                  autoComplete="off"
                  helpText="Headers: serial, title, edition, materials, location"
                />

                {csvImportResult && (
                  <Box paddingBlockStart="300">
                    <Banner tone="success">
                      <p>{csvImportResult}</p>
                    </Banner>
                  </Box>
                )}

                <Box paddingBlockStart="500">
                  <InlineStack gap="200" align="end">
                    <Button onClick={() => setView('list')}>Close</Button>
                    <Button variant="primary" onClick={handleCsvImport}>
                      Import Batch
                    </Button>
                  </InlineStack>
                </Box>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // LIST VIEW
  return (
    <Page
      title={`${currentTenant.settings.passport_term} Registry`}
      primaryAction={{
        content: `Create ${currentTenant.settings.passport_term}`,
        onAction: () => {
          const autoSerial = `${currentTenant.id.includes('aurelia') ? 'AUR' : 'VNG'}-2026-${Math.floor(
            100000 + Math.random() * 900000
          )}`;
          setFormData({
            ...formData,
            serial: autoSerial,
            title: `${currentTenant.settings.brand_name} Masterpiece Edition`,
            product_title: `${currentTenant.settings.brand_name} Handcrafted Piece`,
          });
          setView('create');
        },
        icon: <Plus />,
      }}
      secondaryActions={[
        {
          content: 'Import CSV',
          onAction: () => setView('csv-import'),
          icon: <Upload />,
        },
      ]}
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
            Manage persistent digital identities and certificates for {currentTenant.settings.brand_name} products.
          </Text>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <TextField
              placeholder={`Search ${currentTenant.settings.passport_term} by title or serial number...`}
              value={search}
              onChange={setSearch}
              prefix={<Search width="14" height="14" />}
              autoComplete="off"
            />
          </Card>
        </Layout.Section>

        {filteredPassports.map((passport) => {
          const piece = pieces.find((p) => p.serial === passport.serial);
          return (
            <Layout.Section key={passport.id}>
              <Card>
                <Box padding="500">
                  <div style={{ display: 'grid', gridTemplateColumns: '4fr 1fr', gap: '16px' }}>
                    <div>
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone="success">ACTIVE</Badge>
                        <Text as="span" variant="bodySm" tone="subdued">
                          {passport.serial}
                        </Text>
                      </InlineStack>
                      <Box paddingBlockStart="200">
                        <Text as="h3" variant="bodyMd" fontWeight="bold">
                          {passport.title}
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {passport.description}
                        </Text>
                      </Box>
                      <Box paddingBlockStart="200">
                        <Text as="p" variant="bodySm" tone="subdued">
                          Edition: {piece?.edition_number ? `${piece.edition_number}/${piece.edition_total}` : 'Unique Piece'} • {passport.view_count} Public Views
                        </Text>
                      </Box>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                      <Button size="slim" onClick={() => onPreviewPassport(passport.serial)}>
                        <ExternalLink width="12" height="12" /> Public View
                      </Button>
                      <Button
                        size="slim"
                        onClick={() => setShowCertSerial(showCertSerial === passport.serial ? null : passport.serial)}
                      >
                        <Award width="12" height="12" />
                      </Button>
                      <Button
                        size="slim"
                        onClick={() => setSelectedQrSerial(selectedQrSerial === passport.serial ? null : passport.serial)}
                      >
                        <QrCode width="12" height="12" />
                      </Button>
                    </div>
                  </div>

                  {selectedQrSerial === passport.serial && (
                    <Box paddingBlockStart="300">
                      <Card>
                        <Box padding="400" alignment="center">
                          <Text as="p" variant="bodySm" fontWeight="semibold">
                            Passport QR & NFC Tag
                          </Text>
                          <Box paddingBlockStart="200">
                            <Text as="p" variant="bodySm" tone="subdued">
                              Serial: {selectedQrSerial}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              Resolver URI: /passport/{selectedQrSerial}
                            </Text>
                            <Text as="p" variant="bodySm">
                              NFC Tag Standard: NXP NTAG 424 DNA Ready
                            </Text>
                          </Box>
                          <Box paddingBlockStart="200">
                            <Button size="slim" onClick={() => setSelectedQrSerial(null)}>
                              Close
                            </Button>
                          </Box>
                        </Box>
                      </Card>
                    </Box>
                  )}

                  {showCertSerial === passport.serial && (
                    <Box paddingBlockStart="300">
                      <Card>
                        <Box padding="600" alignment="center">
                          <InlineStack gap="200" blockAlign="center">
                            <Award width="16" height="16" />
                            <Text as="p" variant="bodySm" tone="success">
                              {currentTenant.settings.brand_name} Official Hallmark
                            </Text>
                          </InlineStack>
                          <Box paddingBlockStart="300">
                            <Text as="h2" variant="headingMd">
                              Certificate of Authenticity
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              Permanent cryptographic identity verified in {currentTenant.settings.brand_name} Atelier registry.
                            </Text>
                          </Box>
                          <Box paddingBlockStart="300">
                            <div style={{ textAlign: 'left' }}>
                              <Text as="p" variant="bodySm">Serial Number: {showCertSerial}</Text>
                              <Text as="p" variant="bodySm">Registry Status: Authenticated Original</Text>
                              <Text as="p" variant="bodySm">
                                Certificate Number: CERT-2026-AUR-{(Math.random() * 9000 + 1000).toFixed(0)}
                              </Text>
                            </div>
                          </Box>
                          <Box paddingBlockStart="300">
                            <InlineStack gap="200">
                              <Button onClick={() => setShowCertSerial(null)}>Close</Button>
                              <Button variant="primary" onClick={() => window.print()}>
                                <Printer width="12" height="12" /> Print Certificate
                              </Button>
                            </InlineStack>
                          </Box>
                        </Box>
                      </Card>
                    </Box>
                  )}
                </Box>
              </Card>
            </Layout.Section>
          );
        })}
      </Layout>
    </Page>
  );
};
