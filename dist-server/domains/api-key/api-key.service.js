import crypto from 'crypto';
import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError, UnauthorizedError } from '../../shared/errors/index.js';
import { AuditService } from '../audit/audit.service.js';
export class APIKeyService {
    /**
     * Generate a new API key
     */
    static async createAPIKey(shopId, dto, actorId) {
        // Generate secure random key
        const key = `sk_${this.generateRandomString(32)}`;
        const hashedKey = this.hashKey(key);
        const keyPrefix = key.substring(0, 10);
        const apiKey = await prisma.aPIKey.create({
            data: {
                shop_id: shopId,
                name: dto.name,
                description: dto.description,
                key_prefix: keyPrefix,
                hashed_key: hashedKey,
                tier: dto.tier || 'free',
                scopes_json: JSON.stringify(dto.scopes || ['verify:read']),
                rate_limit: dto.rateLimit || 100,
                expires_at: dto.expiresAt,
                is_active: true,
            },
        });
        await AuditService.log({
            shop_id: shopId,
            actor_type: 'MERCHANT_ADMIN',
            actor_id: actorId,
            action: 'API_KEY_CREATED',
            resource_type: 'API_KEY',
            resource_id: apiKey.id,
            metadata: { name: dto.name, tier: dto.tier },
        });
        return {
            key, // Only returned once!
            keyData: this.formatKeyData(apiKey),
        };
    }
    /**
     * Verify an API key and return associated data
     */
    static async verifyAPIKey(key) {
        const hashedKey = this.hashKey(key);
        const apiKey = await prisma.aPIKey.findFirst({
            where: {
                hashed_key: hashedKey,
                is_active: true,
            },
        });
        if (!apiKey) {
            return null;
        }
        // Check expiration
        if (apiKey.expires_at && apiKey.expires_at < new Date()) {
            return null;
        }
        // Update last used timestamp and increment request count
        await prisma.aPIKey.update({
            where: { id: apiKey.id },
            data: {
                last_used_at: new Date(),
                requests_count: { increment: 1 },
            },
        });
        return this.formatKeyData(apiKey);
    }
    /**
     * List all API keys for a shop (without revealing actual keys)
     */
    static async listAPIKeys(shopId) {
        const keys = await prisma.aPIKey.findMany({
            where: { shop_id: shopId },
            orderBy: { created_at: 'desc' },
        });
        return keys.map((k) => this.formatKeyData(k));
    }
    /**
     * Revoke an API key
     */
    static async revokeAPIKey(shopId, keyId, actorId) {
        const apiKey = await prisma.aPIKey.findFirst({
            where: { id: keyId, shop_id: shopId },
        });
        if (!apiKey) {
            throw new NotFoundError('APIKey', keyId);
        }
        await prisma.aPIKey.update({
            where: { id: keyId },
            data: { is_active: false },
        });
        await AuditService.log({
            shop_id: shopId,
            actor_type: 'MERCHANT_ADMIN',
            actor_id: actorId,
            action: 'API_KEY_REVOKED',
            resource_type: 'API_KEY',
            resource_id: keyId,
            metadata: { name: apiKey.name },
        });
    }
    /**
     * Update API key settings
     */
    static async updateAPIKey(shopId, keyId, updates, actorId) {
        const apiKey = await prisma.aPIKey.findFirst({
            where: { id: keyId, shop_id: shopId },
        });
        if (!apiKey) {
            throw new NotFoundError('APIKey', keyId);
        }
        const updated = await prisma.aPIKey.update({
            where: { id: keyId },
            data: {
                name: updates.name,
                tier: updates.tier,
                rate_limit: updates.rateLimit,
                scopes_json: updates.scopes ? JSON.stringify(updates.scopes) : undefined,
            },
        });
        await AuditService.log({
            shop_id: shopId,
            actor_type: 'MERCHANT_ADMIN',
            actor_id: actorId,
            action: 'API_KEY_UPDATED',
            resource_type: 'API_KEY',
            resource_id: keyId,
            metadata: { changes: updates },
        });
        return this.formatKeyData(updated);
    }
    /**
     * Get API key usage stats
     */
    static async getKeyStats(shopId, keyId) {
        const apiKey = await prisma.aPIKey.findFirst({
            where: { id: keyId, shop_id: shopId },
        });
        if (!apiKey) {
            throw new NotFoundError('APIKey', keyId);
        }
        // Get request count from last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return {
            total_requests: apiKey.requests_count,
            last_used_at: apiKey.last_used_at,
            rate_limit: apiKey.rate_limit,
            tier: apiKey.tier,
            is_active: apiKey.is_active,
            expires_at: apiKey.expires_at,
        };
    }
    /**
     * Check if key has permission for a scope
     */
    static hasScope(keyData, requiredScope) {
        // Wildcard scope
        if (keyData.scopes.includes('*')) {
            return true;
        }
        // Exact match
        if (keyData.scopes.includes(requiredScope)) {
            return true;
        }
        // Prefix match (e.g., 'verify:*' matches 'verify:read')
        const scopePrefix = requiredScope.split(':')[0];
        if (keyData.scopes.includes(`${scopePrefix}:*`)) {
            return true;
        }
        return false;
    }
    /**
     * Hash an API key using SHA-256
     */
    static hashKey(key) {
        return crypto.createHash('sha256').update(key).digest('hex');
    }
    /**
     * Generate secure random string
     */
    static generateRandomString(length) {
        return crypto
            .randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .slice(0, length);
    }
    /**
     * Format API key for response (hide sensitive data)
     */
    static formatKeyData(apiKey) {
        return {
            id: apiKey.id,
            shop_id: apiKey.shop_id,
            name: apiKey.name,
            key_prefix: apiKey.key_prefix,
            hashed_key: apiKey.hashed_key,
            tier: apiKey.tier,
            scopes: JSON.parse(apiKey.scopes_json || '[]'),
            rate_limit: apiKey.rate_limit,
            requests_count: apiKey.requests_count,
            last_used_at: apiKey.last_used_at,
            expires_at: apiKey.expires_at,
            is_active: apiKey.is_active,
            created_at: apiKey.created_at,
        };
    }
}
/**
 * Middleware to authenticate API key
 */
export async function authenticateAPIKey(key) {
    const keyData = await APIKeyService.verifyAPIKey(key);
    if (!keyData) {
        throw new UnauthorizedError('Invalid or expired API key');
    }
    return keyData;
}
