# Quick Start Guide - New Features

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js and npm installed
- Shopify app configured
- Database with existing `PhysicalPiece` records

### 1. Install Dependencies (if needed)

```bash
npm install qrcode
```

The `qrcode` package is required for QR code generation.

### 2. Set Environment Variables

Add to your `.env` file:

```bash
PUBLIC_APP_URL=https://your-domain.com
```

### 3. Test the API

Start your server and test the endpoints:

```bash
# Test QR generation
curl http://localhost:3000/api/admin/qr/YOUR-SERIAL/png --output test-qr.png

# Test verification API
curl http://localhost:3000/api/public/verify/YOUR-SERIAL

# Test provenance timeline
curl http://localhost:3000/api/public/provenance/YOUR-SERIAL
```

### 4. Register Your First NFC Tag

```bash
curl -X POST http://localhost:3000/api/admin/nfc/register \
  -H "Content-Type: application/json" \
  -d '{
    "physical_piece_id": "your-piece-uuid",
    "nfc_uid": "04ABC123DEF456"
  }'
```

### 5. Generate a Printable Label

Open in browser:
```
http://localhost:3000/api/admin/labels/YOUR-SERIAL/download
```

Then press Ctrl+P (or Cmd+P on Mac) to print!

---

## 📱 Mobile NFC Scanning

### iOS (Safari 14+)

1. Open Safari on iPhone
2. Navigate to your passport page
3. Tap the NFC icon or "Scan with NFC" button
4. Hold phone near NFC tag

### Android (Chrome)

1. Open Chrome
2. Navigate to your passport page
3. Tap "Scan with NFC"
4. Hold phone near tag (NFC must be enabled in settings)

### Example Implementation

```typescript
import { MobileNFCScanner } from './examples/mobile-nfc-scanner';

<MobileNFCScanner
  onScan={(serial) => {
    // Handle successful scan
    window.location.href = `/passport/${serial}`;
  }}
  onError={(error) => {
    // Handle error
    console.error(error);
  }}
  baseUrl="https://your-domain.com"
/>
```

---

## 🎨 Admin UI Integration

### Add NFC Management to Admin

```tsx
import { NFCManagementView } from './app/admin/components/NFCManagementView';

// In your admin router/navigation
<Route path="/admin/nfc" element={<NFCManagementView />} />
```

### Add Download Buttons

```tsx
function DownloadButtons({ serial }) {
  return (
    <>
      <Button onClick={() => downloadQR(serial, 'png')}>
        Download QR (PNG)
      </Button>
      <Button onClick={() => downloadQR(serial, 'svg')}>
        Download QR (SVG)
      </Button>
      <Button onClick={() => downloadLabel(serial)}>
        Print Label
      </Button>
    </>
  );
}

async function downloadQR(serial, format) {
  const response = await fetch(`/api/admin/qr/${serial}/${format}`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `qr-${serial}.${format}`;
  a.click();
}

function downloadLabel(serial) {
  window.open(`/api/admin/labels/${serial}/download`, '_blank');
}
```

---

## 🌐 Public Passport Page

### Add Provenance Timeline

```tsx
import { ProvenanceTimeline } from './app/public/passport/ProvenanceTimeline';

function PassportPage({ serial }) {
  return (
    <div>
      {/* ... existing passport content ... */}
      
      <ProvenanceTimeline serial={serial} />
    </div>
  );
}
```

### Add Verification Badge

```tsx
async function loadVerificationStatus(serial) {
  const response = await fetch(`/api/public/verify/${serial}`);
  const data = await response.json();
  
  return (
    <div className={`badge ${data.verified ? 'verified' : 'unverified'}`}>
      {data.verified ? '✓ Verified Authentic' : '⚠️ ' + data.message}
    </div>
  );
}
```

---

## 🔒 Security Setup

### 1. Enable Rate Limiting

Rate limiting is already integrated in the public routes. Monitor your logs for:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

### 2. Monitor Suspicious Activity

Check your `AuthenticationEvent` and `AuthenticationRiskEvent` tables regularly:

```sql
-- Recent high-risk authentications
SELECT * FROM authentication_risk_events 
WHERE risk_level = 'HIGH_RISK' 
ORDER BY created_at DESC 
LIMIT 10;

-- Unusual scan patterns
SELECT physical_piece_id, COUNT(*) as scan_count
FROM authentication_events
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY physical_piece_id
HAVING COUNT(*) > 10;
```

### 3. Configure CDN Caching

For public endpoints, add CDN caching:

```
Cache-Control: public, max-age=300, s-maxage=3600
```

Recommended cache times:
- `/api/public/verify/:serial` - 5 minutes
- `/api/public/provenance/:serial` - 10 minutes
- `/api/public/status/:serial` - 1 minute

---

## 🧪 Testing

Run the test suite:

```bash
cd examples
npx ts-node test-new-features.ts
```

Or integrate into your existing test framework:

```typescript
import { runAllTests } from './examples/test-new-features';

describe('New Features', () => {
  it('should pass all tests', async () => {
    await runAllTests();
  });
});
```

---

## 📊 Monitoring

### Key Metrics to Track

1. **NFC Registrations**: Count of `nfc_uid` fields populated
2. **QR Downloads**: API calls to `/api/admin/qr/*`
3. **Verification Requests**: API calls to `/api/public/verify/*`
4. **Rate Limit Hits**: 429 responses
5. **Authentication Events**: Rows in `authentication_events`

### Example Monitoring Query

```sql
-- Daily metrics
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE nfc_uid IS NOT NULL) as nfc_tagged_pieces,
  COUNT(*) FILTER (WHERE passport IS NOT NULL) as pieces_with_passport,
  COUNT(*) as total_pieces
FROM physical_pieces
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

---

## 🎯 Common Use Cases

### Use Case 1: Bulk Tag Registration

You have 100 products with NFC tags. Create a CSV:

```csv
serial,nfc_uid
PRD-001,04ABC123
PRD-002,04DEF456
PRD-003,04GHI789
```

Then use the bulk API:

```bash
curl -X POST http://localhost:3000/api/admin/nfc/bulk \
  -H "Content-Type: application/json" \
  -d @nfc-tags.json
```

### Use Case 2: Print All Labels for New Collection

```typescript
// Get all serials for a collection
const serials = ['PRD-001', 'PRD-002', 'PRD-003'];

// Generate batch labels
const url = `/api/admin/labels/batch?serials=${serials.join(',')}`;
window.open(url, '_blank');
// Opens print dialog with all labels
```

### Use Case 3: Third-Party Integration

Partner wants to verify products on their platform:

```javascript
// Partner's code
async function verifyProduct(serial) {
  const response = await fetch(
    `https://your-domain.com/api/public/verify/${serial}`,
    {
      headers: {
        'X-API-Key': 'partner-api-key', // If implemented
      },
    }
  );
  
  const result = await response.json();
  
  if (result.verified) {
    // Show "Verified Authentic" badge
  } else {
    // Show warning
  }
}
```

### Use Case 4: Customer Verifies at Point of Sale

1. Customer scans NFC tag with phone
2. Verification API confirms authenticity
3. Passport page opens showing:
   - Product details
   - Edition number
   - Provenance timeline
   - Warranty status
4. Customer completes purchase with confidence

---

## 🐛 Troubleshooting

### QR Code Not Generating

**Problem**: 404 error when downloading QR
**Solution**: Ensure the serial exists in `physical_pieces` table

```sql
SELECT * FROM physical_pieces WHERE serial = 'YOUR-SERIAL';
```

### NFC Tag Not Reading

**Problem**: Phone doesn't detect tag
**Solutions**:
- Ensure NFC is enabled on phone
- Try removing phone case
- Hold phone flat against tag for 2-3 seconds
- Check tag is not damaged/deactivated

### Rate Limit Errors

**Problem**: 429 Too Many Requests
**Solution**: Wait for the `Retry-After` header time or implement API key authentication

### Verification Returns "Unknown"

**Problem**: `status: "UNKNOWN"` in verification response
**Solution**: Ensure:
1. Serial exists in database
2. Physical piece has a passport created
3. Shop ID is correct

---

## 📚 Next Steps

1. **Read Full Documentation**: `docs/nfc-qr-features.md`
2. **Customize UI**: Modify React components in `app/admin/components/`
3. **Add PDF Generation**: Integrate puppeteer for PDF certificates
4. **Implement API Keys**: For third-party partners
5. **Add Analytics**: Track QR scans, NFC taps, verifications

---

## 💡 Pro Tips

1. **Use SVG for websites**: SVG QR codes scale infinitely and are smaller files
2. **Use PNG for printing**: 1000x1000px PNG for high-quality prints
3. **Cache QR codes**: Store generated QR data URLs in database to avoid regeneration
4. **Batch operations**: Use bulk endpoints for large imports
5. **Monitor rate limits**: Set up alerts for high 429 response rates

---

## 🆘 Support

- Full Documentation: `docs/nfc-qr-features.md`
- Architecture: `docs/architecture.md`
- API Reference: `docs/api.md`
- Feature Summary: `FEATURES_ADDED.md`

---

**Ready to go live?** ✅

See `FEATURES_ADDED.md` for the complete feature list and deployment checklist.
