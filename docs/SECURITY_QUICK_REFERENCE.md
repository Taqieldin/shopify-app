# Security Features - Quick Reference

## 🔒 Security Layers (6)

### 1. NFC Security Monitoring
**Real-time anomaly detection on every scan**

| Anomaly | Threshold | Alert Level |
|---------|-----------|-------------|
| High-Frequency Scan | >10 scans/hour | HIGH |
| Impossible Travel | Different countries <30 min | CRITICAL |
| Multiple IP Addresses | >5 IPs in 24h | HIGH |
| NFC UID Mismatch | Different UID for same serial | CRITICAL |
| Automated Scanner | Bot/crawler detected | MEDIUM |

**Files:** `server/security/security-monitor.service.ts`

---

### 2. Tenant Isolation
**Strict shop_id enforcement on all queries**

```typescript
// All queries automatically filtered
prisma.physicalPiece.findMany({ 
  // shop_id: currentShopId  ← Added automatically
})

// Security headers on all responses
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

**Files:** `server/security/tenant-isolation.middleware.ts`

---

### 3. PII Protection
**Automatic filtering of personally identifiable information**

| Data Type | Action |
|-----------|--------|
| Email addresses | Masked: `c***r@example.com` |
| Phone numbers | Masked: `***-***-4567` |
| Customer names | Removed from public responses |
| IP addresses | Hashed: `ip_192.168` |
| Internal notes | Filtered from public endpoints |

**Files:** `server/security/pii-filter.service.ts`

---

### 4. Rate Limiting
**Tenant-aware abuse prevention (shop_id:ip)**

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/public/verify/:serial` | 100 req | 1 hour |
| `/api/public/status/:serial` | 1000 req | 1 hour |
| `/api/public/provenance/:serial` | 200 req | 1 hour |
| `/api/admin/qr/:serial/png` | 50 req | 1 hour |

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200000
Retry-After: 3600
```

**Files:** `server/middleware/rate-limiter.ts`

---

### 5. Security Dashboard
**Visual alert management and monitoring**

**Navigate to:** `/admin?tab=security`

**Features:**
- Real-time security alerts
- Scan pattern analysis
- NFC blocklist management
- Alert acknowledgement workflow

**Component:** `app/admin/components/SecurityDashboardView.tsx`

---

### 6. Audit Trail
**Complete logging of all security events**

**Tables:**
- `AuthenticationEvent` - All scan attempts
- `AuthenticationRiskEvent` - Anomalies detected
- `AuditLog` - Security actions
- `NFCBlocklist` - Blocked NFC UIDs

---

## 🛡️ Security API Endpoints

```typescript
// List security alerts
GET /api/admin/security/alerts?level=HIGH&limit=50

// Acknowledge alert
POST /api/admin/security/alerts/:eventId/acknowledge
Body: { "notes": "Reviewed and confirmed legitimate" }

// Block NFC UID
POST /api/admin/security/block-nfc
Body: { 
  "nfc_uid": "04:A1:B2:C3:D4:E5:F6",
  "reason": "Multiple impossible travel events"
}

// Get scan pattern analysis
GET /api/admin/security/scan-patterns/:serial

// List blocked NFC UIDs
GET /api/admin/security/blocked-nfc

// Unblock NFC UID
DELETE /api/admin/security/blocked-nfc/:nfcUid
```

---

## ⚙️ Configuration

### Required
```bash
CERT_HASH_SALT=your-random-32-character-salt-here
```

### Optional
```bash
SECURITY_ALERTS_EMAIL=security@company.com
SECURITY_ALERTS_SLACK_WEBHOOK=https://hooks.slack.com/...
RATE_LIMIT_VERIFICATION=100
RATE_LIMIT_STATUS=1000
RATE_LIMIT_PROVENANCE=200
```

---

## 🗄️ Database Migrations

```bash
# Apply security tables
sqlite3 prisma/dev.db < prisma/migrations-security.sql

# Or PostgreSQL
psql -U postgres -d your_db -f prisma/migrations-security.sql

# Regenerate Prisma Client
npx prisma generate
```

---

## 🧪 Testing

```bash
# Run comprehensive security test suite
npm run tsx examples/test-security-features.ts
```

**Tests:**
- ✅ NFC security monitoring
- ✅ NFC blocklist
- ✅ Scan pattern analysis
- ✅ PII filtering
- ✅ Tenant isolation
- ✅ Security alerts

---

## 📊 Monitoring

### Key Metrics

| Metric | Target | Action if Exceeded |
|--------|--------|-------------------|
| CRITICAL alerts/day | 0 | Investigate immediately |
| HIGH alerts/day | < 5 | Review within 24h |
| Blocked NFC UIDs | Track trend | Monitor for patterns |
| Rate limit violations | < 1% | Adjust limits if needed |
| PII exposure incidents | 0 | Fix immediately |

### Alert Response Times

| Level | Response Time | Example |
|-------|--------------|---------|
| 🔴 CRITICAL | Immediate | Impossible travel detected |
| 🟠 HIGH | < 24 hours | High-frequency scanning |
| 🟡 MEDIUM | < 3 days | Automated scanner detected |
| 🟢 LOW | < 1 week | Informational only |

---

## 🚨 Incident Response

### CRITICAL Alert Response

1. **Acknowledge** alert in dashboard
2. **Investigate** scan pattern and details
3. **Block NFC UID** if confirmed malicious
4. **Contact customer** if legitimate
5. **Document** resolution in alert notes
6. **Follow up** within 7 days

### Example: Impossible Travel

**Alert:** "Scanned in France 15 minutes after USA scan"

**Steps:**
1. Check scan pattern: `GET /api/admin/security/scan-patterns/:serial`
2. Review IP addresses and devices
3. Check customer travel history
4. Contact customer to verify
5. **If legitimate:** Acknowledge with notes
6. **If suspicious:** Block NFC UID + mark UNDER_REVIEW

---

## ✅ Deployment Checklist

### Pre-Deploy
- [ ] Set `CERT_HASH_SALT` environment variable
- [ ] Apply security migrations
- [ ] Configure alert notifications
- [ ] Test rate limiting
- [ ] Verify tenant isolation
- [ ] Run security test suite

### Post-Deploy (First 24 Hours)
- [ ] Monitor security dashboard
- [ ] Review rate limit violations
- [ ] Check PII filtering on public endpoints
- [ ] Verify audit logs are writing
- [ ] Test NFC blocklist workflow

### Ongoing (Weekly)
- [ ] Review security alerts
- [ ] Analyze scan patterns
- [ ] Update NFC blocklist if needed
- [ ] Monitor rate limit trends
- [ ] Audit PII filtering

---

## 📚 Documentation

### Quick Links
- **Complete Guide:** `docs/security.md` (4,500 lines)
- **Implementation:** `SECURITY_IMPLEMENTATION_COMPLETE.md`
- **API Reference:** `docs/nfc-qr-features.md`
- **Testing:** `examples/test-security-features.ts`

---

## 🆘 Support

| Issue Type | Contact | Response Time |
|------------|---------|---------------|
| Security vulnerability | security@company.com | < 4 hours |
| CRITICAL alert | Slack: #security-alerts | < 1 hour |
| Bug report | support@company.com | < 24 hours |
| Question | Slack: #general | < 3 days |

---

## 🎯 Quick Commands

```bash
# View security logs (last 100)
sqlite3 prisma/dev.db "SELECT * FROM AuthenticationRiskEvent ORDER BY created_at DESC LIMIT 100;"

# Count alerts by severity
sqlite3 prisma/dev.db "SELECT severity, COUNT(*) FROM AuthenticationRiskEvent GROUP BY severity;"

# List blocked NFC UIDs
sqlite3 prisma/dev.db "SELECT nfc_uid, reason, blocked_at FROM NFCBlocklist WHERE is_active = 1;"

# Check rate limit stats (in Node.js console)
const { getRateLimitStats } = require('./server/middleware/rate-limiter');
console.log(getRateLimitStats());
```

---

## ⚡ Performance

| Operation | Overhead | Impact |
|-----------|----------|--------|
| Tenant isolation | ~1ms | Negligible |
| PII filtering | ~2ms | Low |
| Rate limiting | ~5ms | Low |
| Security analysis | ~30ms | Medium |
| Audit logging | ~10ms | Low |
| **Total** | **< 50ms** | **Low** |

---

## 🔐 Security Best Practices

### For Merchants

✅ **DO:**
- Review security dashboard daily
- Investigate CRITICAL alerts immediately
- Use NTAG424 DNA for products >$500
- Block suspicious NFC UIDs promptly
- Set up email/Slack notifications

❌ **DON'T:**
- Ignore security alerts
- Use basic NTAG213 for luxury goods
- Share API keys publicly
- Disable security monitoring

### For Developers

✅ **DO:**
- Always filter by `shop_id`
- Apply PII middleware to public routes
- Use tenant-aware rate limiting
- Log security events
- Test tenant isolation

❌ **DON'T:**
- Hardcode `shop_id` values
- Skip tenant validation
- Expose internal IDs publicly
- Log raw PII
- Trust client-provided `shop_id`

---

**Version:** 1.0.0  
**Status:** Production Ready ✅  
**Last Updated:** January 15, 2024

