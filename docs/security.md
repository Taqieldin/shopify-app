# Security Implementation Guide

Complete security architecture for multi-tenant product authentication and digital identity platform.

## Table of Contents

- [Overview](#overview)
- [Security Layers](#security-layers)
- [NFC Security](#nfc-security)
- [Tenant Isolation](#tenant-isolation)
- [PII Protection](#pii-protection)
- [Rate Limiting](#rate-limiting)
- [Security Monitoring](#security-monitoring)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)

---

## Overview

Our security architecture implements defense-in-depth with multiple layers of protection:

1. **NFC Cloning Protection** - Cryptographic authentication and behavioral analysis
2. **Tenant Isolation** - Strict shop_id enforcement across all data access
3. **PII Protection** - Automatic filtering of personally identifiable information
4. **Rate Limiting** - Abuse prevention on public endpoints
5. **Security Monitoring** - Real-time anomaly detection and alerting
6. **Audit Trail** - Complete logging of all security events

---

## Security Layers

### Layer 1: Network Security

```typescript
// Security headers applied to all responses
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

### Layer 2: Authentication & Authorization

- JWT-based session tokens
- Role-based access control (MERCHANT_OWNER, MERCHANT_ADMIN, MERCHANT_STAFF)
- API key authentication for third-party integrations
- Tenant context validation on every request

### Layer 3: Data Security

- Tenant isolation middleware
- Input sanitization and validation
- SQL injection prevention via Prisma ORM
- PII filtering on public endpoints

### Layer 4: Application Security

- NFC UID blocklist
- Behavioral anomaly detection
- Rate limiting per tenant+IP
- Audit logging for all sensitive operations

---

## NFC Security

### The NFC UID Problem

**NFC UIDs are not secrets** - they can be cloned with inexpensive hardware. Our defense strategy:

#### 1. NTAG424 DNA Support (High Security)

For high-value products, use NTAG424 DNA chips with cryptographic authentication:

```typescript
import { NTAG424CryptoService } from './server/domains/nfc/ntag424-crypto.service';

// Verify SUN message from NTAG424
const result = await NTAG424CryptoService.verifySUNMessage(
  shopId,
  nfcUid,
  sunMessage
);

if (!result.is_authentic) {
  throw new Error('Cryptographic verification failed');
}
```

**Features:**
- AES-128 encryption
- CMAC signature verification
- Rolling codes prevent replay attacks
- Tamper detection

#### 2. Behavioral Analysis (All NFC Tags)

Even with cloneable UIDs, we can detect suspicious patterns:

```typescript
// Automatic analysis on every scan
const alerts = await SecurityMonitorService.analyzeScan(
  shopId,
  serial,
  nfcUid,
  {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    location: { city: 'Paris', country: 'France' },
  }
);

// Alert types:
// - HIGH_FREQUENCY_SCAN (>10 scans/hour)
// - IMPOSSIBLE_TRAVEL (different countries <30 min)
// - MULTIPLE_IP_ADDRESSES (>5 IPs)
// - NFC_UID_MISMATCH (tag swap detected)
// - AUTOMATED_SCANNER (bot detected)
```

#### 3. NFC Blocklist

Block suspicious NFC UIDs from authentication:

```bash
# Block an NFC UID
POST /api/admin/security/block-nfc
{
  "nfc_uid": "04:A1:B2:C3:D4:E5:F6",
  "reason": "Multiple impossible travel events detected"
}

# List blocked UIDs
GET /api/admin/security/blocked-nfc

# Unblock an NFC UID
DELETE /api/admin/security/blocked-nfc/04:A1:B2:C3:D4:E5:F6
```

### NFC Best Practices

1. **Use NTAG424 DNA** for products >$500 value
2. **Pair NFC with additional verification** (QR code, serial lookup)
3. **Monitor scan patterns** via security dashboard
4. **Set up alerts** for impossible travel and high-frequency scans
5. **Block suspicious UIDs** immediately
6. **Educate customers** about cloning risks

---

## Tenant Isolation

### Strict shop_id Enforcement

Every database query is automatically filtered by `shop_id`:

```typescript
// Prisma middleware enforces tenant isolation
prisma.$use(createTenantIsolationMiddleware(currentShopId));

// All queries automatically filtered
const pieces = await prisma.physicalPiece.findMany({
  // shop_id filter added automatically
});

// Cross-tenant access blocked
const piece = await prisma.physicalPiece.findUnique({
  where: { 
    shop_id_serial: { 
      shop_id: 'shop-123', // Must match authenticated shop
      serial: 'ABC-001' 
    } 
  }
});
```

### Validation Middleware

```typescript
// Validate shop_id in request matches authenticated tenant
app.use(validateShopIdParam);

// Audit all tenant access attempts
await auditTenantAccess(
  shopId,
  actorId,
  'physical_piece',
  pieceId,
  'READ',
  success
);
```

### Resource Access Validation

```typescript
// Validate tenant owns a resource before operations
const hasAccess = await validateTenantAccess(
  shopId,
  'physical_piece',
  pieceId
);

if (!hasAccess) {
  throw new UnauthorizedError('Shop ID mismatch - access denied');
}
```

---

## PII Protection

### Automatic PII Filtering

All public endpoints automatically filter PII:

```typescript
// Middleware applied to all /api/public/* routes
app.use('/api/public', piiFilterMiddleware);

// Detects and removes:
// - Email addresses
// - Phone numbers
// - Social Security Numbers
// - Credit card numbers
// - Customer names
// - IP addresses
// - Physical addresses
```

### Public Response Filtering

```typescript
// Filter passport data for public view
const publicData = PIIFilterService.filterPublicPassportData(passport);
// Allowed: serial, product_title, edition, status, brand_name
// Removed: customer info, internal notes, costs, IPs

// Filter ownership data
const publicOwnership = PIIFilterService.filterPublicOwnershipData(ownership);
// Returns: { is_registered: true, started_at: '2024-01-01' }
// Removes: customer name, email, phone, address

// Filter provenance timeline
const publicTimeline = PIIFilterService.filterPublicProvenanceEvents(events);
// Sanitizes descriptions: "Transferred to John Doe" → "Transferred to [owner]"
// Removes: email addresses, phone numbers, IPs
```

### PII Detection

```typescript
// Detect PII in responses (for security audits)
const { hasPII, fields } = PIIFilterService.detectPII(responseData);

if (hasPII) {
  console.warn(`⚠️ PII detected: ${fields.join(', ')}`);
  // Trigger security alert
}
```

### Masking Utilities

```typescript
// Mask email for display to admins
PIIFilterService.maskEmail('customer@example.com');
// Returns: "c***r@example.com"

// Mask phone number
PIIFilterService.maskPhone('+1-555-123-4567');
// Returns: "***-***-4567"

// Hash sensitive data for logs
PIIFilterService.hashSensitiveData('sensitive-value');
// Returns: "a1b2c3d4e5f6g7h8" (SHA-256 hash, first 16 chars)
```

---

## Rate Limiting

### Tenant-Aware Rate Limiting

Rate limits are enforced per `shop_id:ip` combination:

```typescript
// Default rate limit key generator
function getTenantRateLimitKey(req) {
  const shopId = req.tenant?.shop_id || 'unknown';
  const ip = req.ip || 'unknown';
  return `${shopId}:${ip}`;
}
```

### Public Endpoint Limits

```typescript
// Verification API: 100 req/hour per shop+IP
GET /api/public/verify/:serial
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200000
Retry-After: 3600

// Status Check: 1000 req/hour (lighter endpoint)
GET /api/public/status/:serial
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950

// Provenance: 200 req/hour
GET /api/public/provenance/:serial
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 180

// QR Downloads: 50 downloads/hour
GET /api/admin/qr/:serial/png
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
```

### API Key-Based Rate Limiting

For trusted partners with API keys:

```typescript
// Tiered rate limits based on API key tier
const limits = {
  free: 100,      // 100 req/hour
  starter: 1000,  // 1,000 req/hour
  pro: 10000,     // 10,000 req/hour
  enterprise: 100000, // 100,000 req/hour
};

// Header: X-API-Key: key_abc123...
// Rate limit based on key tier
```

### Rate Limit Monitoring

```typescript
// Get current rate limit stats
GET /api/admin/rate-limits/stats

{
  "totalKeys": 1234,
  "activeKeys": 567,
  "topConsumers": [
    { "key": "shop-123:192.168.1.1", "count": 95, "resetTime": 1609459200000 }
  ]
}
```

---

## Security Monitoring

### Real-Time Anomaly Detection

Automatic analysis on every NFC scan:

```typescript
// Impossible travel detection
if (scannedInParis && previousScanInNewYork && timeDiff < 30min) {
  alert: 'CRITICAL - IMPOSSIBLE_TRAVEL'
}

// High-frequency scanning (burst attack)
if (scansLastHour > 10) {
  alert: 'HIGH - HIGH_FREQUENCY_SCAN'
}

// Multiple IP addresses (cloning indicator)
if (uniqueIPsLast24h > 5) {
  alert: 'HIGH - MULTIPLE_IP_ADDRESSES'
}

// NFC UID change (tag replacement)
if (nfcUid !== previousNfcUid) {
  alert: 'CRITICAL - NFC_UID_MISMATCH'
}

// Automated scanner detection
if (userAgent.match(/bot|crawler|curl|wget/)) {
  alert: 'MEDIUM - AUTOMATED_SCANNER'
}
```

### Security Dashboard

View and manage security alerts:

```bash
# List all security alerts
GET /api/admin/security/alerts?level=HIGH&limit=50

{
  "success": true,
  "data": [
    {
      "level": "CRITICAL",
      "type": "IMPOSSIBLE_TRAVEL",
      "message": "Scanned in France only 15 minutes after scan in USA",
      "serial": "LV-2024-001",
      "details": {
        "previous_country": "USA",
        "current_country": "France",
        "time_diff_minutes": 15
      },
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}

# Acknowledge alert
POST /api/admin/security/alerts/:eventId/acknowledge
{
  "notes": "Verified with customer - legitimate travel via private jet"
}

# Get scan pattern analysis
GET /api/admin/security/scan-patterns/LV-2024-001

{
  "serial": "LV-2024-001",
  "nfc_uid": "04:A1:B2:C3:D4:E5:F6",
  "scan_count": 127,
  "unique_locations": 8,
  "unique_ips": 12,
  "first_scan": "2024-01-01T12:00:00Z",
  "last_scan": "2024-01-15T10:30:00Z",
  "suspicious_indicators": [
    "HIGH_SCAN_COUNT",
    "MANY_UNIQUE_IPS"
  ]
}
```

### Audit Trail

Complete logging of all security events:

```typescript
// All authentication attempts logged
await prisma.authenticationEvent.create({
  data: {
    shop_id,
    physical_piece_id,
    method: 'NFC',
    result: 'AUTHENTICATED',
    risk_level: 'LOW_RISK',
    nfc_uid,
    nfc_read_counter: 42,
    ip_hash: 'ip_192.168',
    device_hash: 'dev_Mozilla',
    country: 'France',
    city: 'Paris',
    metadata_json: JSON.stringify({ anomalies: [] }),
  },
});

// Risk events logged separately
await prisma.authenticationRiskEvent.create({
  data: {
    shop_id,
    physical_piece_id,
    anomaly_type: 'IMPOSSIBLE_TRAVEL',
    severity: 'CRITICAL',
    details_json: JSON.stringify({ /* ... */ }),
  },
});

// Security actions audited
await AuditService.log(shopId, {
  actor_type: 'MERCHANT_ADMIN',
  actor_id: 'user-123',
  action: 'NFC_UID_BLOCKED',
  resource_type: 'nfc_tag',
  resource_id: nfcUid,
  metadata: { reason: 'Multiple impossible travel events' },
});
```

---

## API Reference

### Security Endpoints

#### List Security Alerts

```bash
GET /api/admin/security/alerts
Query Parameters:
  - level (optional): Filter by level (LOW, MEDIUM, HIGH, CRITICAL)
  - limit (optional): Max results (default: 50)

Response:
{
  "success": true,
  "data": [
    {
      "level": "HIGH",
      "type": "HIGH_FREQUENCY_SCAN",
      "message": "12 scans in the last hour - possible cloning attempt",
      "serial": "ABC-001",
      "details": { "scan_count": 12, "nfc_uid": "04:..." },
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Acknowledge Alert

```bash
POST /api/admin/security/alerts/:eventId/acknowledge
Body:
{
  "notes": "Reviewed and confirmed legitimate"
}

Response:
{
  "success": true
}
```

#### Block NFC UID

```bash
POST /api/admin/security/block-nfc
Body:
{
  "nfc_uid": "04:A1:B2:C3:D4:E5:F6",
  "reason": "Multiple impossible travel events detected"
}

Response:
{
  "success": true,
  "message": "NFC UID blocked successfully"
}

Effect:
- NFC UID added to blocklist
- All pieces with this UID marked as UNDER_REVIEW
- Future authentication attempts return REVOKED
```

#### Get Scan Pattern Analysis

```bash
GET /api/admin/security/scan-patterns/:serial

Response:
{
  "success": true,
  "data": {
    "serial": "ABC-001",
    "nfc_uid": "04:A1:B2:C3:D4:E5:F6",
    "scan_count": 127,
    "unique_locations": 8,
    "unique_ips": 12,
    "first_scan": "2024-01-01T12:00:00Z",
    "last_scan": "2024-01-15T10:30:00Z",
    "suspicious_indicators": [
      "HIGH_SCAN_COUNT",
      "MANY_UNIQUE_IPS"
    ]
  }
}
```

#### List Blocked NFC UIDs

```bash
GET /api/admin/security/blocked-nfc

Response:
{
  "success": true,
  "data": [
    {
      "id": "block-123",
      "shop_id": "shop-456",
      "nfc_uid": "04:A1:B2:C3:D4:E5:F6",
      "reason": "Impossible travel detected",
      "blocked_by": "admin-789",
      "blocked_at": "2024-01-15T10:30:00Z",
      "is_active": true
    }
  ]
}
```

#### Unblock NFC UID

```bash
DELETE /api/admin/security/blocked-nfc/:nfcUid

Response:
{
  "success": true,
  "message": "NFC UID unblocked successfully"
}
```

---

## Best Practices

### 1. NFC Security

✅ **DO:**
- Use NTAG424 DNA for high-value products (>$500)
- Monitor scan patterns daily
- Set up automated alerts for impossible travel
- Block suspicious NFC UIDs immediately
- Pair NFC with additional verification methods

❌ **DON'T:**
- Treat NFC UIDs as secrets
- Ignore security alerts
- Use basic NTAG213/215 for luxury goods
- Assume NFC alone is sufficient for authentication

### 2. Tenant Isolation

✅ **DO:**
- Always filter queries by `shop_id`
- Validate resource ownership before operations
- Use Prisma middleware for automatic filtering
- Audit all cross-resource access attempts

❌ **DON'T:**
- Hardcode shop_id values
- Skip tenant validation on "admin" routes
- Trust client-provided shop_id without verification
- Share database connections across tenants

### 3. PII Protection

✅ **DO:**
- Apply PII filter middleware to all public routes
- Hash sensitive data in logs
- Mask PII in admin interfaces
- Regularly audit public responses for PII leaks

❌ **DON'T:**
- Log raw email addresses or phone numbers
- Include customer names in public API responses
- Store unencrypted PII in cookies or localStorage
- Share internal IDs or hashes publicly

### 4. Rate Limiting

✅ **DO:**
- Use tenant-aware rate limiting (shop_id:ip)
- Set appropriate limits per endpoint sensitivity
- Return clear error messages with Retry-After headers
- Monitor rate limit stats for abuse patterns

❌ **DON'T:**
- Use global rate limits (not tenant-aware)
- Set limits so low they impact legitimate users
- Ignore rate limit violations
- Allow unlimited API key requests

### 5. Security Monitoring

✅ **DO:**
- Review security alerts daily
- Investigate all CRITICAL alerts immediately
- Set up email/SMS notifications for high-severity events
- Document resolution steps for common alerts
- Run weekly security reports

❌ **DON'T:**
- Ignore alerts or mark as "false positives" without investigation
- Disable monitoring due to "too many alerts"
- Wait for customer complaints before checking security
- Forget to acknowledge resolved alerts

---

## Certificate Hash Salting

Prevent rainbow table attacks on certificate verification hashes:

```typescript
import crypto from 'crypto';

// Generate salted hash
function generateVerificationHash(certData: CertificateData): string {
  const salt = process.env.CERT_HASH_SALT || 'default-salt-change-me';
  const hashInput = `${certData.serial}:${certData.edition}:${certData.issued_at}:${salt}`;
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

// Verify certificate
function verifyCertificate(serial: string, providedHash: string): boolean {
  const certData = getCertificateData(serial);
  const expectedHash = generateVerificationHash(certData);
  return crypto.timingSafeEqual(
    Buffer.from(providedHash, 'hex'),
    Buffer.from(expectedHash, 'hex')
  );
}
```

**Environment Variable:**
```bash
# .env
CERT_HASH_SALT=your-random-32-char-salt-here
```

---

## Security Checklist

### Pre-Launch

- [ ] Configure `CERT_HASH_SALT` environment variable
- [ ] Enable tenant isolation middleware
- [ ] Apply PII filter to all public routes
- [ ] Set up rate limiting on verification endpoints
- [ ] Configure security monitoring alerts
- [ ] Review all audit log configurations
- [ ] Test NFC blocklist functionality
- [ ] Verify NTAG424 DNA integration (if used)
- [ ] Set up security dashboard access controls

### Ongoing

- [ ] Review security alerts daily
- [ ] Monitor rate limit violations weekly
- [ ] Audit PII exposure monthly
- [ ] Update NFC blocklist as needed
- [ ] Test authentication flows quarterly
- [ ] Review tenant isolation annually
- [ ] Update security documentation

---

## Support

For security issues or questions:
- **Email:** security@yourcompany.com
- **Docs:** https://docs.yourcompany.com/security
- **Slack:** #security-alerts

**Report security vulnerabilities privately to avoid public disclosure.**

---

## Changelog

**v1.0.0** (2024-01-15)
- Initial security implementation
- NFC blocklist and anomaly detection
- Tenant isolation middleware
- PII filtering service
- Rate limiting enhancements
- Security monitoring dashboard

