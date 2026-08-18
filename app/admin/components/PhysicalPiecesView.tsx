import React, { useState, useEffect } from 'react';
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
  DropZone,
} from '@shopify/polaris';
import { authFetch } from '../../utils/api';
import { Tag, Search, ShieldCheck, UserCheck, QrCode, UploadCloud, Download, Plus, Check, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';

export const PhysicalPiecesView: React.FC = () => {
  const { currentTenant, pieces, createPieceAndPassport } = useTenant();
  const [view, setView] = useState<'list' | 'create' | 'qr-download' | 'csv-import'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Create form state
  const [newSerial, setNewSerial] = useState('');
  const [newProductTitle, setNewProductTitle] = useState('');
  const [newEditionNumber, setNewEditionNumber] = useState('');
  const [newEditionTotal, setNewEditionTotal] = useState('');
  const [newManufacturingLocation, setNewManufacturingLocation] = useState('Paris Atelier');
  const [newColor, setNewColor] = useState('Classic');

  // QR state
  const [qrPiece, setQrPiece] = useState<any | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // CSV state
  const [csvText, setCsvText] = useState('serial,product_title,edition_number,edition_total,location,color\n');
  const [csvImportResult, setCsvImportResult] = useState<string | null>(null);

  useEffect(() => {
    if (qrPiece) {
      const destinationUrl = `${window.location.origin}/passport/${qrPiece.serial}`;
      QRCode.toDataURL(destinationUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#18181b',
          light: '#ffffff',
        },
      }).then(setQrDataUrl);
    }
  }, [qrPiece]);

  const handleDownloadQR = () => {
    if (!qrDataUrl || !qrPiece) return;
    const link = document.createElement('a');
    link.download = `QR-${qrPiece.serial}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleCreatePiece = (e: React.FormEvent) => {
    e.preventDefault();
    createPieceAndPassport(
      {
        serial: newSerial,
        product_title: newProductTitle,
        product_image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800',
        edition_number: newEditionNumber ? Number(newEditionNumber) : undefined,
        edition_total: newEditionTotal ? Number(newEditionTotal) : undefined,
        manufacturing_location: newManufacturingLocation,
        color: newColor,
        materials: [{ name: 'Box Calfskin' }],
      },
      {
        title: `Digital Passport — ${newProductTitle}`,
        description: `Official digital product identity for ${newSerial}.`,
      }
    );
    setSuccessBanner('Piece and passport registered successfully');
    setView('list');
    setNewSerial('');
    setNewProductTitle('');
    setNewEditionNumber('');
    setNewEditionTotal('');
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  const handleBatchImport = () => {
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
            product_image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800',
            edition_number: parts[2] ? Number(parts[2].trim()) : undefined,
            edition_total: parts[3] ? Number(parts[3].trim()) : undefined,
            manufacturing_location: parts[4]?.trim() || 'Paris Atelier',
            color: parts[5]?.trim() || 'Classic',
            materials: [{ name: 'Box Calfskin' }],
          },
          {
            title: `Digital Passport — ${parts[1].trim()}`,
            description: `Official digital product identity for ${parts[0].trim()}.`,
          }
        );
        count++;
      }
    }

    setCsvImportResult(`Successfully registered ${count} new serialized pieces into registry!`);
    setTimeout(() => {
      setView('list');
      setCsvImportResult(null);
    }, 1500);
  };

  const filteredPieces = pieces.filter((p) => {
    const matchesSearch =
      p.serial.toLowerCase().includes(search.toLowerCase()) ||
      p.product_title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // CREATE PIECE VIEW
  if (view === 'create') {
    return (
      <Page title="Create Physical Piece">
        <Layout>
          <Layout.Section>
            <Box paddingBlockStart="400">
              <Button onClick={() => setView('list')} variant="plain">
                ← Back to Physical Pieces
              </Button>
            </Box>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="600">
                <form onSubmit={handleCreatePiece}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <TextField
                      label="Serial Number"
                      value={newSerial}
                      onChange={setNewSerial}
                      requiredIndicator
                      autoComplete="off"
                      placeholder="e.g. VNG-2026-000001"
                    />
                    <TextField
                      label="Product Title"
                      value={newProductTitle}
                      onChange={setNewProductTitle}
                      requiredIndicator
                      autoComplete="off"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                    <TextField
                      label="Edition Number"
                      type="number"
                      value={newEditionNumber}
                      onChange={setNewEditionNumber}
                      autoComplete="off"
                    />
                    <TextField
                      label="Edition Total"
                      type="number"
                      value={newEditionTotal}
                      onChange={setNewEditionTotal}
                      autoComplete="off"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                    <TextField
                      label="Manufacturing Location"
                      value={newManufacturingLocation}
                      onChange={setNewManufacturingLocation}
                      autoComplete="off"
                    />
                    <TextField
                      label="Color"
                      value={newColor}
                      onChange={setNewColor}
                      autoComplete="off"
                    />
                  </div>

                  <Box paddingBlockStart="500">
                    <InlineStack gap="200" align="end">
                      <Button onClick={() => setView('list')}>Cancel</Button>
                      <Button variant="primary" submit>
                        Register Piece
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

  // QR DOWNLOAD VIEW
  if (view === 'qr-download' && qrPiece) {
    return (
      <Page title="Physical Tag QR Code">
        <Layout>
          <Layout.Section>
            <Box paddingBlockStart="400">
              <Button onClick={() => { setView('list'); setQrPiece(null); }} variant="plain">
                ← Back to Physical Pieces
              </Button>
            </Box>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="600" alignment="center">
                <Box padding="400" borderRadius="200" background="surface">
                  {qrDataUrl && <img src={qrDataUrl} alt="Passport QR" style={{ width: '192px', height: '192px' }} />}
                </Box>

                <Box paddingBlockStart="400">
                  <Text as="p" variant="bodyMd" fontWeight="bold" color="success">
                    {qrPiece.serial}
                  </Text>
                  <Text as="p" variant="bodySm" color="subdued">
                    {qrPiece.product_title}
                  </Text>
                </Box>

                <Box paddingBlockStart="400">
                  <Button variant="primary" onClick={handleDownloadQR}>
                    <Download width="14" height="14" /> Download PNG Tag
                  </Button>
                </Box>
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
      <Page title="Batch Import Serialized Pieces">
        <Layout>
          <Layout.Section>
            <Box paddingBlockStart="400">
              <Button onClick={() => setView('list')} variant="plain">
                ← Back to Physical Pieces
              </Button>
            </Box>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="600">
                <Box paddingBlockEnd="300">
                  <Text as="h2" variant="headingMd">
                    Batch Import Serialized Pieces
                  </Text>
                  <Text as="p" variant="bodySm" color="subdued">
                    Paste CSV data below. Headers: serial, product_title, edition_number, edition_total, location, color
                  </Text>
                </Box>

                <TextField
                  label="CSV Data"
                  value={csvText}
                  onChange={setCsvText}
                  multiline={8}
                  autoComplete="off"
                  helpText="Headers: serial, product_title, edition_number, edition_total, location, color"
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
                    <Button onClick={() => setView('list')}>Cancel</Button>
                    <Button variant="primary" onClick={handleBatchImport}>
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
      title="Physical Pieces & Serial Registry"
      primaryAction={{
        content: 'Register New Piece',
        onAction: () => setView('create'),
        icon: <Plus />,
      }}
      secondaryActions={[
        {
          content: 'Batch Import CSV',
          onAction: () => setView('csv-import'),
          icon: <UploadCloud />,
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
            Tracking individual manufactured objects, active collectors, and physical NFC chip tags.
          </Text>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', padding: '16px' }}>
              <TextField
                placeholder="Search by serial, model or customer..."
                value={search}
                onChange={setSearch}
                prefix={<Search width="14" height="14" />}
                autoComplete="off"
              />
              <Select
                options={[
                  { label: 'All Statuses', value: 'ALL' },
                  { label: 'Registered', value: 'REGISTERED' },
                  { label: 'Manufactured', value: 'MANUFACTURED' },
                  { label: 'Transferred', value: 'TRANSFERRED' },
                  { label: 'Serviced', value: 'SERVICED' },
                  { label: 'Stolen', value: 'STOLEN' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
              headings={['Serial Number', 'Product Model', 'Edition', 'NFC UID Tag', 'Status', 'Active Owner', 'Actions']}
              rows={filteredPieces.map((piece) => [
                piece.serial,
                piece.product_title,
                piece.edition_number ? `${piece.edition_number} / ${piece.edition_total}` : 'Standard',
                piece.nfc_uid || 'Unmapped',
                <Badge tone={piece.status === 'REGISTERED' ? 'success' : piece.status === 'STOLEN' ? 'critical' : 'info'} key={piece.id}>
                  {piece.status}
                </Badge>,
                piece.active_owner ? piece.active_owner.name : <Text color="subdued">Unclaimed</Text>,
                <Button
                  key={`qr-${piece.id}`}
                  size="slim"
                  onClick={() => { setQrPiece(piece); setView('qr-download'); }}
                >
                  <QrCode width="12" height="12" /> QR Tag
                </Button>,
              ])}
              emptyState="No pieces found matching your search"
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};
