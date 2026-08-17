# NFC, QR, and Extended Verification Features

This document covers the new features added to the Digital Product Passport system.

## Table of Contents

1. [NFC Tag Management](#nfc-tag-management)
2. [QR Code Generation](#qr-code-generation)
3. [Physical Tag Labels](#physical-tag-labels)
4. [PDF Certificates of Authenticity](#pdf-certificates)
5. [Provenance Timeline](#provenance-timeline)
6. [Third-Party Verification API](#verification-api)

---

## NFC Tag Management

Register and manage NFC tags linked to physical pieces for tap-to-verify authentication.

### Admin Endpoints

#### List all NFC-tagged pieces
```
GET /api/admin/nfc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "serial": "PRD-2026-000001",
      "nfc_uid": "04ABC123DEF456",
      "product_ref": {
        "title": "Premium Handbag",
        "image_url": "https://..."
      },
      "passport": { ... }
    }
  ]
}
```

#### Register NFC tag
```
POST /api/admin/nfc/register
```

**Request:**
```json
{
  "physical_piece_id": "uuid",
  "nfc_uid": "04ABC123DEF456",
  "notes": "NTAG424 DNA tag registered"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "serial": "PRD-2026-000001",
    "nfc_uid": "04ABC123DEF456"
  }
}
```

#### Update NFC tag
```
PATCH /api/admin/nfc/:pieceId
```

**Request:**
```json
{
  "nfc_uid": "04NEW456DEF789"
}
```

#### Unregister NFC tag
```
DELETE /api/admin/nfc/:pieceId
```

Removes the NFC tag association from a physical piece.

#### Bulk register NFC tags
```
POST /api/admin/nfc/bulk
```

**Request:**
```json
{
  "records": [
    { "serial": "PRD-2026-000001", "nfc_uid": "04ABC123" },
    { "serial": "PRD-2026-000002", "nfc_uid": "04DEF456" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": ["PRD-2026-000001", "PRD-2026-000002"],
    "failed": []
  }
}
```

### Service Layer

```typescript
import { NFCTagService } from '../domains/nfc/nfc-tag.service';

// Register tag
await NFCTagService.registerTag(shopId, {
  physical_piece_id: 'uuid',
  nfc_uid: '04ABC123DEF456'
}, actorId);

// Lookup by NFC UID
const piece = await NFCTagService.lookupByUID(shopId, '04ABC123DEF456');
```

---

## QR Code Generation

Generate downloadable QR codes for physical pieces that link to their digital passports.

### Admin Endpoints

#### Download QR as PNG
```
GET /api/admin/qr/:serial/png
```

Returns a high-resolution PNG (1000x1000px) suitable for printing.

**Headers:**
- `Content-Type: image/png`
- `Content-Disposition: attachment; filename="qr-{serial}.png"`

#### Download QR as SVG
```
GET /api/admin/qr/:serial/svg
```

Returns a vector SVG for scalable printing.

**Headers:**
- `Content-Type: image/svg+xml`
- `Content-Disposition: attachment; filename="qr-{serial}.svg"`

#### Get QR as base64 data URL
```
GET /api/admin/qr/:serial
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qr": "data:image/png;base64,iVBORw0KG...",
    "serial": "PRD-2026-000001"
  }
}
```

### Service Layer

```typescript
import { QRDownloadService } from '../domains/passport/qr-download.service';

// Generate PNG buffer
const png = await QRDownloadService.generatePNG(shopId, serial);

// Generate SVG string
const svg = await QRDownloadService.generateSVG(shopId, serial);

// Generate data URL
const dataUrl = await QRDownloadService.generateDataURL(shopId, serial);

// Batch generate
const batch = await QRDownloadService.generateBatch(shopId, ['SERIAL1', 'SERIAL2']);
```

---

## Physical Tag Labels

Generate printable labels combining serial numbers and QR codes for attaching to products.

### Admin Endpoints

#### Get label HTML
```
GET /api/admin/labels/:serial
```

**Response:**
```json
{
  "success": true,
  "data": {
    "html": "<html>...</html>",
    "serial": "PRD-2026-000001"
  }
}
```

#### Download label for printing
```
GET /api/admin/labels/:serial/download
```

Returns ready-to-print HTML (thermal printer compatible).

**Headers:**
- `Content-Type: text/html`
- `Content-Disposition: attachment; filename="label-{serial}.html"`

#### Batch labels
```
GET /api/admin/labels/batch?serials=SERIAL1,SERIAL2,SERIAL3
```

Returns a multi-page HTML document with all labels ready for batch printing.

### Service Layer

```typescript
import { LabelGeneratorService } from '../infrastructure/label/label-generator.service';

// Get label data
const data = await LabelGeneratorService.getLabelData(shopId, serial);

// Generate HTML label
const html = LabelGeneratorService.generateLabelHTML(data, {
  width: 300,
  height: 150,
  showQR: true,
  backgroundColor: '#ffffff',
  textColor: '#18181b'
});

// Generate SVG label (thermal printers)
const svg = await LabelGeneratorService.generateSVGLabel(shopId, serial);

// Batch labels
const batchHtml = await LabelGeneratorService.generateBatchLabels(
  shopId,
  ['SERIAL1', 'SERIAL2']
);
```

**Label Features:**
- Product title
- Serial number (monospace font)
- Edition number (if applicable)
- QR code
- Customizable colors and dimensions
- Thermal printer compatible

---

## PDF Certificates

Generate Certificates of Authenticity with SHA-256 verification hashes.

### Admin Endpoints

#### Get certificate data
```
GET /api/admin/certificates/:serial
```

**Response:**
```json
{
  "success": true,
  "data": {
    "brand_name": "Luxury Maison",
    "serial": "PRD-2026-000001",
    "product_title": "Premium Handbag",
    "edition": "Edition 18 of 100",
    "owner_email": "customer@example.com",
    "issue_date": "2026-08-17",
    "manufacturing_location": "Paris Atelier",
    "materials": ["Italian Leather", "Gold Hardware"],
    "certificate_number": "CERT-ABC123-DEF456",
    "verification_hash": "A1B2C3..."
  }
}
```

#### List all certificates
```
GET /api/admin/certificates?limit=50&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "serial": "PRD-2026-000001",
      "product_title": "Premium Handbag",
      "has_owner": true,
      "owner_email": "customer@example.com",
      "passport_status": "ACTIVE",
      "created_at": "2026-08-17T10:00:00Z"
    }
  ]
}
```

### Service Layer

```typescript
import { PDFCertificateService } from '../infrastructure/certificate/pdf-certificate.service';

// Get certificate data
const certData = await PDFCertificateService.getCertificateData(shopId, serial);

// Generate verification hash
const hash = PDFCertificateService.generateVerificationHash(certData);

// Custom owner (for gifting)
const giftCert = await PDFCertificateService.getCertificateDataWithCustomOwner(
  shopId,
  serial,
  { name: 'Gift Recipient', email: 'recipient@example.com' }
);
```

**Certificate Features:**
- Unique certificate number
- SHA-256 cryptographic verification hash
- Product details (serial, edition, materials)
- Owner information (private)
- Manufacturing details
- Warranty end date (if applicable)
- Elegant print-ready HTML format

**Verification Hash:**
The hash is computed from:
```
brand_name : serial : certificate_number : owner_email : issue_date : salt
```

---

## Provenance Timeline

Complete product journey history from manufacturing to current ownership.

### Admin Endpoints

#### Get private timeline (full details)
```
GET /api/admin/provenance/:serial
```

**Response:**
```json
{
  "success": true,
  "data": {
    "serial": "PRD-2026-000001",
    "product_title": "Premium Handbag",
    "current_status": "ACTIVE",
    "events": [
      {
        "type": "MANUFACTURED",
        "date": "2026-01-15T00:00:00Z",
        "title": "Crafted",
        "description": "Handcrafted in Paris Atelier"
      },
      {
        "type": "AUTHENTICATED",
        "date": "2026-02-01T10:30:00Z",
        "title": "Authenticated",
        "description": "Verified via NFC",
        "metadata": { "method": "NFC" }
      },
      {
        "type": "OWNED",
        "date": "2026-02-05T14:20:00Z",
        "title": "Ownership",
        "description": "Owned by Jane Doe (jane@example.com)",
        "metadata": { "source": "REGISTRATION", "is_active": true }
      },
      {
        "type": "SERVICE",
        "date": "2027-03-10T00:00:00Z",
        "title": "Service Completed",
        "description": "Annual care service performed"
      }
    ]
  }
}
```

#### Get public timeline (sanitized)
```
GET /api/admin/provenance/:serial/public
```

Same structure but owner names/emails are hidden.

### Public Endpoints

#### Public timeline
```
GET /api/public/provenance/:serial
```

Returns sanitized timeline without private owner information.

### Service Layer

```typescript
import { ProvenanceService } from '../domains/passport/provenance.service';

// Private timeline (admin view)
const timeline = await ProvenanceService.getPrivateTimeline(shopId, serial);

// Public timeline (customer/public view)
const publicTimeline = await ProvenanceService.getPublicTimeline(shopId, serial);

// Abbreviated timeline
const summary = await ProvenanceService.getAbbreviatedTimeline(shopId, serial);
// Returns: { manufactured, first_authenticated, service_count, last_service }
```

**Event Types:**
- `MANUFACTURED` - Product creation
- `AUTHENTICATED` - First authentication scan
- `SOLD` - Initial sale (if tracked)
- `REGISTERED` - Customer registration
- `OWNED` - Ownership event
- `TRANSFERRED` - Ownership transfer
- `SERVICE` - Care/service completed
- `WARRANTY` - Warranty activation
- `STATUS_CHANGE` - Lost/stolen reports

---

## Third-Party Verification API

Public, rate-limited endpoints for external systems to verify product authenticity.

### Public Endpoints

#### Verify by serial
```
GET /api/public/verify/:serial
```

**Response:**
```json
{
  "verified": true,
  "serial": "PRD-2026-000001",
  "product_title": "Premium Handbag",
  "edition": "18/100",
  "authenticated": true,
  "status": "ACTIVE",
  "message": "Authentic piece verified.",
  "timestamp": "2026-08-17T12:00:00Z"
}
```

**Status Values:**
- `ACTIVE` - Verified authentic piece
- `LOST` - Reported lost
- `STOLEN` - Reported stolen
- `REVOKED` - Digital identity revoked
- `UNKNOWN` - Serial not found

#### Verify by NFC UID
```
GET /api/public/verify/nfc/:nfcUid
```

Same response format as serial verification.

#### Quick status check
```
GET /api/public/status/:serial
```

Minimal response for high-volume lookups:

**Response:**
```json
{
  "exists": true,
  "status": "ACTIVE"
}
```

### Service Layer

```typescript
import { VerificationAPIService } from '../domains/verification/verification-api.service';

// Verify by serial
const result = await VerificationAPIService.verifyBySerial(shopId, serial);

// Verify by NFC
const nfcResult = await VerificationAPIService.verifyByNFC(shopId, nfcUid);

// Quick status
const status = await VerificationAPIService.quickStatus(shopId, serial);

// Batch verification
const batch = await VerificationAPIService.batchVerify(
  shopId,
  ['SERIAL1', 'SERIAL2', 'SERIAL3']
);
```

### Rate Limiting

**Recommendation:** Implement rate limiting middleware for verification endpoints:

```typescript
// Example rate limit: 100 requests per hour per IP
app.use('/api/public/verify', rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 100
}));
```

### API Keys (Future Enhancement)

For higher volume third-party integrations, implement API key authentication:

```
GET /api/public/verify/:serial
Headers: X-API-Key: your-api-key-here
```

---

## Integration Examples

### Admin UI: Generate & Download QR Code

```typescript
async function downloadQR(serial: string) {
  const response = await fetch(`/api/admin/qr/${serial}/png`);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `qr-${serial}.png`;
  a.click();
}
```

### Admin UI: Print Batch Labels

```typescript
async function printBatchLabels(serials: string[]) {
  const serialsParam = serials.join(',');
  window.open(`/api/admin/labels/batch?serials=${serialsParam}`, '_blank');
}
```

### Public Passport: Display Timeline

```typescript
async function loadProvenance(serial: string) {
  const response = await fetch(`/api/public/provenance/${serial}`);
  const { data } = await response.json();
  
  // Render timeline
  data.events.forEach(event => {
    console.log(`${event.date}: ${event.title} - ${event.description}`);
  });
}
```

### NFC Scanner Integration (Mobile)

```typescript
async function scanNFC() {
  if ('NDEFReader' in window) {
    const reader = new NDEFReader();
    await reader.scan();
    
    reader.onreading = async ({ serialNumber }) => {
      // Verify via API
      const response = await fetch(`/api/public/verify/nfc/${serialNumber}`);
      const result = await response.json();
      
      if (result.verified) {
        // Redirect to passport
        window.location.href = `/passport/${result.serial}`;
      } else {
        alert(result.message);
      }
    };
  }
}
```

---

## Security Considerations

1. **NFC UIDs are not secrets** - They should be paired with cryptographic verification for high-security use cases
2. **Rate limit public endpoints** - Prevent abuse of verification API
3. **Audit trail** - All NFC registrations are logged in audit logs
4. **Tenant isolation** - All queries are scoped to shop_id
5. **No PII in public responses** - Verification API returns only public data
6. **Certificate hashes** - Use salt to prevent rainbow table attacks

---

## Future Enhancements

1. **PDF Generation** - Convert HTML certificates to PDF using puppeteer or similar
2. **NTAG424 DNA Support** - Cryptographic NFC authentication with SUN messages
3. **Blockchain Provenance** - Optional immutable provenance anchoring
4. **API Key Management** - Self-service API keys for third-party integrations
5. **Webhook Events** - Notify external systems of authentication events
6. **Mobile SDK** - Native iOS/Android SDK for NFC scanning

---

## Testing

### Test NFC Registration

```bash
curl -X POST http://localhost:3000/api/admin/nfc/register \
  -H "Content-Type: application/json" \
  -d '{
    "physical_piece_id": "uuid",
    "nfc_uid": "04ABC123DEF456"
  }'
```

### Test QR Generation

```bash
curl http://localhost:3000/api/admin/qr/PRD-2026-000001/png \
  --output qr.png
```

### Test Verification API

```bash
curl http://localhost:3000/api/public/verify/PRD-2026-000001
```

---

## Database Schema Updates Required

These features use existing schema fields. No migrations needed for:
- `PhysicalPiece.nfc_uid` (already exists)
- `PhysicalPiece.qr_code_payload` (already exists)
- Relations: `auth_events`, `ownerships`, `transfers`, `services`, etc.

---

## Deployment Checklist

- [ ] Set `PUBLIC_APP_URL` environment variable for QR codes
- [ ] Configure rate limiting for verification endpoints
- [ ] Set up CDN caching for public passport/verification responses
- [ ] Enable audit logging for NFC registration events
- [ ] Test NFC scanning on iOS and Android devices
- [ ] Generate sample certificates and verify hash generation
- [ ] Test label printing on thermal printers
- [ ] Document API endpoints for third-party developers

---

## Support

For questions or issues with these features, see:
- Main architecture docs: `docs/architecture.md`
- API documentation: `docs/api.md`
- Security guidelines: `docs/security.md`
