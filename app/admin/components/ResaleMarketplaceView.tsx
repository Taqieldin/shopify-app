import { useState, useEffect } from 'react';
import { authFetch } from '../../utils/api';
import {
  Page,
  Layout,
  Card,
  DataTable,
  Button,
  Banner,
  Badge,
  Text,
  Thumbnail,
  InlineStack,
  Spinner,
  Box,
} from '@shopify/polaris';
import { Store } from 'lucide-react';

interface AdminResaleListing {
  id: string;
  price: number;
  currency: string;
  status: 'LISTED' | 'SOLD' | 'CANCELLED';
  notes?: string;
  listed_at: string;
  sold_at?: string;
  physical_piece: {
    serial: string;
    product_ref: { title: string; image_url?: string };
  };
  seller: { email: string };
  buyer?: { email: string };
}

export function ResaleMarketplaceView() {
  const [listings, setListings] = useState<AdminResaleListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      const response = await authFetch('/api/admin/resale');
      const data = await response.json();
      if (data.success) {
        setListings(data.data);
      } else {
        setError(data.error?.message || 'Failed to load listings');
      }
    } catch (err) {
      setError('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const cancelListing = async (listingId: string) => {
    if (!confirm('Remove this listing from the marketplace?')) return;
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(`/api/admin/resale/${listingId}/cancel`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Listing cancelled');
        loadListings();
      } else {
        setError(data.error?.message || 'Failed to cancel listing');
      }
    } catch (err) {
      setError('Failed to cancel listing');
    } finally {
      setLoading(false);
    }
  };

  const rows = listings.map((listing) => [
    <InlineStack key="piece" gap="200" blockAlign="center">
      <Thumbnail
        source={listing.physical_piece.product_ref.image_url || ''}
        alt={listing.physical_piece.product_ref.title}
        size="small"
      />
      <div>
        <Text as="span" variant="bodyMd" fontWeight="semibold">
          {listing.physical_piece.product_ref.title}
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          {listing.physical_piece.serial}
        </Text>
      </div>
    </InlineStack>,
    <Text as="span" key="price" variant="bodyMd">
      {listing.currency} {listing.price.toLocaleString()}
    </Text>,
    <Text as="span" key="seller" variant="bodyMd">
      {listing.seller.email}
    </Text>,
    <Text as="span" key="buyer" variant="bodyMd">
      {listing.buyer?.email || '—'}
    </Text>,
    <Badge
      key="status"
      tone={listing.status === 'LISTED' ? 'attention' : listing.status === 'SOLD' ? 'success' : 'critical'}
    >
      {listing.status}
    </Badge>,
    <Button
      key="cancel"
      size="slim"
      tone="critical"
      disabled={listing.status !== 'LISTED'}
      onClick={() => cancelListing(listing.id)}
    >
      Remove
    </Button>,
  ]);

  return (
    <Page
      title="Pre-Owned Marketplace"
      subtitle="Oversight of Private Club resale listings. Members list verified pieces; sales mint an ownership certificate and move the digital passport to the buyer."
    >
      <Layout>
        <Layout.Section>
          {error && (
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          )}
          {success && (
            <Banner tone="success" onDismiss={() => setSuccess(null)}>
              {success}
            </Banner>
          )}
          <Card>
            {loading ? (
              <Box padding="400">
                <div className="flex items-center justify-center py-12">
                  <Spinner size="large" />
                </div>
              </Box>
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Store className="w-10 h-10 text-zinc-600" />
                <Text as="p" variant="bodyMd" alignment="center" tone="subdued">
                  No marketplace listings yet
                </Text>
                <Text as="p" variant="bodySm" alignment="center" tone="subdued">
                  Listings appear here when collectors list pieces for resale through the Private Club.
                </Text>
              </div>
            ) : (
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                headings={['Piece', 'Price', 'Seller', 'Buyer', 'Status', '']}
                rows={rows}
              />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}