-- Security Enhancements Migration
-- This migration adds tables and fields for enhanced security monitoring

-- ===============================================================
-- NFC Blocklist Table
-- ===============================================================
CREATE TABLE IF NOT EXISTS "NFCBlocklist" (
  "id" TEXT PRIMARY KEY,
  "shop_id" TEXT NOT NULL,
  "nfc_uid" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "blocked_by" TEXT NOT NULL,
  "blocked_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "unblocked_at" TIMESTAMP,
  "unblocked_by" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE
);

-- Indexes for NFCBlocklist
CREATE INDEX IF NOT EXISTS "NFCBlocklist_shop_id_idx" ON "NFCBlocklist"("shop_id");
CREATE INDEX IF NOT EXISTS "NFCBlocklist_nfc_uid_idx" ON "NFCBlocklist"("nfc_uid");
CREATE INDEX IF NOT EXISTS "NFCBlocklist_shop_id_nfc_uid_is_active_idx" 
  ON "NFCBlocklist"("shop_id", "nfc_uid", "is_active");

-- ===============================================================
-- Authentication Risk Event Enhancements
-- ===============================================================
-- Add additional fields to AuthenticationRiskEvent if not exists
ALTER TABLE "AuthenticationRiskEvent" ADD COLUMN IF NOT EXISTS "anomaly_type" TEXT;
ALTER TABLE "AuthenticationRiskEvent" ADD COLUMN IF NOT EXISTS "severity" TEXT;
ALTER TABLE "AuthenticationRiskEvent" ADD COLUMN IF NOT EXISTS "details_json" TEXT;
ALTER TABLE "AuthenticationRiskEvent" ADD COLUMN IF NOT EXISTS "reviewed_by" TEXT;
ALTER TABLE "AuthenticationRiskEvent" ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP;

-- Index for unresolved risk events
CREATE INDEX IF NOT EXISTS "AuthenticationRiskEvent_shop_id_resolved_idx" 
  ON "AuthenticationRiskEvent"("shop_id", "resolved");

-- ===============================================================
-- Authentication Event Enhancements
-- ===============================================================
-- Add NFC UID tracking if not exists
ALTER TABLE "AuthenticationEvent" ADD COLUMN IF NOT EXISTS "nfc_uid" TEXT;

-- Index for NFC UID lookups
CREATE INDEX IF NOT EXISTS "AuthenticationEvent_nfc_uid_idx" 
  ON "AuthenticationEvent"("nfc_uid");

-- ===============================================================
-- Physical Piece Status Enhancement
-- ===============================================================
-- Add UNDER_REVIEW status for suspicious pieces
-- Note: This requires checking if UNDER_REVIEW is already in the enum
-- For SQLite, we'll handle this at the application level

-- ===============================================================
-- Security Audit Log
-- ===============================================================
-- Add security-specific fields to AuditLog if needed
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "ip_address" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "user_agent" TEXT;

-- Index for security audit queries
CREATE INDEX IF NOT EXISTS "AuditLog_shop_id_action_idx" 
  ON "AuditLog"("shop_id", "action");
CREATE INDEX IF NOT EXISTS "AuditLog_created_at_idx" 
  ON "AuditLog"("created_at");
