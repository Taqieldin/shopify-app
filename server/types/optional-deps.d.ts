declare module 'puppeteer' {
  export interface PDFOptions {
    format?: string;
    landscape?: boolean;
    printBackground?: boolean;
    displayHeaderFooter?: boolean;
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
  }

  export interface Page {
    setContent(html: string, options?: Record<string, unknown>): Promise<void>;
    pdf(options?: PDFOptions): Promise<Buffer>;
  }

  export interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
  }

  export interface LaunchOptions {
    headless?: boolean | 'new';
    args?: string[];
  }

  export function launch(options?: LaunchOptions): Promise<Browser>;
}

declare module 'pdfkit' {
  export interface PDFDocumentOptions {
    size?: string;
    margin?: number;
  }

  export default class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    fontSize(size: number): this;
    font(name: string): this;
    text(text: string, options?: Record<string, unknown>): this;
    moveDown(space?: number): this;
    rect(x: number, y: number, width: number, height: number): this;
    stroke(color?: string): this;
    on(event: string, listener: (...args: any[]) => void): this;
    end(): void;
    page: { width: number; height: number };
  }
}
