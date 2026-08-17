import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { AuditService } from '../audit/audit.service.js';
import type { VerificationMethod } from '../authentication/authentication.service.js';

const ALL_METHODS: VerificationMethod[] = ['NFC', 'QR', 'SERIAL_LOOKUP', 'MANUAL'];

export class VerificationOptionsService {
  /**
   * List all product references with their enabled verification methods
   */
  static async listProducts(shop_id: string) {
    const products = await prisma.shopifyProductReference.findMany({
      where: { shop_id },
      include: {
        _count: { select: { physical_pieces: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 200,
    });

    return products.map((p) => ({
      id: p.id,
      title: p.title,
      shopify_product_id: p.shopify_product_id,
      shopify_variant_id: p.shopify_variant_id,
      category: p.category,
      piece_count: p._count.physical_pieces,
      verification_methods: this.parseMethods(p.verification_methods),
    }));
  }

  /**
   * Set the enabled verification methods for a product reference
   */
  static async setMethods(
    shop_id: string,
    productRefId: string,
    methods: VerificationMethod[],
    actorId: string
  ) {
    const product = await prisma.shopifyProductReference.findFirst({
      where: { id: productRefId, shop_id },
    });

    if (!product) {
      throw new NotFoundError('ShopifyProductReference', productRefId);
    }

    const sanitized = [...new Set(methods)].filter((m) => ALL_METHODS.includes(m));
    if (sanitized.length === 0) {
      sanitized.push('MANUAL'); // always keep an admin override path
    }

    const updated = await prisma.shopifyProductReference.update({
      where: { id: product.id },
      data: { verification_methods: JSON.stringify(sanitized) },
    });

    await AuditService.log({
      shop_id,
      actor_type: 'MERCHANT_ADMIN',
      actor_id: actorId,
      action: 'VERIFICATION_METHODS_UPDATED',
      resource_type: 'SHOPIFY_PRODUCT_REFERENCE',
      resource_id: product.id,
      metadata: { methods: sanitized, title: product.title },
    });

    return { id: updated.id, verification_methods: sanitized };
  }

  private static parseMethods(raw: string | null): VerificationMethod[] {
    if (!raw) return ['NFC', 'QR', 'SERIAL_LOOKUP'];
    try {
      const parsed = JSON.parse(raw) as VerificationMethod[];
      return parsed.filter((m) => ALL_METHODS.includes(m));
    } catch {
      return ['NFC', 'QR', 'SERIAL_LOOKUP'];
    }
  }
}