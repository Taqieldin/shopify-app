# Database & Tenant Data Model

## 1. Database Engines & Portability
- **Local Development / Automated Testing**: SQLite (`prisma/dev.db`) for instant zero-dependency execution.
- **Production Deployment**: PostgreSQL on managed cloud instances (Neon, Supabase, AWS RDS Aurora Serverless) with zero application code changes required.

---

## 2. Complete Entity-Relationship Summary

| Entity | Scoped by `shop_id` | Primary Key & Indexes | Purpose |
| :--- | :--- | :--- | :--- |
| `Shop` | Yes (Primary Entity) | `id` (UUID), `shopify_shop_id` (Unique), `shop_domain` (Unique) | Multi-tenant shop record, plan, active status |
| `ShopSettings` | Yes | `id`, `shop_id` (Unique) | Custom brand colors, gold accents, logo URL, terminology |
| `ShopFeatureFlag` | Yes | `id`, `shop_id` (Unique) | Per-tenant modular capability toggles |
| `ShopifyProductReference` | Yes | `id`, `[shop_id, shopify_product_id, shopify_variant_id]` (Unique) | Pointer to Shopify Product/Variant template |
| `PhysicalPiece` | Yes | `id`, `[shop_id, serial]` (Unique), `nfc_uid`, `status` | Individual manufactured object, serial, NFC UID |
| `Passport` | Yes | `id`, `physical_piece_id` (Unique), `shop_id` | Digital product passport story, craft, materials |
| `PassportPublicFieldConfig` | Yes | `id`, `shop_id` (Unique) | Granular public visibility shielding controls |
| `Customer` | Yes | `id`, `[shop_id, shopify_customer_id]` (Unique) | Collector profile mapped from Shopify Customer ID |
| `Ownership` | Yes | `id`, `[shop_id, physical_piece_id, is_active]` | Historical & active ownership records |
| `OwnershipTransfer` | Yes | `id`, `transfer_token` (Unique), `[shop_id, status]` | Single-use transfer token state machine |
| `TransferCertificate` | Yes | `id`, `certificate_number` (Unique), `verification_hash` | Cryptographic ownership transfer certificate |
| `GiftRegistration` | Yes | `id`, `claim_code` (Unique), `[shop_id, status]` | Luxury gift unboxing and ownership claim token |
| `AuthenticationEvent` | Yes | `id`, `[shop_id, physical_piece_id]`, `created_at` | Append-only scan telemetry (NFC/QR/Serial) |
| `AuthenticationRiskEvent` | Yes | `id`, `[shop_id, resolved]`, `created_at` | Flagged anomalies (Impossible travel, rollbacks) |
| `CareSchedule` | Yes | `id`, `[shop_id, physical_piece_id]` | Periodic maintenance and leather spa rules |
| `ServiceCase` | Yes | `id`, `case_number` (Unique), `[shop_id, serial]` | Atelier repair tickets (Internal vs Public notes) |
| `WarrantyRecord` | Yes | `id`, `[shop_id, serial]`, `status` | Warranty coverage duration and expiration dates |
| `MembershipTier` | Yes | `id`, `[shop_id, tier_level]` | Configurable Private Club tiers (Maison, Atelier, Privé) |
| `CustomerMembership` | Yes | `id`, `[shop_id, customer_id]` (Unique) | Active customer membership tier assignment |
| `CreditsLedger` | Yes | `id`, `[shop_id, customer_id]`, `created_at` | Immutable append-only financial/points ledger |
| `Benefit` | Yes | `id`, `[shop_id, tier_id]` | Private Club benefits and privileges catalog |
| `BenefitRedemption` | Yes | `id`, `redemption_code` (Unique), `[shop_id, status]` | Single-use privilege redemption vouchers |
| `EarlyAccessRule` | Yes | `id`, `[shop_id, shopify_product_id]`, `is_active` | Tier-gated private drop scheduling rules |
| `LostStolenReport` | Yes | `id`, `[shop_id, serial]`, `status` | Theft reporting and blacklist locking |
| `NotificationLog` | Yes | `id`, `[shop_id, recipient_email]`, `created_at` | Dispatched transactional communication history |
| `CommunicationPreference` | Yes | `id`, `[shop_id, customer_id]` (Unique) | Customer opt-ins for care and transfer alerts |
| `AuditLog` | Yes | `id`, `[shop_id, action]`, `created_at` | Immutable compliance audit trail |
| `BillingSubscription` | Yes | `id`, `[shop_id, status]` | Shopify App recurring billing subscription state |
| `BackgroundJob` | Yes | `id`, `[shop_id, status, available_at]` | Database-backed background worker queue |

---

## 3. Strict Multi-Tenant Query Policy
Every domain repository and query MUST include `where: { shop_id }`. No query may ever select records globally across merchants. Foreign keys are configured with `onDelete: Cascade` on tenant deletion.
