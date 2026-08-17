import { describe, it, expect } from 'vitest';
import { CertificateGenerator } from '../../server/infrastructure/certificate/certificate-generator.js';

describe('Luxury Gift & Certificate Engines', () => {
  it('generates deterministic SHA-256 cryptographic verification hashes', () => {
    const metadata = {
      brand_name: 'Maison Aurelia Paris',
      certificate_number: 'CERT-2026-AUR-001',
      serial: 'AUR-2026-000184',
      product_title: 'The Étoile Flap Top-Handle Bag',
      owner_name_or_email: 'claire.delacroix@example.com',
      issue_date: '2026-08-16',
    };

    const hash1 = CertificateGenerator.generateVerificationHash(metadata);
    const hash2 = CertificateGenerator.generateVerificationHash(metadata);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 length
  });

  it('generates complete HTML printable certificate containing brand and serial', () => {
    const metadata = {
      brand_name: 'Maison Aurelia Paris',
      certificate_number: 'CERT-2026-AUR-001',
      serial: 'AUR-2026-000184',
      product_title: 'The Étoile Flap Top-Handle Bag',
      owner_name_or_email: 'claire.delacroix@example.com',
      issue_date: '2026-08-16',
    };

    const html = CertificateGenerator.generatePrintableHTML(metadata);

    expect(html).toContain('Maison Aurelia Paris');
    expect(html).toContain('AUR-2026-000184');
    expect(html).toContain('Certificate of Authenticity');
  });
});
