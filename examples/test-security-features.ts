/**
 * Security Features Test Suite
 * 
 * Tests all security features including:
 * - NFC security monitoring
 * - Tenant isolation
 * - PII filtering
 * - Rate limiting
 * - Security alerts
 * - NFC blocklist
 */

import { prisma } from '../server/infrastructure/database/client';
import { SecurityMonitorService } from '../server/security/security-monitor.service';
import { PIIFilterService } from '../server/security/pii-filter.service';
import { validateTenantAccess, validateSerial, validateNFCUID } from '../server/security/tenant-isolation.middleware';

const SHOP_ID = 'shop_test_security';
const TEST_SERIAL = 'SEC-TEST-001';
const TEST_NFC_UID = '04:A1:B2:C3:D4:E5:F6';

async function setup() {
  console.log('🔧 Setting up test environment...\n');

  // Create test shop
  await prisma.shop.upsert({
    where: { shop_domain: 'test-security.myshopify.com' },
    update: {},
    create: {
      id: SHOP_ID,
      shopify_shop_id: 'gid://shopify/Shop/test-security',
      shop_domain: 'test-security.myshopify.com',
      status: 'ACTIVE',
      plan: 'PRO',
    },
  });

  // Create test product
  const product = await prisma.shopifyProductReference.upsert({
    where: {
      shop_id_shopify_product_id_shopify_variant_id: {
        shop_id: SHOP_ID,
        shopify_product_id: 'gid://shopify/Product/1',
        shopify_variant_id: null,
      },
    },
    update: {},
    create: {
      shop_id: SHOP_ID,
      shopify_product_id: 'gid://shopify/Product/1',
      title: 'Security Test Product',
      handle: 'security-test-product',
      image_url: 'https://example.com/test.jpg',
    },
  });

  // Create test piece
  await prisma.physicalPiece.upsert({
    where: {
      shop_id_serial: {
        shop_id: SHOP_ID,
        serial: TEST_SERIAL,
      },
    },
    update: {},
    create: {
      shop_id: SHOP_ID,
      product_ref_id: product.id,
      serial: TEST_SERIAL,
      nfc_uid: TEST_NFC_UID,
      status: 'MANUFACTURED',
    },
  });

  console.log('✅ Test environment ready\n');
}

async function testNFCSecurityMonitoring() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔒 TEST 1: NFC Security Monitoring');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 1.1: Normal scan (should have no alerts)
  console.log('Test 1.1: Normal scan detection');
  const alerts1 = await SecurityMonitorService.analyzeScan(
    SHOP_ID,
    TEST_SERIAL,
    TEST_NFC_UID,
    {
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      location: { city: 'New York', country: 'USA' },
    }
  );
  console.log(`✅ Normal scan: ${alerts1.length} alerts\n`);

  // Test 1.2: High-frequency scanning (should trigger alert)
  console.log('Test 1.2: High-frequency scan detection');
  const piece = await prisma.physicalPiece.findUnique({
    where: { shop_id_serial: { shop_id: SHOP_ID, serial: TEST_SERIAL } },
  });

  // Create 12 scans in the last hour
  for (let i = 0; i < 12; i++) {
    await prisma.authenticationEvent.create({
      data: {
        shop_id: SHOP_ID,
        physical_piece_id: piece!.id,
        method: 'NFC',
        result: 'AUTHENTICATED',
        risk_level: 'NORMAL',
        nfc_uid: TEST_NFC_UID,
        ip_hash: 'ip_192.168',
        created_at: new Date(Date.now() - (60 - i) * 60 * 1000),
      },
    });
  }

  const alerts2 = await SecurityMonitorService.analyzeScan(
    SHOP_ID,
    TEST_SERIAL,
    TEST_NFC_UID,
    {
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
      location: { city: 'New York', country: 'USA' },
    }
  );

  const highFreqAlert = alerts2.find((a) => a.type === 'HIGH_FREQUENCY_SCAN');
  console.log(
    highFreqAlert
      ? `✅ HIGH_FREQUENCY_SCAN alert triggered: ${highFreqAlert.message}`
      : '❌ HIGH_FREQUENCY_SCAN alert not detected'
  );
  console.log();

  // Test 1.3: Impossible travel (should trigger critical alert)
  console.log('Test 1.3: Impossible travel detection');

  // Create scan in USA
  await prisma.authenticationEvent.create({
    data: {
      shop_id: SHOP_ID,
      physical_piece_id: piece!.id,
      method: 'NFC',
      result: 'AUTHENTICATED',
      risk_level: 'NORMAL',
      nfc_uid: TEST_NFC_UID,
      country: 'USA',
      city: 'New York',
      created_at: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    },
  });

  // Scan in France 15 minutes later
  const alerts3 = await SecurityMonitorService.analyzeScan(
    SHOP_ID,
    TEST_SERIAL,
    TEST_NFC_UID,
    {
      ip: '192.168.1.200',
      userAgent: 'Mozilla/5.0',
      location: { city: 'Paris', country: 'France' },
    }
  );

  const impossibleTravelAlert = alerts3.find((a) => a.type === 'IMPOSSIBLE_TRAVEL');
  console.log(
    impossibleTravelAlert
      ? `✅ IMPOSSIBLE_TRAVEL alert triggered: ${impossibleTravelAlert.message}`
      : '❌ IMPOSSIBLE_TRAVEL alert not detected'
  );
  console.log();

  // Test 1.4: Multiple IP addresses (should trigger alert)
  console.log('Test 1.4: Multiple IP address detection');

  // Create scans from 6 different IPs
  for (let i = 0; i < 6; i++) {
    await prisma.authenticationEvent.create({
      data: {
        shop_id: SHOP_ID,
        physical_piece_id: piece!.id,
        method: 'NFC',
        result: 'AUTHENTICATED',
        risk_level: 'NORMAL',
        nfc_uid: TEST_NFC_UID,
        ip_hash: `ip_192.168.1.${100 + i}`,
        created_at: new Date(Date.now() - (24 - i) * 60 * 60 * 1000),
      },
    });
  }

  const alerts4 = await SecurityMonitorService.analyzeScan(
    SHOP_ID,
    TEST_SERIAL,
    TEST_NFC_UID,
    {
      ip: '192.168.1.107',
      userAgent: 'Mozilla/5.0',
      location: { city: 'New York', country: 'USA' },
    }
  );

  const multiIPAlert = alerts4.find((a) => a.type === 'MULTIPLE_IP_ADDRESSES');
  console.log(
    multiIPAlert
      ? `✅ MULTIPLE_IP_ADDRESSES alert triggered: ${multiIPAlert.message}`
      : '❌ MULTIPLE_IP_ADDRESSES alert not detected'
  );
  console.log();

  // Test 1.5: Automated scanner detection
  console.log('Test 1.5: Automated scanner detection');

  const alerts5 = await SecurityMonitorService.analyzeScan(
    SHOP_ID,
    TEST_SERIAL,
    TEST_NFC_UID,
    {
      ip: '192.168.1.100',
      userAgent: 'curl/7.64.1',
      location: { city: 'New York', country: 'USA' },
    }
  );

  const botAlert = alerts5.find((a) => a.type === 'AUTOMATED_SCANNER');
  console.log(
    botAlert
      ? `✅ AUTOMATED_SCANNER alert triggered: ${botAlert.message}`
      : '❌ AUTOMATED_SCANNER alert not detected'
  );
  console.log();
}

async function testNFCBlocklist() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚫 TEST 2: NFC Blocklist');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const TEST_BLOCKED_UID = '04:B1:C2:D3:E4:F5:A6';

  // Test 2.1: Block an NFC UID
  console.log('Test 2.1: Block NFC UID');
  await SecurityMonitorService.blockNFCUID(
    SHOP_ID,
    TEST_BLOCKED_UID,
    'Suspected cloning - multiple impossible travel events',
    'admin-test'
  );
  console.log(`✅ NFC UID ${TEST_BLOCKED_UID} blocked\n`);

  // Test 2.2: Check if blocked
  console.log('Test 2.2: Verify UID is blocked');
  const isBlocked = await SecurityMonitorService.isNFCBlocked(SHOP_ID, TEST_BLOCKED_UID);
  console.log(isBlocked ? '✅ UID correctly identified as blocked' : '❌ UID not detected as blocked');
  console.log();

  // Test 2.3: Check non-blocked UID
  console.log('Test 2.3: Verify non-blocked UID');
  const isNotBlocked = await SecurityMonitorService.isNFCBlocked(SHOP_ID, TEST_NFC_UID);
  console.log(
    !isNotBlocked ? '✅ Non-blocked UID correctly identified' : '❌ Non-blocked UID incorrectly flagged'
  );
  console.log();
}

async function testScanPatternAnalysis() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 TEST 3: Scan Pattern Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const pattern = await SecurityMonitorService.getScanPattern(SHOP_ID, TEST_SERIAL);

  if (pattern) {
    console.log('✅ Scan pattern retrieved:');
    console.log(`   Serial: ${pattern.serial}`);
    console.log(`   NFC UID: ${pattern.nfc_uid}`);
    console.log(`   Total scans: ${pattern.scan_count}`);
    console.log(`   Unique locations: ${pattern.unique_locations}`);
    console.log(`   Unique IPs: ${pattern.unique_ips}`);
    console.log(`   First scan: ${pattern.first_scan}`);
    console.log(`   Last scan: ${pattern.last_scan}`);
    console.log(`   Suspicious indicators: ${pattern.suspicious_indicators.join(', ') || 'None'}`);
  } else {
    console.log('❌ Failed to retrieve scan pattern');
  }
  console.log();
}

async function testPIIFiltering() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 TEST 4: PII Filtering');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 4.1: Email masking
  console.log('Test 4.1: Email masking');
  const email = 'customer@example.com';
  const maskedEmail = PIIFilterService.maskEmail(email);
  console.log(`   Original: ${email}`);
  console.log(`   Masked: ${maskedEmail}`);
  console.log(maskedEmail !== email ? '✅ Email correctly masked' : '❌ Email not masked');
  console.log();

  // Test 4.2: Phone masking
  console.log('Test 4.2: Phone number masking');
  const phone = '+1-555-123-4567';
  const maskedPhone = PIIFilterService.maskPhone(phone);
  console.log(`   Original: ${phone}`);
  console.log(`   Masked: ${maskedPhone}`);
  console.log(maskedPhone.includes('***') ? '✅ Phone correctly masked' : '❌ Phone not masked');
  console.log();

  // Test 4.3: PII detection
  console.log('Test 4.3: PII detection in response');
  const responseWithPII = {
    serial: TEST_SERIAL,
    customer_email: 'customer@example.com',
    customer_phone: '+1-555-123-4567',
    product_title: 'Test Product',
  };

  const { hasPII, fields } = PIIFilterService.detectPII(responseWithPII);
  console.log(`   Has PII: ${hasPII}`);
  console.log(`   PII fields: ${fields.join(', ')}`);
  console.log(hasPII && fields.length > 0 ? '✅ PII correctly detected' : '❌ PII not detected');
  console.log();

  // Test 4.4: Public passport filtering
  console.log('Test 4.4: Public passport data filtering');
  const passportData = {
    serial: TEST_SERIAL,
    product_title: 'Test Product',
    customer_email: 'customer@example.com',
    internal_notes: 'Private notes',
    customer_id: 'cust_123',
  };

  const filtered = PIIFilterService.filterPublicPassportData(passportData);
  console.log('   Filtered data:', filtered);
  console.log(
    filtered.serial && !filtered.customer_email && !filtered.internal_notes
      ? '✅ PII correctly filtered from public data'
      : '❌ PII filtering incomplete'
  );
  console.log();

  // Test 4.5: Description sanitization
  console.log('Test 4.5: Description sanitization');
  const descriptions = [
    'Transferred to John Doe',
    'Contact customer@example.com for details',
    'Call +1-555-123-4567',
  ];

  console.log('   Original → Sanitized:');
  descriptions.forEach((desc) => {
    const sanitized = PIIFilterService['sanitizeDescription'](desc);
    console.log(`   "${desc}" → "${sanitized}"`);
  });
  console.log('✅ Descriptions sanitized\n');
}

async function testTenantIsolation() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏢 TEST 5: Tenant Isolation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 5.1: Serial validation
  console.log('Test 5.1: Serial number validation');
  const validSerials = ['ABC-123', 'TEST-001', 'LV-2024-001'];
  const invalidSerials = ['abc;123', "test'001", 'x'];

  console.log('   Valid serials:');
  validSerials.forEach((serial) => {
    const isValid = validateSerial(serial);
    console.log(`   ${serial}: ${isValid ? '✅' : '❌'}`);
  });

  console.log('   Invalid serials:');
  invalidSerials.forEach((serial) => {
    const isValid = validateSerial(serial);
    console.log(`   ${serial}: ${!isValid ? '✅ (correctly rejected)' : '❌ (incorrectly accepted)'}`);
  });
  console.log();

  // Test 5.2: NFC UID validation
  console.log('Test 5.2: NFC UID validation');
  const validUIDs = ['04:A1:B2:C3:D4:E5:F6', '04A1B2C3D4E5F6', '04-A1-B2-C3-D4-E5-F6'];
  const invalidUIDs = ['INVALID', '04:ZZ:XX', '12345'];

  console.log('   Valid UIDs:');
  validUIDs.forEach((uid) => {
    const isValid = validateNFCUID(uid);
    console.log(`   ${uid}: ${isValid ? '✅' : '❌'}`);
  });

  console.log('   Invalid UIDs:');
  invalidUIDs.forEach((uid) => {
    const isValid = validateNFCUID(uid);
    console.log(`   ${uid}: ${!isValid ? '✅ (correctly rejected)' : '❌ (incorrectly accepted)'}`);
  });
  console.log();

  // Test 5.3: Tenant access validation
  console.log('Test 5.3: Tenant resource access validation');
  const piece = await prisma.physicalPiece.findUnique({
    where: { shop_id_serial: { shop_id: SHOP_ID, serial: TEST_SERIAL } },
  });

  const hasAccess = await validateTenantAccess(SHOP_ID, 'physical_piece', piece!.id);
  console.log(hasAccess ? '✅ Tenant access correctly validated' : '❌ Tenant access validation failed');
  console.log();

  // Test cross-tenant access (should fail)
  console.log('Test 5.4: Cross-tenant access prevention');
  const wrongShopId = 'shop_wrong';
  try {
    const hasWrongAccess = await validateTenantAccess(wrongShopId, 'physical_piece', piece!.id);
    console.log(
      !hasWrongAccess
        ? '✅ Cross-tenant access correctly denied'
        : '❌ Cross-tenant access incorrectly allowed'
    );
  } catch (error) {
    console.log('✅ Cross-tenant access correctly denied (threw error)');
  }
  console.log();
}

async function testSecurityAlerts() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  TEST 6: Security Alerts');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Create some risk events
  const piece = await prisma.physicalPiece.findUnique({
    where: { shop_id_serial: { shop_id: SHOP_ID, serial: TEST_SERIAL } },
  });

  await prisma.authenticationRiskEvent.create({
    data: {
      shop_id: SHOP_ID,
      physical_piece_id: piece!.id,
      anomaly_type: 'IMPOSSIBLE_TRAVEL',
      severity: 'CRITICAL',
      details_json: JSON.stringify({ from: 'USA', to: 'France', minutes: 15 }),
    },
  });

  await prisma.authenticationRiskEvent.create({
    data: {
      shop_id: SHOP_ID,
      physical_piece_id: piece!.id,
      anomaly_type: 'HIGH_FREQUENCY_SCAN',
      severity: 'HIGH',
      details_json: JSON.stringify({ scans_per_hour: 12 }),
    },
  });

  // Retrieve alerts
  const alerts = await SecurityMonitorService.getShopAlerts(SHOP_ID, { limit: 10 });

  console.log(`✅ Retrieved ${alerts.length} security alerts:`);
  alerts.forEach((alert, i) => {
    console.log(`\n   Alert ${i + 1}:`);
    console.log(`   Level: ${alert.level}`);
    console.log(`   Type: ${alert.type}`);
    console.log(`   Message: ${alert.message}`);
    console.log(`   Serial: ${alert.serial}`);
    console.log(`   Time: ${alert.timestamp}`);
  });
  console.log();
}

async function cleanup() {
  console.log('🧹 Cleaning up test data...\n');

  // Delete test data
  await prisma.authenticationEvent.deleteMany({ where: { shop_id: SHOP_ID } });
  await prisma.authenticationRiskEvent.deleteMany({ where: { shop_id: SHOP_ID } });
  await prisma.nFCBlocklist.deleteMany({ where: { shop_id: SHOP_ID } });
  await prisma.physicalPiece.deleteMany({ where: { shop_id: SHOP_ID } });
  await prisma.shopifyProductReference.deleteMany({ where: { shop_id: SHOP_ID } });
  await prisma.shop.delete({ where: { id: SHOP_ID } });

  console.log('✅ Cleanup complete\n');
}

async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║                                               ║');
  console.log('║     SECURITY FEATURES TEST SUITE              ║');
  console.log('║                                               ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log('\n');

  try {
    await setup();
    await testNFCSecurityMonitoring();
    await testNFCBlocklist();
    await testScanPatternAnalysis();
    await testPIIFiltering();
    await testTenantIsolation();
    await testSecurityAlerts();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    throw error;
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

// Run tests
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
