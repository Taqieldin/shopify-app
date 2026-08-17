import { PhysicalPieceService } from '../../domains/physical-piece/physical-piece.service.js';
import { PassportService } from '../../domains/passport/passport.service.js';
export class CSVEngine {
    /**
     * Process uploaded CSV rows in safe transactional batches
     */
    static async importBatch(shop_id, rows, actor_id) {
        const results = {
            imported: 0,
            errors: [],
        };
        for (const row of rows) {
            try {
                if (!row.serial || !row.product_title) {
                    throw new Error('Missing serial or product title');
                }
                const piece = await PhysicalPieceService.createPiece(shop_id, {
                    shopify_product_id: `gid://shopify/Product/batch-${Date.now()}`,
                    product_title: row.product_title,
                    product_handle: row.product_title.toLowerCase().replace(/\s+/g, '-'),
                    serial: row.serial.trim(),
                    edition_number: row.edition_number ? Number(row.edition_number) : undefined,
                    edition_total: row.edition_total ? Number(row.edition_total) : undefined,
                    manufacturing_location: row.manufacturing_location,
                    materials: row.materials ? [{ name: row.materials }] : undefined,
                }, actor_id);
                await PassportService.upsertPassport(shop_id, {
                    physical_piece_id: piece.id,
                    title: `Digital Passport — ${row.product_title}`,
                    description: `Certified serial ${row.serial}.`,
                    materials_summary: row.materials,
                }, actor_id);
                results.imported++;
            }
            catch (err) {
                results.errors.push({
                    serial: row.serial || 'UNKNOWN',
                    error: err.message,
                });
            }
        }
        return results;
    }
}
