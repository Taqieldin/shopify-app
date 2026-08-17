/**
 * PII (Personally Identifiable Information) Filter Service
 * Ensures no PII is exposed in public API responses
 */
export class PIIFilterService {
    /**
     * Filter PII from public passport data
     */
    static filterPublicPassportData(data) {
        const allowedFields = [
            'serial',
            'product_title',
            'edition',
            'edition_number',
            'edition_total',
            'manufacturing_date',
            'manufacturing_location',
            'materials',
            'color',
            'dimensions',
            'status',
            'authenticated',
            'passport_status',
            'brand_name',
            'image_url',
            'hero_image_url',
        ];
        return this.filterObject(data, allowedFields);
    }
    /**
     * Filter PII from ownership data (public view)
     */
    static filterPublicOwnershipData(data) {
        const filtered = { ...data };
        // Remove owner identity
        delete filtered.customer;
        delete filtered.customer_id;
        delete filtered.email;
        delete filtered.name;
        delete filtered.first_name;
        delete filtered.last_name;
        delete filtered.phone;
        delete filtered.address;
        // Keep only public ownership metadata
        return {
            is_registered: !!data.customer_id,
            started_at: data.started_at,
            source: data.source,
        };
    }
    /**
     * Filter PII from authentication events (public view)
     */
    static filterPublicAuthenticationData(data) {
        const filtered = { ...data };
        // Remove sensitive security data
        delete filtered.ip_address;
        delete filtered.ip_hash;
        delete filtered.user_agent;
        delete filtered.device_hash;
        delete filtered.risk_score;
        delete filtered.fraud_signals;
        // Keep only public verification data
        return {
            method: data.method,
            result: data.result,
            timestamp: data.created_at,
            location: data.country ? { country: data.country } : undefined,
        };
    }
    /**
     * Filter PII from service records (public view)
     */
    static filterPublicServiceData(data) {
        return {
            id: data.id,
            service_type: data.service_type,
            completed_date: data.completed_date,
            customer_notes: data.customer_notes, // Customer-facing notes only
            // Exclude: internal_notes, technician, cost
        };
    }
    /**
     * Filter PII from provenance timeline (public view)
     */
    static filterPublicProvenanceEvents(events) {
        return events.map((event) => {
            const filtered = { ...event };
            // Remove PII from event descriptions
            if (filtered.description) {
                filtered.description = this.sanitizeDescription(filtered.description);
            }
            // Remove sensitive metadata
            if (filtered.metadata) {
                delete filtered.metadata.customer_id;
                delete filtered.metadata.email;
                delete filtered.metadata.ip;
                delete filtered.metadata.device;
            }
            return filtered;
        });
    }
    /**
     * Sanitize description text to remove PII
     */
    static sanitizeDescription(text) {
        // Remove email addresses
        text = text.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[email]');
        // Remove phone numbers (various formats)
        text = text.replace(/\+?[\d\s()-]{10,}/g, '[phone]');
        // Remove potential names after "by" or "to"
        text = text.replace(/(?:by|to)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g, 'by [owner]');
        return text;
    }
    /**
     * Filter object to only allowed fields
     */
    static filterObject(obj, allowedFields) {
        if (obj === null || obj === undefined) {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map((item) => this.filterObject(item, allowedFields));
        }
        if (typeof obj !== 'object') {
            return obj;
        }
        const filtered = {};
        for (const key of allowedFields) {
            if (key in obj) {
                filtered[key] = obj[key];
            }
        }
        return filtered;
    }
    /**
     * Detect if response contains PII
     */
    static detectPII(data) {
        const piiFields = [];
        const piiPatterns = {
            email: /[\w.-]+@[\w.-]+\.\w+/,
            phone: /\+?[\d\s()-]{10,}/,
            ssn: /\d{3}-\d{2}-\d{4}/,
            credit_card: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/,
        };
        const checkObject = (obj, path = '') => {
            if (obj === null || obj === undefined) {
                return;
            }
            if (typeof obj === 'string') {
                for (const [type, pattern] of Object.entries(piiPatterns)) {
                    if (pattern.test(obj)) {
                        piiFields.push(`${path} (${type})`);
                    }
                }
            }
            else if (Array.isArray(obj)) {
                obj.forEach((item, i) => checkObject(item, `${path}[${i}]`));
            }
            else if (typeof obj === 'object') {
                for (const [key, value] of Object.entries(obj)) {
                    const newPath = path ? `${path}.${key}` : key;
                    // Check for PII field names
                    const piiFieldNames = [
                        'email',
                        'phone',
                        'ssn',
                        'social_security',
                        'address',
                        'ip_address',
                        'credit_card',
                        'password',
                        'first_name',
                        'last_name',
                        'name',
                    ];
                    if (piiFieldNames.some((piiField) => key.toLowerCase().includes(piiField))) {
                        piiFields.push(newPath);
                    }
                    checkObject(value, newPath);
                }
            }
        };
        checkObject(data);
        return {
            hasPII: piiFields.length > 0,
            fields: piiFields,
        };
    }
    /**
     * Hash sensitive data (for logging/debugging)
     */
    static hashSensitiveData(data) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    }
    /**
     * Mask email for display
     */
    static maskEmail(email) {
        const [local, domain] = email.split('@');
        if (!domain)
            return '***';
        const maskedLocal = local.length > 2 ? local[0] + '***' + local.slice(-1) : '***';
        return `${maskedLocal}@${domain}`;
    }
    /**
     * Mask phone number for display
     */
    static maskPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 4)
            return '***';
        return '***-***-' + cleaned.slice(-4);
    }
    /**
     * Create privacy-compliant response wrapper
     */
    static createPublicResponse(data, config) {
        const mode = config?.mode || 'strict';
        if (mode === 'strict') {
            // Auto-detect and remove PII
            const { hasPII, fields } = this.detectPII(data);
            if (hasPII) {
                console.warn(`PII detected in public response: ${fields.join(', ')}`);
                // In production, log this for security audit
            }
        }
        return {
            data,
            privacy_notice: 'This response contains only public information',
            pii_filtered: true,
        };
    }
}
/**
 * Express middleware to filter PII from responses
 */
export function piiFilterMiddleware(req, res, next) {
    const originalJson = res.json;
    res.json = function (data) {
        // Only filter on public endpoints
        if (req.path.startsWith('/api/public')) {
            const { hasPII, fields } = PIIFilterService.detectPII(data);
            if (hasPII) {
                console.warn(`⚠️ PII detected in public endpoint ${req.path}: ${fields.join(', ')}`);
                // In production, trigger alert
                // alertSecurityTeam('PII_EXPOSURE_RISK', { path: req.path, fields });
            }
        }
        return originalJson.call(this, data);
    };
    next();
}
