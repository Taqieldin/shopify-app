import { describe, it, expect } from 'vitest';
import { RiskEngine } from '../../server/domains/authentication/risk-engine.js';

describe('RiskEngine', () => {
  it('detects impossible travel anomalies between distant geographic locations', () => {
    const recentScans = [
      {
        created_at: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        country: 'France',
        city: 'Paris',
        ip_hash: 'ip_fr_1',
        nfc_read_counter: 10,
      },
    ];

    const currentScan = {
      timestamp: new Date(),
      country: 'Japan',
      city: 'Tokyo',
      ip_hash: 'ip_jp_1',
      nfc_read_counter: 11,
    };

    const analysis = RiskEngine.evaluate(recentScans, currentScan, false);
    expect(analysis.risk_level).toBe('REVIEW');
    expect(analysis.anomalies.some((a) => a.type === 'IMPOSSIBLE_TRAVEL')).toBe(true);
  });

  it('detects NFC cryptographic counter rollback clone attempts', () => {
    const recentScans = [
      {
        created_at: new Date(Date.now() - 60 * 60 * 1000),
        country: 'France',
        city: 'Paris',
        nfc_read_counter: 45,
      },
    ];

    const currentScan = {
      timestamp: new Date(),
      country: 'France',
      city: 'Paris',
      nfc_read_counter: 40, // Counter smaller than previously verified
    };

    const analysis = RiskEngine.evaluate(recentScans, currentScan, false);
    expect(analysis.risk_level).toBe('HIGH_RISK');
    expect(analysis.anomalies.some((a) => a.type === 'COUNTER_MISMATCH')).toBe(true);
  });

  it('flags critical risk when piece is reported stolen', () => {
    const analysis = RiskEngine.evaluate([], { timestamp: new Date() }, true);
    expect(analysis.risk_level).toBe('HIGH_RISK');
    expect(analysis.anomalies.some((a) => a.type === 'BLACKLIST_HIT')).toBe(true);
  });
});
