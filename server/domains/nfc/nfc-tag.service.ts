import { prisma } from '../../infrastructure/database/client.js';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';
import { AuditService } from '../audit/audit.service.js';
import crypto from 'node:crypto';

export interface RegisterNFCDTO {
  physical_piece_id: string;
  nfc_uid: string;
  notes?: string;
}

export interface UpdateNFCDTO {
  nfc_uid?: string;
  notes?: string;
}

export interface OwnerWriteMetadata {
  serial: string;
  new_owner_customer_id: string;
  new_owner_shopify_customer_id: string;
  new_owner_name?: string;
  previous_owner_shopify_customer_id?: string;
  transfer_count: number;
  written_at: string;
}

/**
 * NFC Tag Management Service
 * Handles registration and management of NFC tags linked to physical pieces
 */
export class NFCTagService {
  /**
   * Register an NFC tag to a physical piece
   */
  static async registerTag(shopId: string, dto: RegisterNFCDTO, actorId: string) {
    // 1. Verify physical piece exists
    const piece = await prisma.physicalPiece.findFirst({
      where: { id: dto.physical_piece_id, shop_id: shopId },
    });

    if (!piece) {
      throw new NotFoundError('PhysicalPiece', dto.physical_piece_id);
    }

    // 2. Check NFC UID uniqueness within this tenant
    const existingNFC = await prisma.physicalPiece.findFirst({
      where: {
        shop_id: shopId,
        nfc_uid: dto.nfc_uid,
        id: { not: dto.physical_piece_id },
      },
    });

    if (existingNFC) {
      throw new ConflictError(
        `NFC tag UID '${dto.nfc_uid}' is already assigned to another piece (${existingNFC.serial}).`
      );
    }

    // 3. Update the physical piece with NFC details
    const updated = await prisma.physicalPiece.update({
      where: { id: dto.physical_piece_id },
      data: {
        nfc_uid: dto.nfc_uid,
        qr_code_payload: `PASSPORT:${shopId}:${piece.serial}`,
      },
    });

    // 4. Ensure feature flag is enabled
    await prisma.shopFeatureFlag.upsert({
      where: { shop_id: shopId },
      update: { nfc_enabled: true },
      create: { shop_id: shopId, nfc_enabled: true },
    });

    await AuditService.log({
      shop_id: shopId,
      actor_type: 'MERCHANT_ADMIN',
      actor_id: actorId,
      action: 'NFC_TAG_REGISTERED',
      resource_type: 'PHYSICAL_PIECE',
      resource_id: piece.id,
      metadata: {
        nfc_uid: dto.nfc_uid,
        serial: piece.serial,
      },
    });

    return updated;
  }

  /**
   * Update NFC tag details
   */
  static async updateTag(shopId: string, pieceId: string, dto: UpdateNFCDTO, actorId: string) {
    const piece = await prisma.physicalPiece.findFirst({
      where: { id: pieceId, shop_id: shopId },
    });

    if (!piece) {
      throw new NotFoundError('PhysicalPiece', pieceId);
    }

    // Check NFC UID uniqueness if changing
    if (dto.nfc_uid && dto.nfc_uid !== piece.nfc_uid) {
      const existingNFC = await prisma.physicalPiece.findFirst({
        where: {
          shop_id: shopId,
          nfc_uid: dto.nfc_uid,
          id: { not: pieceId },
        },
      });

      if (existingNFC) {
        throw new ConflictError(
          `NFC tag UID '${dto.nfc_uid}' is already assigned to another piece.`
        );
      }
    }

    const updated = await prisma.physicalPiece.update({
      where: { id: pieceId },
      data: {
        nfc_uid: dto.nfc_uid,
      },
    });

    await AuditService.log({
      shop_id: shopId,
      actor_type: 'MERCHANT_ADMIN',
      actor_id: actorId,
      action: 'NFC_TAG_UPDATED',
      resource_type: 'PHYSICAL_PIECE',
      resource_id: pieceId,
      metadata: { changes: dto },
    });

    return updated;
  }

  /**
   * Remove NFC tag from a physical piece
   */
  static async unregisterTag(shopId: string, pieceId: string, actorId: string) {
    const piece = await prisma.physicalPiece.findFirst({
      where: { id: pieceId, shop_id: shopId },
    });

    if (!piece) {
      throw new NotFoundError('PhysicalPiece', pieceId);
    }

    const updated = await prisma.physicalPiece.update({
      where: { id: pieceId },
      data: {
        nfc_uid: null,
      },
    });

    await AuditService.log({
      shop_id: shopId,
      actor_type: 'MERCHANT_ADMIN',
      actor_id: actorId,
      action: 'NFC_TAG_UNREGISTERED',
      resource_type: 'PHYSICAL_PIECE',
      resource_id: pieceId,
      metadata: { previous_nfc_uid: piece.nfc_uid },
    });

    return updated;
  }

  /**
   * Look up a physical piece by NFC UID
   */
  static async lookupByUID(shopId: string, nfcUid: string) {
    const piece = await prisma.physicalPiece.findFirst({
      where: {
        shop_id: shopId,
        nfc_uid: nfcUid,
      },
      include: {
        product_ref: true,
        passport: true,
        ownerships: {
          where: { is_active: true },
          include: { customer: true },
        },
      },
    });

    return piece;
  }

  /**
   * List all pieces with NFC tags
   */
  static async listTagged(shopId: string) {
    return prisma.physicalPiece.findMany({
      where: {
        shop_id: shopId,
        nfc_uid: { not: null },
      },
      include: {
        product_ref: true,
        passport: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Write current owner metadata into the NFC tag payload after an ownership change.
   * The payload is AES-256-GCM encrypted so it can be flashed onto the tag and
   * verified even offline. Key source: the piece's stored NFC encryption key when
   * available, otherwise a deterministic tenant-derived placeholder key (until
   * centralized NTAG424 key management lands).
   */
  static async writeOwnerMetadata(
    shopId: string,
    pieceId: string,
    metadata: OwnerWriteMetadata
  ) {
    const piece = await prisma.physicalPiece.findFirst({
      where: { id: pieceId, shop_id: shopId },
      include: {
        ownerships: { where: { is_active: true }, include: { customer: true } },
      },
    });

    if (!piece) {
      throw new NotFoundError('PhysicalPiece', pieceId);
    }

    if (!piece.nfc_uid) {
      return null; // No tag attached — nothing to write back
    }

    const previousOwner = piece.ownerships[0]?.customer;
    const keyMaterial = piece.nfc_encryption_key || crypto.createHash('sha256').update(`shop:${shopId}`).digest('hex');
    const key = crypto.createHash('sha256').update(`${keyMaterial}:nfc-owner-write`).digest();
    const iv = crypto.randomBytes(12);

    const payload: OwnerWriteMetadata = {
      serial: piece.serial,
      new_owner_customer_id: metadata.new_owner_customer_id,
      new_owner_shopify_customer_id: metadata.new_owner_shopify_customer_id,
      new_owner_name: metadata.new_owner_name,
      previous_owner_shopify_customer_id:
        metadata.previous_owner_shopify_customer_id ||
        previousOwner?.shopify_customer_id,
      transfer_count: metadata.transfer_count,
      written_at: metadata.written_at,
    };

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(payload), 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const encryptedPayload = Buffer.concat([iv, authTag, encrypted]).toString('hex');

    const log = await prisma.nFCWriteLog.create({
      data: {
        shop_id: shopId,
        physical_piece_id: piece.id,
        previous_owner_customer_id: previousOwner?.id,
        new_owner_customer_id: metadata.new_owner_customer_id,
        transfer_count: metadata.transfer_count,
        encrypted_payload: encryptedPayload,
        algorithm: 'AES-256-GCM',
      },
    });

    await AuditService.log({
      shop_id: shopId,
      actor_type: 'SYSTEM',
      actor_id: 'system',
      action: 'NFC_OWNER_WRITTEN',
      resource_type: 'PHYSICAL_PIECE',
      resource_id: piece.id,
      metadata: {
        nfc_uid: piece.nfc_uid,
        serial: piece.serial,
        transfer_count: metadata.transfer_count,
        log_id: log.id,
      },
    });

    return log;
  }

  /**
   * List NFC owner write-back logs for admin inspection
   */
  static async listWriteLogs(shopId: string, pieceId?: string) {
    return prisma.nFCWriteLog.findMany({
      where: {
        shop_id: shopId,
        physical_piece_id: pieceId,
      },
      include: {
        physical_piece: {
          include: { product_ref: true },
        },
        new_owner: { select: { shopify_customer_id: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }

  /**
   * Bulk register NFC tags from CSV-like input
   */
  static async bulkRegister(
    shopId: string,
    records: Array<{ serial: string; nfc_uid: string }>,
    actorId: string
  ) {
    const results = {
      success: [] as string[],
      failed: [] as Array<{ serial: string; error: string }>,
    };

    for (const record of records) {
      try {
        const piece = await prisma.physicalPiece.findUnique({
          where: { shop_id_serial: { shop_id: shopId, serial: record.serial } },
        });

        if (!piece) {
          results.failed.push({ serial: record.serial, error: 'Serial not found' });
          continue;
        }

        // Check NFC uniqueness
        const existing = await prisma.physicalPiece.findFirst({
          where: {
            shop_id: shopId,
            nfc_uid: record.nfc_uid,
            id: { not: piece.id },
          },
        });

        if (existing) {
          results.failed.push({
            serial: record.serial,
            error: `NFC UID already assigned to ${existing.serial}`,
          });
          continue;
        }

        await prisma.physicalPiece.update({
          where: { id: piece.id },
          data: {
            nfc_uid: record.nfc_uid,
          },
        });

        results.success.push(record.serial);
      } catch (error) {
        results.failed.push({
          serial: record.serial,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (results.success.length > 0) {
      await AuditService.log({
        shop_id: shopId,
        actor_type: 'MERCHANT_ADMIN',
        actor_id: actorId,
        action: 'NFC_TAGS_BULK_REGISTERED',
        resource_type: 'PHYSICAL_PIECE',
        resource_id: 'bulk',
        metadata: { count: results.success.length },
      });
    }

    return results;
  }
}