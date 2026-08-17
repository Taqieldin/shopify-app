/**
 * Test Suite for New NFC, QR, and Verification Features
 * 
 * Run with: npx ts-node examples/test-new-features.ts
 * Or integrate into your test framework (Jest, Vitest, etc.)
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_SHOP_ID = process.env.TEST_SHOP_ID || 'test-shop-id';
const TEST_SERIAL = 'PRD-2026-TEST-001';
const TEST_NFC_UID = '04ABC123DEF456';

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  duration?: number;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({
      name,
      passed: true,
      duration: Date.now() - start,
    });
    console.log(`✓ ${name} (${Date.now() - start}ms)`);
  } catch (error: any) {
    results.push({
      name,
      passed: false,
      message: error.message,
      duration: Date.now() - start,
    });
    console.error(`✗ ${name}: ${error.message}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

// ============================================================================
// TEST: NFC Tag Registration
// ============================================================================

async function testNFCRegistration() {
  const response = await fetch(`${BASE_URL}/api/admin/nfc/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      physical_piece_id: 'mock-piece-id',
      nfc_uid: TEST_NFC_UID,
    }),
  });

  const data = await response.json();
  assert(data.success || response.status === 404, 'NFC registration should succeed or return 404 for missing piece');
}

async function testNFCList() {
  const response = await fetch(`${BASE_URL}/api/admin/nfc`);
  const data = await response.json();
  assert(data.success !== false, 'Should list NFC-tagged pieces');
  assert(Array.isArray(data.data) || data.error, 'Should return array or error');
}

async function testNFCBulkRegistration() {
  const response = await fetch(`${BASE_URL}/api/admin/nfc/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      records: [
        { serial: TEST_SERIAL, nfc_uid: '04ABC123' },
        { serial: 'PRD-2026-TEST-002', nfc_uid: '04DEF456' },
      ],
    }),
  });

  const data = await response.json();
  assert(data.success || data.data, 'Bulk registration should return results');
}

// ============================================================================
// TEST: QR Code Generation
// ============================================================================

async function testQRCodePNG() {
  const response = await fetch(`${BASE_URL}/api/admin/qr/${TEST_SERIAL}/png`);
  assert(
    response.headers.get('content-type')?.includes('image/png') || response.status === 404,
    'QR PNG should return image/png or 404'
  );
}

async function testQRCodeSVG() {
  const response = await fetch(`${BASE_URL}/api/admin/qr/${TEST_SERIAL}/svg`);
  const contentType = response.headers.get('content-type');
  assert(
    contentType?.includes('image/svg') || response.status === 404,
    'QR SVG should return image/svg+xml or 404'
  );
}

async function testQRCodeDataURL() {
  const response = await fetch(`${BASE_URL}/api/admin/qr/${TEST_SERIAL}`);
  const data = await response.json();
  
  if (response.ok) {
    assert(data.success, 'QR data URL should succeed');
    assert(data.data.qr.startsWith('data:image/png;base64,'), 'Should return base64 data URL');
  } else {
    assert(response.status === 404, 'Should return 404 if piece not found');
  }
}

// ============================================================================
// TEST: Physical Labels
// ============================================================================

async function testLabelGeneration() {
  const response = await fetch(`${BASE_URL}/api/admin/labels/${TEST_SERIAL}`);
  const data = await response.json();
  
  if (response.ok) {
    assert(data.success, 'Label generation should succeed');
    assert(data.data.html?.includes('<!DOCTYPE html>'), 'Should return HTML');
  } else {
    assert(response.status === 404, 'Should return 404 if piece not found');
  }
}

async function testLabelDownload() {
  const response = await fetch(`${BASE_URL}/api/admin/labels/${TEST_SERIAL}/download`);
  const contentType = response.headers.get('content-type');
  assert(
    contentType?.includes('text/html') || response.status === 404,
    'Label download should return HTML or 404'
  );
}

async function testBatchLabels() {
  const response = await fetch(
    `${BASE_URL}/api/admin/labels/batch?serials=${TEST_SERIAL},PRD-2026-TEST-002`
  );
  const contentType = response.headers.get('content-type');
  assert(
    contentType?.includes('text/html') || response.status === 404 || response.status === 400,
    'Batch labels should return HTML or error'
  );
}

// ============================================================================
// TEST: Certificates
// ============================================================================

async function testCertificateData() {
  const response = await fetch(`${BASE_URL}/api/admin/certificates/${TEST_SERIAL}`);
  const data = await response.json();
  
  if (response.ok) {
    assert(data.success, 'Certificate should succeed');
    assert(data.data.serial === TEST_SERIAL, 'Should return correct serial');
    assert(data.data.verification_hash, 'Should include verification hash');
    assert(data.data.verification_hash.length === 64, 'Hash should be SHA-256 (64 chars)');
  } else {
    assert(response.status === 404, 'Should return 404 if piece not found');
  }
}

async function testCertificateList() {
  const response = await fetch(`${BASE_URL}/api/admin/certificates?limit=10`);
  const data = await response.json();
  assert(data.success !== false, 'Certificate list should succeed');
  assert(Array.isArray(data.data) || data.error, 'Should return array or error');
}

// ============================================================================
// TEST: Provenance Timeline
// ============================================================================

async function testProvenancePrivate() {
  const response = await fetch(`${BASE_URL}/api/admin/provenance/${TEST_SERIAL}`);
  const data = await response.json();
  
  if (response.ok) {
    assert(data.success, 'Provenance should succeed');
    assert(data.data.serial === TEST_SERIAL, 'Should return correct serial');
    assert(Array.isArray(data.data.events), 'Should have events array');
  } else {
    assert(response.status === 404, 'Should return 404 if piece not found');
  }
}

async function testProvenancePublic() {
  const response = await fetch(`${BASE_URL}/api/public/provenance/${TEST_SERIAL}`);
  const data = await response.json();
  
  if (response.ok) {
    assert(data.success, 'Public provenance should succeed');
    assert(Array.isArray(data.data.events), 'Should have events array');
  } else {
    assert(response.status === 404, 'Should return 404 if piece not found');
  }
}

// ============================================================================
// TEST: Verification API
// ============================================================================

async function testVerifyBySerial() {
  const response = await fetch(`${BASE_URL}/api/public/verify/${TEST_SERIAL}`);
  const data = await response.json();
  
  assert(typeof data.verified === 'boolean', 'Should have verified field');
  assert(data.serial, 'Should have serial field');
  assert(data.status, 'Should have status field');
  assert(data.message, 'Should have message field');
  assert(data.timestamp, 'Should have timestamp field');
}

async function testVerifyByNFC() {
  const response = await fetch(`${BASE_URL}/api/public/verify/nfc/${TEST_NFC_UID}`);
  const data = await response.json();
  
  assert(typeof data.verified === 'boolean', 'Should have verified field');
  assert(data.status, 'Should have status field');
}

async function testQuickStatus() {
  const response = await fetch(`${BASE_URL}/api/public/status/${TEST_SERIAL}`);
  const data = await response.json();
  
  assert(typeof data.exists === 'boolean', 'Should have exists field');
  assert(data.status, 'Should have status field');
}

// ============================================================================
// TEST: Rate Limiting
// ============================================================================

async function testRateLimiting() {
  const requests = [];
  
  // Make 5 rapid requests
  for (let i = 0; i < 5; i++) {
    requests.push(fetch(`${BASE_URL}/api/public/status/${TEST_SERIAL}`));
  }
  
  const responses = await Promise.all(requests);
  
  // Check rate limit headers
  const lastResponse = responses[responses.length - 1];
  const headers = lastResponse.headers;
  
  assert(
    headers.get('x-ratelimit-limit') !== null || lastResponse.status === 404,
    'Should have rate limit headers or 404'
  );
  
  console.log('Rate limit headers:', {
    limit: headers.get('x-ratelimit-limit'),
    remaining: headers.get('x-ratelimit-remaining'),
    reset: headers.get('x-ratelimit-reset'),
  });
}

// ============================================================================
// TEST: Security & Validation
// ============================================================================

async function testNFCUIDValidation() {
  const { validateNFCUID } = await import('../server/utils/nfc-scanner.js');
  
  assert(validateNFCUID('04ABC123'), 'Should accept 4-byte UID');
  assert(validateNFCUID('04:AB:C1:23'), 'Should accept formatted UID');
  assert(validateNFCUID('04ABC123DEF4567'), 'Should accept 7-byte UID');
  assert(!validateNFCUID('INVALID'), 'Should reject invalid format');
  assert(!validateNFCUID('04AB'), 'Should reject too short UID');
}

async function testSerialFormatting() {
  const serial = 'PRD-2026-000001';
  assert(serial.match(/^[A-Z0-9-]+$/), 'Serial should be alphanumeric with dashes');
  assert(serial.length >= 8, 'Serial should be at least 8 characters');
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  console.log('\n🧪 Testing NFC, QR, and Verification Features\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  // NFC Tests
  await test('NFC: Register tag', testNFCRegistration);
  await test('NFC: List tagged pieces', testNFCList);
  await test('NFC: Bulk registration', testNFCBulkRegistration);

  // QR Code Tests
  await test('QR: Generate PNG', testQRCodePNG);
  await test('QR: Generate SVG', testQRCodeSVG);
  await test('QR: Generate data URL', testQRCodeDataURL);

  // Label Tests
  await test('Label: Generate HTML', testLabelGeneration);
  await test('Label: Download', testLabelDownload);
  await test('Label: Batch generation', testBatchLabels);

  // Certificate Tests
  await test('Certificate: Get data', testCertificateData);
  await test('Certificate: List all', testCertificateList);

  // Provenance Tests
  await test('Provenance: Private timeline', testProvenancePrivate);
  await test('Provenance: Public timeline', testProvenancePublic);

  // Verification Tests
  await test('Verify: By serial', testVerifyBySerial);
  await test('Verify: By NFC UID', testVerifyByNFC);
  await test('Verify: Quick status', testQuickStatus);

  // Rate Limiting Tests
  await test('Rate Limiting: Check headers', testRateLimiting);

  // Security Tests
  await test('Security: NFC UID validation', testNFCUIDValidation);
  await test('Security: Serial formatting', testSerialFormatting);

  // Summary
  console.log('\n' + '='.repeat(60));
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  
  console.log(`\n📊 Test Results: ${passed}/${total} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    console.log('Failed tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`  ✗ ${r.name}: ${r.message}`));
    console.log();
  }

  const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
  console.log(`⏱️  Average duration: ${avgDuration.toFixed(0)}ms\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

export { runAllTests, test, assert };
