# Phase 2 Features - Advanced Capabilities

## Overview

Phase 2 adds advanced authentication, integration, and automation capabilities:

1. **PDF Certificate Generation** - Convert HTML certificates to downloadable PDFs
2. **NTAG424 DNA Support** - Cryptographic NFC authentication  
3. **API Key Management** - Self-service API keys for third parties
4. **Webhook Events** - Notify external systems of authentication/lifecycle events

---

## 1. PDF Certificate Generation

### Overview

Convert HTML certificates to professional PDF documents using puppeteer or pdfkit.

### Installation

```bash
# Option 1: Puppeteer (full browser rendering)
npm install puppeteer

# Option 2: PDFKit (lighter weight, programmatic)
npm install pdfkit
```

### API Endpoint

```
GET /api/admin/certificates/:serial/pdf
```

**Response:**
- Content-Type: `application/pdf`
- Binary PDF file

**Example:**
```bash
curl http://localhost:3000/api/admin/certificates/PRD-001/pdf \
  --output certificate.pdf
```

### Service Layer

```typescript
import { PDFGeneratorService } from '../infrastructure/certificate/pdf-generator.service';

// Generate PDF from certificate data
const pdf = await PDFGeneratorService.generatePDFFromSerial(shopId, serial, {
  format: 'A4',
  orientation: 'portrait',
  printBackground: true,
  margin: {
    top: '20mm',
    right: '20mm',
    bottom: '20mm',
    left: '20mm',
  },
});

// Batch PDFs
const pdfs = await PDFGeneratorService.generateBatchPDFs(shopId, [
  'PRD-001',
  'PRD-002',
]);
```

### PDF Options

- **format**: 'A4' | 'Letter' | 'Legal'
- **orientation**: 'portrait' | 'landscape'
- **printBackground**: Include background colors/images
- **margin**: Page margins in mm

### Alternative: PDFKit (Lighter)

```typescript
const pdf = await PDFGeneratorService.generatePDFWithPDFKit(certData);
```

**Comparison:**

| Feature | Puppeteer | PDFKit |
|---------|-----------|--------|
| File size | Larger (~100MB) | Smaller (~5MB) |
| Rendering | Full HTML/CSS | Programmatic |
| Quality | Exact HTML | Good |
| Performance | Slower (~2-3s) | Faster (~500ms) |

**Recommendation:** Use PDFKit for simple certificates, Puppeteer for complex designs.

---

## 2. NTAG424 DNA Cryptographic Authentication

### Overview

NTAG424 DNA provides military-grade NFC authentication using AES-128 encryption and dynamic CMAC signatures.

### How It Works

1. **Tag Configuration**: Program NTAG424 with AES keys
2. **SUN Message**: Each tap generates unique encrypted URL
3. **Server Verification**: Decrypt and verify CMAC signature
4. **Read Counter**: Detect replay attacks

### SUN URL Format

```
https://domain.com/passport/SERIAL?uid=04ABC...&c=123&enc=...&mac=...
```

**Parameters:**
- `uid` - 7-byte NFC UID
- `c` - Read counter (increments each tap)
- `enc` - Encrypted PICC data
- `mac` - CMAC signature

### Verification Process

```typescript
import { NTAG424CryptoService, verifyNTAG424Scan } from '../domains/nfc/ntag424-crypto.service';

// Verify SUN message
const result = await verifyNTAG424Scan(sunURL, shopId, serial);

if (result.valid && result.confidence === 'HIGH') {
  // Authentic NTAG424 scan
  console.log(`Verified UID: ${result.uid}`);
  console.log(`Read count: ${result.readCounter}`);
} else {
  // Invalid or suspicious
  console.error(result.error);
}
```

### Key Management

Keys must be stored securely per physical piece:

```typescript
// Store keys in database (encrypted at rest)
await prisma.physicalPiece.update({
  where: { id: pieceId },
  data: {
    nfc_type: 'NTAG424',
    nfc_is_cryptographic: true,
    nfc_encryption_key: encryptedKey, // Encrypt before storing!
    nfc_last_read_counter: 0,
  },
});
```

### Security Features

✅ **AES-128 Encryption** - Military-grade encryption  
✅ **CMAC Signatures** - Detect tampering/cloning  
✅ **Read Counter** - Prevent replay attacks  
✅ **Dynamic URLs** - Every tap is unique  
✅ **UID Binding** - Keys tied to specific tag

### Tag Detection

```typescript
// Detect if tag supports cryptographic auth
const isNTAG424 = NTAG424CryptoService.isNTAG424(uid);

// Get security recommendation
const { level, recommendation } = 
  NTAG424CryptoService.getSecurityRecommendation(uid);

console.log(`Security level: ${level}`);
console.log(recommendation);
```

### Implementation Steps

1. **Purchase NTAG424 DNA tags**
2. **Program tags** with AES keys (NFC Tools Pro, TagWriter)
3. **Store keys** in database (encrypted)
4. **Configure SUN** to generate dynamic URLs
5. **Verify scans** using NTAG424CryptoService

---

## 3. API Key Management

### Overview

Self-service API key generation for third-party integrations with scoped permissions and rate limiting.

### Create API Key

```
POST /api/admin/api-keys
```

**Request:**
```json
{
  "name": "Partner Integration",
  "description": "Authentication verification for partner platform",
  "tier": "pro",
  "scopes": ["verify:read", "provenance:read"],
  "rateLimit": 1000,
  "expiresAt": "2027-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "sk_abc123def456...",
    "keyData": {
      "id": "key_uuid",
      "name": "Partner Integration",
      "key_prefix": "sk_abc123",
      "tier": "pro",
      "scopes": ["verify:read", "provenance:read"],
      "rate_limit": 1000,
      "created_at": "2026-08-17T12:00:00Z"
    }
  }
}
```

**⚠️ Important:** The full key is only shown once! Store it securely.

### List API Keys

```
GET /api/admin/api-keys
```

Returns all keys (without revealing actual key values).

### Revoke API Key

```
DELETE /api/admin/api-keys/:keyId
```

### Update API Key

```
PATCH /api/admin/api-keys/:keyId
```

**Update:**
```json
{
  "name": "Updated Name",
  "tier": "enterprise",
  "rateLimit": 5000,
  "scopes": ["*"]
}
```

### Usage Statistics

```
GET /api/admin/api-keys/:keyId/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_requests": 45234,
    "last_used_at": "2026-08-17T11:30:00Z",
    "rate_limit": 1000,
    "tier": "pro",
    "is_active": true
  }
}
```

### Using API Keys

**Public endpoints:**
```bash
curl https://your-domain.com/api/public/verify/PRD-001 \
  -H "X-API-Key: sk_abc123def456..."
```

**Middleware integration:**
```typescript
import { authenticateAPIKey } from '../domains/api-key/api-key.service';

// In your route
const apiKey = req.headers['x-api-key'];
if (apiKey) {
  const keyData = await authenticateAPIKey(apiKey);
  // keyData includes: shop_id, scopes, rate_limit, tier
}
```

### Permission Scopes

- `*` - All permissions
- `verify:read` - Verification API access
- `verify:write` - Not currently used
- `provenance:read` - Provenance timeline access
- `passport:read` - Passport data access
- `status:read` - Status check access

### Rate Limits by Tier

| Tier | Requests/Hour | Cost |
|------|---------------|------|
| Free | 100 | Free |
| Starter | 1,000 | $29/mo |
| Pro | 10,000 | $99/mo |
| Enterprise | 100,000+ | Custom |

---

## 4. Webhook Events

### Overview

Notify external systems when authentication, ownership, or lifecycle events occur.

### Create Webhook

```
POST /api/admin/webhooks
```

**Request:**
```json
{
  "url": "https://partner.com/webhooks/passport",
  "events": [
    "authentication.verified",
    "authentication.suspicious",
    "ownership.transferred",
    "product.stolen"
  ],
  "description": "Partner system notifications"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "webhook_uuid",
    "url": "https://partner.com/webhooks/passport",
    "secret": "whsec_abc123...",
    "events": ["authentication.verified", ...],
    "is_active": true
  }
}
```

**⚠️ Important:** Store the `secret` to verify webhook signatures!

### Available Events

**Authentication:**
- `authentication.verified` - Successful authentication
- `authentication.failed` - Failed authentication
- `authentication.suspicious` - Suspicious activity detected

**Ownership:**
- `ownership.registered` - Product registered
- `ownership.transferred` - Ownership changed
- `ownership.transfer.accepted` - Transfer accepted

**Product Status:**
- `product.lost` - Reported lost
- `product.stolen` - Reported stolen
- `product.recovered` - Recovered

**Service:**
- `service.requested` - Service requested
- `service.completed` - Service completed

**Passport:**
- `passport.created` - Passport created
- `passport.viewed` - Passport viewed
- `passport.revoked` - Passport revoked

### Webhook Payload

```json
{
  "event": "authentication.verified",
  "timestamp": "2026-08-17T12:30:00Z",
  "shop_id": "shop_uuid",
  "data": {
    "serial": "PRD-001",
    "method": "NFC",
    "uid": "04ABC123",
    "result": "AUTHENTICATED",
    "location": "Paris, France"
  }
}
```

### Verify Webhook Signature

```typescript
import { WebhookEventService } from '../domains/webhook/webhook-event.service';

// In your webhook endpoint
const signature = req.headers['x-webhook-signature'];
const payload = JSON.stringify(req.body);
const secret = 'whsec_abc123...'; // From webhook creation

const isValid = WebhookEventService.verifySignature(payload, signature, secret);

if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}

// Process webhook...
```

### List Webhooks

```
GET /api/admin/webhooks
```

### Delete Webhook

```
DELETE /api/admin/webhooks/:webhookId
```

### Delivery History

```
GET /api/admin/webhooks/:webhookId/deliveries?limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "delivery_uuid",
      "event": "authentication.verified",
      "status": "SUCCESS",
      "response_status": 200,
      "created_at": "2026-08-17T12:30:00Z"
    },
    {
      "id": "delivery_uuid",
      "event": "ownership.transferred",
      "status": "FAILED",
      "response_status": 500,
      "error_message": "Internal server error",
      "created_at": "2026-08-17T12:25:00Z"
    }
  ]
}
```

### Trigger Webhooks from Code

```typescript
import { triggerWebhook } from '../domains/webhook/webhook-event.service';

// After authentication
await triggerWebhook(shopId, 'authentication.verified', {
  serial: piece.serial,
  method: 'NFC',
  uid: nfcUid,
  result: 'AUTHENTICATED',
});

// After ownership transfer
await triggerWebhook(shopId, 'ownership.transferred', {
  serial: piece.serial,
  from_customer_id: oldOwner,
  to_customer_id: newOwner,
  transfer_date: new Date().toISOString(),
});
```

### Webhook Retry Strategy

- **Timeout**: 30 seconds
- **Retries**: 3 attempts with exponential backoff
- **Backoff**: 1min, 5min, 15min
- **Failure handling**: Logged in delivery history

### Best Practices

1. **Verify signatures** - Always check X-Webhook-Signature
2. **Idempotency** - Handle duplicate deliveries
3. **Respond quickly** - Return 200 within 5 seconds
4. **Process async** - Queue heavy processing
5. **Monitor failures** - Check delivery history regularly

---

## Database Schema

Run migrations:

```bash
psql -d your_database -f prisma/migrations-phase2.sql
```

**New Tables:**
- `APIKey` - API key storage
- `WebhookEndpoint` - Webhook configurations
- `WebhookDelivery` - Delivery logs

**Updated Tables:**
- `PhysicalPiece` - NTAG424 fields
- `TransferCertificate` - PDF URLs
- `AuthenticationEvent` - Geolocation fields

---

## Security Considerations

### PDF Generation
- ✅ Run puppeteer with `--no-sandbox`
- ✅ Limit concurrent PDF generation (resource intensive)
- ✅ Cache generated PDFs

### NTAG424
- ✅ Store keys encrypted at rest
- ✅ Use unique keys per physical piece
- ✅ Rotate keys if compromised
- ✅ Monitor read counter sequences

### API Keys
- ✅ Hash keys with SHA-256 before storing
- ✅ Only show full key once
- ✅ Implement rate limiting per tier
- ✅ Revoke immediately if compromised

### Webhooks
- ✅ Verify HMAC signatures
- ✅ Use HTTPS only
- ✅ Implement retry backoff
- ✅ Log all deliveries

---

## Testing

### Test PDF Generation

```bash
curl http://localhost:3000/api/admin/certificates/PRD-001/pdf \
  --output test.pdf && open test.pdf
```

### Test API Key

```bash
# Create key
curl -X POST http://localhost:3000/api/admin/api-keys \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Key","scopes":["verify:read"]}'

# Use key
curl http://localhost:3000/api/public/verify/PRD-001 \
  -H "X-API-Key: sk_..."
```

### Test Webhook

```bash
# Create webhook pointing to RequestBin or webhook.site
curl -X POST http://localhost:3000/api/admin/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "url":"https://webhook.site/your-unique-url",
    "events":["authentication.verified"]
  }'

# Trigger authentication event
curl -X POST http://localhost:3000/api/public/passport/PRD-001/authenticate \
  -H "Content-Type: application/json" \
  -d '{"method":"NFC","nfc_uid":"04ABC123"}'

# Check webhook.site for delivery
```

---

## Performance & Scaling

### PDF Generation
- **Concurrency limit**: 5 simultaneous PDFs
- **Cache duration**: 24 hours
- **CDN**: Store PDFs in S3/CDN after generation

### API Keys
- **Rate limit window**: Rolling 1-hour window
- **Storage**: In-memory + Redis for distributed systems
- **Indexing**: Hash index on `hashed_key`

### Webhooks
- **Queue**: Use job queue (Bull, BullMQ) for async delivery
- **Timeout**: 30 seconds per webhook
- **Concurrency**: 10 parallel deliveries

---

## Pricing Recommendations

### API Keys

- **Free**: 100 req/hour, verify:read only
- **Starter**: $29/mo, 1K req/hour, basic scopes
- **Pro**: $99/mo, 10K req/hour, all scopes
- **Enterprise**: Custom, 100K+ req/hour, SLA

### Webhooks

- **Free**: 2 webhooks, 1K events/month
- **Starter**: 5 webhooks, 10K events/month
- **Pro**: 20 webhooks, 100K events/month
- **Enterprise**: Unlimited

---

## Next Steps

See `FEATURES_ADDED.md` for Phase 3 roadmap:
- Blockchain provenance anchoring
- Dynamic QR codes with embedded data
- NFC write protection
- Geolocation tracking
- AI fraud detection

---

**Phase 2 Status: Production Ready ✅**
