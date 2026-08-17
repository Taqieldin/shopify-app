export type TenantContext = {
  shop_id: string;
  shop_domain: string;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
};

export type UserRole = 'MERCHANT_OWNER' | 'MERCHANT_ADMIN' | 'MERCHANT_STAFF' | 'CUSTOMER' | 'PUBLIC';

export type AuthContext = {
  tenant: TenantContext;
  role: UserRole;
  actor_id: string; // shopify_user_id or customer_id or 'public'
};

export type PhysicalPieceStatus =
  | 'MANUFACTURED'
  | 'REGISTERED'
  | 'TRANSFERRED'
  | 'SERVICED'
  | 'RESTORED'
  | 'LOST'
  | 'STOLEN'
  | 'REVOKED'
  | 'RETIRED';

export type PassportStatus = 'DRAFT' | 'ACTIVE' | 'REVOKED';

export type OwnershipSource =
  | 'DIRECT_PURCHASE'
  | 'REGISTRATION'
  | 'TRANSFER_ACCEPTANCE'
  | 'GIFT'
  | 'RESALE'
  | 'ADMIN_OVERRIDE';

export type TransferStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'ACCEPTED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'REVOKED';

export type AuthVerificationResult =
  | 'AUTHENTICATED'
  | 'UNREGISTERED'
  | 'PENDING_VERIFICATION'
  | 'SUSPICIOUS'
  | 'REVOKED';

export type RiskLevel = 'NORMAL' | 'LOW_RISK' | 'REVIEW' | 'HIGH_RISK';

export type LedgerTransactionType =
  | 'EARN'
  | 'REDEEM'
  | 'BONUS'
  | 'ADJUSTMENT'
  | 'REVERSAL'
  | 'EXPIRY';
