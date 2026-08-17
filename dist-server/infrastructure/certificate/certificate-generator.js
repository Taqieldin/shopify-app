import crypto from 'crypto';
export class CertificateGenerator {
    /**
     * Generate SHA-256 digital verification hash for an authentic piece
     */
    static generateVerificationHash(metadata, salt = 'atelier_provenance_2026') {
        const rawString = `${metadata.brand_name}:${metadata.serial}:${metadata.certificate_number}:${metadata.owner_name_or_email}:${salt}`;
        return crypto.createHash('sha256').update(rawString).digest('hex');
    }
    /**
     * Generate formatted HTML printable certificate for client downloads
     */
    static generatePrintableHTML(metadata) {
        const hash = this.generateVerificationHash(metadata);
        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate of Authenticity — ${metadata.serial}</title>
  <style>
    body {
      font-family: 'Cinzel', 'Georgia', serif;
      background: #09090b;
      color: #f4f4f5;
      padding: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }
    .cert-frame {
      border: 2px solid #d97706;
      padding: 48px;
      max-width: 650px;
      width: 100%;
      background: #18181b;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      text-align: center;
      position: relative;
    }
    .cert-frame::before {
      content: "";
      position: absolute;
      inset: 8px;
      border: 1px dashed rgba(217, 119, 6, 0.3);
      pointer-events: none;
    }
    h1 {
      font-size: 24px;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #fbbf24;
      margin: 0 0 8px 0;
    }
    .sub {
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #a1a1aa;
      margin-bottom: 32px;
    }
    .serial {
      font-family: monospace;
      font-size: 16px;
      color: #fbbf24;
      font-weight: bold;
      background: rgba(217, 119, 6, 0.1);
      display: inline-block;
      padding: 6px 16px;
      border-radius: 4px;
      border: 1px solid rgba(217, 119, 6, 0.2);
      margin: 16px 0;
    }
    .hash {
      font-family: monospace;
      font-size: 9px;
      color: #71717a;
      word-break: break-all;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="cert-frame">
    <h1>${metadata.brand_name}</h1>
    <div class="sub">Official Certificate of Authenticity & Provenance</div>
    <p style="font-size: 14px; color: #e4e4e7; line-height: 1.6;">
      This document certifies that the individual piece bearing serial number:
    </p>
    <div class="serial">${metadata.serial}</div>
    <p style="font-size: 13px; color: #d4d4d8;">
      <strong>${metadata.product_title}</strong> ${metadata.edition ? `(${metadata.edition})` : ''}<br>
      Handcrafted in ${metadata.manufacturing_location || 'Master Atelier'}
    </p>
    <p style="font-size: 11px; color: #a1a1aa; margin-top: 24px;">
      Registered to Verified Collector: <strong>${metadata.owner_name_or_email}</strong><br>
      Certificate Number: <strong>${metadata.certificate_number}</strong> • Issued: ${metadata.issue_date}
    </p>
    <div class="hash">Cryptographic SHA-256 Verification Stamp:<br>${hash}</div>
  </div>
</body>
</html>
    `.trim();
    }
}
