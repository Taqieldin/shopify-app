import { CertificateGenerator, CertificateMetadata } from './certificate-generator.js';
import { PDFCertificateService, CertificateData } from './pdf-certificate.service.js';

/**
 * PDF Generator Service
 * Converts HTML certificates to PDF using puppeteer
 * 
 * Installation required: npm install puppeteer
 */

export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  printBackground?: boolean;
  displayHeaderFooter?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export class PDFGeneratorService {
  /**
   * Generate PDF certificate from HTML
   */
  static async generatePDFCertificate(
    certData: CertificateData,
    options?: PDFGenerationOptions
  ): Promise<Buffer> {
    // Dynamic import to avoid loading puppeteer if not installed
    const puppeteer = await this.loadPuppeteer();
    
    if (!puppeteer) {
      throw new Error('Puppeteer not installed. Run: npm install puppeteer');
    }

    const metadata: CertificateMetadata = {
      brand_name: certData.brand_name,
      certificate_number: certData.certificate_number || '',
      serial: certData.serial,
      product_title: certData.product_title,
      edition: certData.edition,
      owner_name_or_email: certData.owner_name || certData.owner_email || 'Collector',
      issue_date: certData.issue_date,
      manufacturing_location: certData.manufacturing_location,
    };
    const html = CertificateGenerator.generatePrintableHTML(metadata);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: options?.format || 'A4',
        landscape: options?.orientation === 'landscape',
        printBackground: options?.printBackground !== false,
        displayHeaderFooter: options?.displayHeaderFooter || false,
        margin: options?.margin || {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate PDF from serial number
   */
  static async generatePDFFromSerial(
    shopId: string,
    serial: string,
    options?: PDFGenerationOptions
  ): Promise<Buffer> {
    const certData = await PDFCertificateService.getCertificateData(shopId, serial);
    return this.generatePDFCertificate(certData, options);
  }

  /**
   * Generate batch PDFs (returns Map of serial -> PDF buffer)
   */
  static async generateBatchPDFs(
    shopId: string,
    serials: string[],
    options?: PDFGenerationOptions
  ): Promise<Map<string, Buffer>> {
    const results = new Map<string, Buffer>();

    for (const serial of serials) {
      try {
        const pdf = await this.generatePDFFromSerial(shopId, serial, options);
        results.set(serial, pdf);
      } catch (error) {
        console.error(`Failed to generate PDF for ${serial}:`, error);
      }
    }

    return results;
  }

  /**
   * Lazy load puppeteer (optional dependency)
   */
  private static async loadPuppeteer(): Promise<any> {
    try {
      return await import('puppeteer');
    } catch {
      return null;
    }
  }

  /**
   * Alternative: Generate PDF using pdfkit (lighter weight)
   */
  static async generatePDFWithPDFKit(certData: CertificateData): Promise<Buffer> {
    const PDFDocument = await this.loadPDFKit();
    
    if (!PDFDocument) {
      throw new Error('pdfkit not installed. Run: npm install pdfkit');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(certData.brand_name, { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(12)
        .font('Helvetica')
        .text('Official Certificate of Authenticity & Provenance', { align: 'center' })
        .moveDown(2);

      // Border
      doc
        .rect(40, 40, doc.page.width - 80, doc.page.height - 80)
        .stroke('#d97706');

      // Serial number (prominent)
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('Serial Number:', { continued: true })
        .font('Courier-Bold')
        .text(` ${certData.serial}`)
        .moveDown(1);

      // Product details
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(certData.product_title)
        .moveDown(0.5);

      if (certData.edition) {
        doc
          .fontSize(11)
          .font('Helvetica')
          .text(certData.edition)
          .moveDown(0.5);
      }

      if (certData.manufacturing_location) {
        doc
          .text(`Handcrafted in ${certData.manufacturing_location}`)
          .moveDown(1);
      }

      // Materials
      if (certData.materials && certData.materials.length > 0) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Materials:')
          .font('Helvetica');
        
        certData.materials.forEach((material) => {
          doc.text(`• ${material}`, { indent: 20 });
        });
        doc.moveDown(1);
      }

      // Owner information
      if (certData.owner_name) {
        doc
          .fontSize(11)
          .font('Helvetica')
          .text(`Registered to: ${certData.owner_name}`)
          .moveDown(0.5);
      }

      // Certificate details
      doc
        .text(`Certificate Number: ${certData.certificate_number}`)
        .text(`Issue Date: ${certData.issue_date}`)
        .moveDown(2);

      // Verification hash
      const hash = PDFCertificateService.generateVerificationHash(certData);
      doc
        .fontSize(8)
        .font('Courier')
        .text('Cryptographic SHA-256 Verification Stamp:', { continued: false })
        .text(hash, { width: doc.page.width - 100, align: 'center' });

      doc.end();
    });
  }

  /**
   * Lazy load pdfkit (optional dependency)
   */
  private static async loadPDFKit(): Promise<any> {
    try {
      const module = await import('pdfkit');
      return module.default || module;
    } catch {
      return null;
    }
  }
}
