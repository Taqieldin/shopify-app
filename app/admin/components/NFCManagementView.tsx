import { useState, useEffect } from 'react';
import { authFetch } from '../../utils/api';
import {
  Page,
  Layout,
  Card,
  DataTable,
  Button,
  Modal,
  TextField,
  Banner,
  Badge,
  ButtonGroup,
  Thumbnail,
  Text,
  Box,
  Spinner,
} from '@shopify/polaris';
import { Nfc } from 'lucide-react';

interface NFCTaggedPiece {
  id: string;
  serial: string;
  nfc_uid: string;
  product_ref: {
    title: string;
    image_url?: string;
  };
  passport?: {
    status: string;
  };
}

interface NFCWriteLog {
  id: string;
  transfer_count: number;
  algorithm: string;
  created_at: string;
  physical_piece: {
    serial: string;
    product_ref: { title: string };
  };
  new_owner: { shopify_customer_id: string; email: string };
}

export function NFCManagementView() {
  const [pieces, setPieces] = useState<NFCTaggedPiece[]>([]);
  const [writeLogs, setWriteLogs] = useState<NFCWriteLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [nfcUid, setNfcUid] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadNFCPieces();
    loadWriteLogs();
  }, []);

  const loadWriteLogs = async () => {
    try {
      const response = await authFetch('/api/admin/nfc/writes');
      const data = await response.json();
      if (data.success) {
        setWriteLogs(data.data);
      }
    } catch (err) {
      // Non-fatal — the tag table is the primary view
    }
  };

  const loadNFCPieces = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/api/admin/nfc');
      const data = await response.json();
      if (data.success) {
        setPieces(data.data);
      }
    } catch (err) {
      setError('Failed to load NFC-tagged pieces');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterNFC = async () => {
    if (!selectedPiece || !nfcUid) return;

    setLoading(true);
    setError(null);
    try {
      const response = await authFetch('/api/admin/nfc/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          physical_piece_id: selectedPiece,
          nfc_uid: nfcUid,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('NFC tag registered successfully');
        setModalActive(false);
        setNfcUid('');
        setSelectedPiece(null);
        loadNFCPieces();
      } else {
        setError(data.error || 'Failed to register NFC tag');
      }
    } catch (err) {
      setError('Failed to register NFC tag');
    } finally {
      setLoading(false);
    }
  };

  const handleUnregisterNFC = async (pieceId: string) => {
    if (!confirm('Remove NFC tag from this piece?')) return;

    setLoading(true);
    try {
      const response = await authFetch(`/api/admin/nfc/${pieceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('NFC tag removed');
        loadNFCPieces();
      }
    } catch (err) {
      setError('Failed to remove NFC tag');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = async (serial: string, format: 'png' | 'svg') => {
    try {
      const response = await authFetch(`/api/admin/qr/${serial}/${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${serial}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Failed to download QR code`);
    }
  };

  const handleDownloadLabel = async (serial: string) => {
    try {
      window.open(`/api/admin/labels/${serial}/download`, '_blank');
    } catch (err) {
      setError('Failed to open label');
    }
  };

  const rows = pieces.map((piece) => [
    <Thumbnail
      source={piece.product_ref.image_url || ''}
      alt={piece.product_ref.title}
      size="small"
    />,
    piece.serial,
    piece.product_ref.title,
    <code style={{ fontSize: '0.9em', background: '#f4f4f4', padding: '2px 6px', borderRadius: '3px' }}>
      {piece.nfc_uid}
    </code>,
    <Badge tone={piece.passport?.status === 'ACTIVE' ? 'success' : 'attention'}>
      {piece.passport?.status || 'NO_PASSPORT'}
    </Badge>,
    <ButtonGroup>
      <Button size="slim" onClick={() => handleDownloadQR(piece.serial, 'png')}>
        QR PNG
      </Button>
      <Button size="slim" onClick={() => handleDownloadQR(piece.serial, 'svg')}>
        QR SVG
      </Button>
      <Button size="slim" onClick={() => handleDownloadLabel(piece.serial)}>
        Label
      </Button>
      <Button
        size="slim"
        tone="critical"
        onClick={() => handleUnregisterNFC(piece.id)}
      >
        Remove NFC
      </Button>
    </ButtonGroup>,
  ]);

  return (
    <Page
      title="NFC Tag Management"
      primaryAction={{
        content: 'Register NFC Tag',
        onAction: () => setModalActive(true),
      }}
      secondaryActions={[
        {
          content: 'Bulk Register',
          onAction: () => {
            // TODO: Implement bulk upload modal
            alert('Bulk upload coming soon');
          },
        },
      ]}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          </Layout.Section>
        )}

        {success && (
          <Layout.Section>
            <Banner tone="success" onDismiss={() => setSuccess(null)}>
              {success}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            {loading ? (
              <Box padding="400">
                <div className="flex items-center justify-center py-12">
                  <Spinner size="large" />
                </div>
              </Box>
            ) : pieces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Nfc className="w-10 h-10 text-zinc-600" />
                <Text as="p" variant="bodyMd" alignment="center" tone="subdued">
                  No NFC-tagged pieces yet
                </Text>
                <Text as="p" variant="bodySm" alignment="center" tone="subdued">
                  Register an NFC tag to link it with a physical piece for tap-to-verify authentication.
                </Text>
              </div>
            ) : (
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                headings={['Image', 'Serial', 'Product', 'NFC UID', 'Status', 'Actions']}
                rows={rows}
              />
            )}
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Box padding="400">
              <Text as="h3" variant="headingMd">
                NFC Owner Write-Back Log
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Every ownership change on an NFC-tagged piece writes the new owner into the tag payload (AES-256-GCM encrypted). Scans can then prove the current registered owner even offline.
              </Text>
            </Box>
            <DataTable
                columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                headings={['Piece', 'New Owner', 'Transfer #', 'Algorithm', 'Written At']}
                rows={writeLogs.map((log) => [
                  <div key={log.id}>
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      {log.physical_piece.product_ref.title}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {log.physical_piece.serial}
                    </Text>
                  </div>,
                  <Text as="span" key="owner" variant="bodyMd">
                    {log.new_owner.email}
                  </Text>,
                  <Text as="span" key="count" variant="bodyMd">
                    {log.transfer_count}
                  </Text>,
                  <Badge key="algo" tone="info">
                    {log.algorithm}
                  </Badge>,
                  <Text as="span" key="when" variant="bodyMd">
                    {new Date(log.created_at).toLocaleString()}
                  </Text>,
                ])}
              />
            </Card>
          </Layout.Section>

        <Layout.Section>
          <Card padding="400">
            <Text as="h3" variant="headingMd">
              About NFC Tags
            </Text>
            <p>
              NFC (Near Field Communication) tags allow customers to tap their smartphone
              against a product to instantly verify authenticity and view the digital passport.
            </p>
            <br />
            <p>
              <strong>Supported tags:</strong> NTAG424 DNA, NTAG213, NTAG215, NTAG216
            </p>
            <br />
            <p>
              <strong>Note:</strong> NFC UIDs should be paired with cryptographic verification
              for high-security applications.
            </p>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={modalActive}
        onClose={() => setModalActive(false)}
        title="Register NFC Tag"
        primaryAction={{
          content: 'Register',
          onAction: handleRegisterNFC,
          loading,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setModalActive(false),
          },
        ]}
      >
        <Modal.Section>
          <TextField
            label="Physical Piece ID"
            value={selectedPiece || ''}
            onChange={setSelectedPiece}
            placeholder="Enter piece UUID"
            autoComplete="off"
            helpText="The UUID of the physical piece to link the NFC tag to"
          />
          <br />
          <TextField
            label="NFC UID"
            value={nfcUid}
            onChange={setNfcUid}
            placeholder="04ABC123DEF456"
            autoComplete="off"
            helpText="The unique identifier from the NFC tag (hex format)"
          />
        </Modal.Section>
      </Modal>
    </Page>
  );
}
