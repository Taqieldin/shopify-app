-- ============================================================
-- Phase 2 Feature Migrations
-- API Keys, Webhooks, NTAG424 Support
-- ============================================================

-- API Keys Table
CREATE TABLE IF NOT EXISTS "APIKey" (
  "id" TEXT PRIMARY KEY,
  "shop_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "key_prefix" TEXT NOT NULL,
  "hashed_key" TEXT NOT NULL UNIQUE,
  "tier" TEXT NOT NULL DEFAULT 'free',
  "scopes_json" TEXT NOT NULL DEFAULT '["verify:read"]',
  "rate_limit" INTEGER NOT NULL DEFAULT 100,
  "requests_count" INTEGER NOT NULL DEFAULT 0,
  "last_used_at" TIMESTAMP,
  "expires_at" TIMESTAMP,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "APIKey_shop_id_fkey" FOREIGN KEY ("shop_id") 
    REFERENCES "Shop"("id") ON DELETE CASCADE
);

CREATE INDEX "APIKey_shop_id_idx" ON "APIKey"("shop_id");
CREATE INDEX "APIKey_hashed_key_idx" ON "APIKey"("hashed_key");
CREATE INDEX "APIKey_is_active_idx" ON "APIKey"("is_active");

-- Webhook Endpoints Table
CREATE TABLE IF NOT EXISTS "WebhookEndpoint" (
  "id" TEXT PRIMARY KEY,
  "shop_id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "secret" TEXT NOT NULL,
  "events_json" TEXT NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_triggered_at" TIMESTAMP,
  "success_count" INTEGER NOT NULL DEFAULT 0,
  "failure_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "WebhookEndpoint_shop_id_fkey" FOREIGN KEY ("shop_id") 
    REFERENCES "Shop"("id") ON DELETE CASCADE
);

CREATE INDEX "WebhookEndpoint_shop_id_idx" ON "WebhookEndpoint"("shop_id");
CREATE INDEX "WebhookEndpoint_is_active_idx" ON "WebhookEndpoint"("is_active");

-- Webhook Delivery Log Table
CREATE TABLE IF NOT EXISTS "WebhookDelivery" (
  "id" TEXT PRIMARY KEY,
  "webhook_id" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "payload_json" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "response_status" INTEGER,
  "response_body" TEXT,
  "error_message" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "WebhookDelivery_webhook_id_fkey" FOREIGN KEY ("webhook_id") 
    REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE
);

CREATE INDEX "WebhookDelivery_webhook_id_idx" ON "WebhookDelivery"("webhook_id");
CREATE INDEX "WebhookDelivery_created_at_idx" ON "WebhookDelivery"("created_at" DESC);
CREATE INDEX "WebhookDelivery_status_idx" ON "WebhookDelivery"("status");

-- Add NTAG424 support fields to PhysicalPiece
ALTER TABLE "PhysicalPiece" ADD COLUMN IF NOT EXISTS "nfc_type" TEXT;
ALTER TABLE "PhysicalPiece" ADD COLUMN IF NOT EXISTS "nfc_encryption_key" TEXT;
ALTER TABLE "PhysicalPiece" ADD COLUMN IF NOT EXISTS "nfc_last_read_counter" INTEGER DEFAULT 0;
ALTER TABLE "PhysicalPiece" ADD COLUMN IF NOT EXISTS "nfc_is_cryptographic" BOOLEAN DEFAULT false;

-- Add PDF certificate support
ALTER TABLE "TransferCertificate" ADD COLUMN IF NOT EXISTS "pdf_url" TEXT;
ALTER TABLE "TransferCertificate" ADD COLUMN IF NOT EXISTS "pdf_generated_at" TIMESTAMP;

-- Add geolocation support to AuthenticationEvent
ALTER TABLE "AuthenticationEvent" ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(10, 8);
ALTER TABLE "AuthenticationEvent" ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(11, 8);
ALTER TABLE "AuthenticationEvent" ADD COLUMN IF NOT EXISTS "accuracy" DECIMAL(10, 2);
ALTER TABLE "AuthenticationEvent" ADD COLUMN IF NOT EXISTS "location_timestamp" TIMESTAMP;

COMMENT ON TABLE "APIKey" IS 'API keys for third-party integrations';
COMMENT ON TABLE "WebhookEndpoint" IS 'Webhook endpoints for event notifications';
COMMENT ON TABLE "WebhookDelivery" IS 'Log of webhook deliveries and responses';
COMMENT ON COLUMN "PhysicalPiece"."nfc_type" IS 'NFC tag type: NTAG213, NTAG424, etc.';
COMMENT ON COLUMN "PhysicalPiece"."nfc_encryption_key" IS 'Encrypted storage of NTAG424 key';
COMMENT ON COLUMN "PhysicalPiece"."nfc_last_read_counter" IS 'Last verified read counter for NTAG424';
COMMENT ON COLUMN "PhysicalPiece"."nfc_is_cryptographic" IS 'Whether NFC uses cryptographic auth';
