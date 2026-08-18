import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TenantData {
  id: string;
  shopify_shop_id: string;
  shop_domain: string;
  plan: string;
  settings: {
    brand_name: string;
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family: string;
    passport_term: string;
    club_name: string;
    credits_term: string;
    membership_terms: string[];
    public_story_enabled: boolean;
  };
  features: Record<string, boolean>;
}

export interface PieceData {
  id: string;
  serial: string;
  product_title: string;
  product_handle: string;
  product_image: string;
  category: string;
  edition_number?: number;
  edition_total?: number;
  status: 'MANUFACTURED' | 'REGISTERED' | 'TRANSFERRED' | 'SERVICED' | 'RESTORED' | 'LOST' | 'STOLEN' | 'REVOKED';
  nfc_uid?: string;
  manufacturing_date: string;
  manufacturing_location: string;
  materials: Array<{ name: string; origin?: string; certification?: string }>;
  color: string;
  dimensions: string;
  active_owner?: {
    name: string;
    email: string;
    started_at: string;
  };
}

export interface PassportData {
  id: string;
  piece_id: string;
  serial: string;
  title: string;
  description: string;
  hero_image: string;
  gallery: string[];
  craft_info: string;
  heritage_story: string;
  materials_summary: string;
  sustainability_data: string;
  view_count: number;
  status: 'ACTIVE' | 'DRAFT' | 'REVOKED';
}

export interface TransferData {
  id: string;
  serial: string;
  product_title: string;
  sender_email: string;
  recipient_email: string;
  recipient_name?: string;
  transfer_token: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  expires_at: string;
  certificate_number?: string;
  verification_hash?: string;
}

export interface AuthEventData {
  id: string;
  serial: string;
  method: 'NFC' | 'QR' | 'SERIAL';
  result: 'AUTHENTICATED' | 'UNREGISTERED' | 'SUSPICIOUS' | 'REVOKED';
  risk_level: 'NORMAL' | 'LOW_RISK' | 'REVIEW' | 'HIGH_RISK';
  country: string;
  city: string;
  nfc_counter?: number;
  timestamp: string;
}

export interface CreditEntryData {
  id: string;
  customer_email: string;
  amount: number;
  type: 'EARN' | 'REDEEM' | 'BONUS' | 'ADJUSTMENT' | 'REVERSAL';
  reason: string;
  created_by: string;
  created_at: string;
}

export interface ServiceCaseData {
  id: string;
  case_number: string;
  serial: string;
  service_type: string;
  status: 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED';
  technician_name: string;
  received_date: string;
  completed_date?: string;
  warranty_covered: boolean;
  cost_amount: number;
  internal_notes: string;
  customer_notes: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  target: string;
  time: string;
  metadata?: Record<string, unknown>;
}

interface TenantContextType {
  currentTenant: TenantData;
  switchTenant: (tenantId: string) => void;
  availableTenants: TenantData[];
  pieces: PieceData[];
  passports: PassportData[];
  transfers: TransferData[];
  authEvents: AuthEventData[];
  creditEntries: CreditEntryData[];
  serviceCases: ServiceCaseData[];
  auditLogs: AuditLogEntry[];
  loading: boolean;
  createPieceAndPassport: (piece: Partial<PieceData>, passport: Partial<PassportData>) => Promise<void>;
  initiateTransfer: (serial: string, recipientEmail: string, recipientName?: string) => Promise<string>;
  acceptTransfer: (token: string, recipientEmail: string, recipientName: string) => Promise<{ certNumber: string; hash: string }>;
  postCreditAdjustment: (customerEmail: string, amount: number, reason: string) => Promise<void>;
  createServiceCase: (service: Partial<ServiceCaseData>) => Promise<void>;
  updateServiceStatus: (caseId: string, status: 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED', customerNotes?: string) => Promise<void>;
  reportTheft: (serial: string, type: 'LOST' | 'STOLEN', notes?: string) => Promise<void>;
  updateSettings: (settings: Partial<TenantData['settings']>) => Promise<void>;
  updateFeatures: (features: Record<string, boolean>) => Promise<void>;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  // Extract shop domain from App Bridge host param
  if (typeof window !== 'undefined') {
    const host = new URLSearchParams(window.location.search).get('host');
    if (host) {
      try {
        const decoded = atob(host);
        const shopMatch = decoded.match(/([^.]+\.myshopify\.com)/);
        if (shopMatch) {
          headers['x-shopify-shop-domain'] = shopMatch[1];
        }
      } catch {
        // fallback: host might already be the shop domain
        headers['x-shopify-shop-domain'] = host;
      }
    }
    const shop = new URLSearchParams(window.location.search).get('shop');
    if (shop) {
      headers['x-shopify-shop-domain'] = shop;
    }
  }

  headers['x-user-role'] = 'MERCHANT_OWNER';
  return headers;
}

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { headers: getAuthHeaders() });
    const json = await res.json();
    if (json.success === false) {
      console.error(`[API] GET ${path} failed:`, json.error);
      return null;
    }
    return json.data as T;
  } catch (err) {
    console.error(`[API] GET ${path} error:`, err);
    return null;
  }
}

async function apiPost<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.success === false) {
      console.error(`[API] POST ${path} failed:`, json.error);
      return null;
    }
    return json.data as T;
  } catch (err) {
    console.error(`[API] POST ${path} error:`, err);
    return null;
  }
}

async function apiPatch<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.success === false) {
      console.error(`[API] PATCH ${path} failed:`, json.error);
      return null;
    }
    return json.data as T;
  } catch (err) {
    console.error(`[API] PATCH ${path} error:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Raw backend shapes (Prisma includes)
// ---------------------------------------------------------------------------

interface RawShop {
  id: string;
  shopify_shop_id: string;
  shop_domain: string;
  plan?: string;
  settings?: {
    brand_name?: string;
    logo_url?: string | null;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    font_family?: string;
    passport_term?: string;
    club_name?: string;
    credits_term?: string;
    membership_terms_json?: string;
    public_story_enabled?: boolean;
  } | null;
  features?: Record<string, boolean> | null;
}

interface RawPhysicalPiece {
  id: string;
  serial: string;
  edition_number?: number | null;
  edition_total?: number | null;
  status: string;
  nfc_uid?: string | null;
  manufacturing_date?: string | null;
  manufacturing_location?: string | null;
  materials_json?: string | null;
  color?: string | null;
  dimensions?: string | null;
  product_ref?: {
    title?: string;
    handle?: string;
    image_url?: string | null;
    category?: string | null;
  };
  ownerships?: Array<{
    is_active: boolean;
    started_at: string;
    customer?: {
      first_name?: string | null;
      last_name?: string | null;
      email: string;
    };
  }>;
}

interface RawPassport {
  id: string;
  physical_piece_id: string;
  status: string;
  title: string;
  description?: string | null;
  hero_image_url?: string | null;
  gallery_json?: string | null;
  craft_info?: string | null;
  heritage_story?: string | null;
  materials_summary?: string | null;
  sustainability_data?: string | null;
  view_count: number;
  physical_piece?: {
    serial: string;
  };
}

interface RawTransfer {
  id: string;
  physical_piece_id: string;
  recipient_email: string;
  recipient_name?: string | null;
  transfer_token: string;
  status: string;
  expires_at: string;
  created_at: string;
  physical_piece?: {
    serial: string;
    product_ref?: { title?: string };
  };
  sender?: {
    email: string;
  };
  certificate?: {
    certificate_number: string;
    verification_hash: string;
  } | null;
}

interface RawAuditLog {
  id: string;
  action: string;
  actor_type: string;
  actor_id: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
  metadata_json?: string | null;
}

interface RawCreditsEntry {
  id: string;
  customer_id: string;
  amount: number;
  type: string;
  reason: string;
  created_by: string;
  created_at: string;
  customer?: {
    email: string;
  };
}

interface RawServiceCase {
  id: string;
  case_number: string;
  physical_piece_id: string;
  service_type: string;
  status: string;
  technician_name?: string | null;
  received_date: string;
  completed_date?: string | null;
  cost_amount: number;
  warranty_covered: boolean;
  internal_notes?: string | null;
  customer_notes?: string | null;
  physical_piece?: {
    serial: string;
  };
}

interface RawAuthEvent {
  id: string;
  physical_piece_id: string;
  method: string;
  result: string;
  risk_level: string;
  country?: string | null;
  city?: string | null;
  nfc_read_counter?: number | null;
  created_at: string;
  physical_piece?: {
    serial: string;
  };
}

// ---------------------------------------------------------------------------
// Mapping functions
// ---------------------------------------------------------------------------

function mapTenant(raw: RawShop): TenantData {
  const membershipTermsRaw = raw.settings?.membership_terms_json;
  let membershipTerms: string[] = [];
  if (membershipTermsRaw) {
    try {
      const parsed = JSON.parse(membershipTermsRaw);
      membershipTerms = Array.isArray(parsed) ? parsed : parsed.tiers || [];
    } catch {
      membershipTerms = [];
    }
  }

  const features: Record<string, boolean> = {};
  if (raw.features && typeof raw.features === 'object') {
    for (const [key, value] of Object.entries(raw.features)) {
      if (typeof value === 'boolean') {
        features[key] = value;
      }
    }
  }

  return {
    id: raw.id,
    shopify_shop_id: raw.shopify_shop_id,
    shop_domain: raw.shop_domain,
    plan: raw.plan || 'FREE',
    settings: {
      brand_name: raw.settings?.brand_name || raw.shop_domain,
      logo_url: raw.settings?.logo_url || undefined,
      primary_color: raw.settings?.primary_color || '#1c1917',
      secondary_color: raw.settings?.secondary_color || '#78716c',
      accent_color: raw.settings?.accent_color || '#c2410c',
      font_family: raw.settings?.font_family || 'system-ui',
      passport_term: raw.settings?.passport_term || 'Digital Passport',
      club_name: raw.settings?.club_name || 'Private Club',
      credits_term: raw.settings?.credits_term || 'Credits',
      membership_terms: membershipTerms,
      public_story_enabled: raw.settings?.public_story_enabled ?? true,
    },
    features,
  };
}

function mapPiece(raw: RawPhysicalPiece): PieceData {
  let materials: Array<{ name: string; origin?: string; certification?: string }> = [];
  if (raw.materials_json) {
    try {
      materials = JSON.parse(raw.materials_json);
    } catch {
      materials = [];
    }
  }

  const activeOwnership = raw.ownerships?.find((o) => o.is_active);
  const customer = activeOwnership?.customer;

  return {
    id: raw.id,
    serial: raw.serial,
    product_title: raw.product_ref?.title || '',
    product_handle: raw.product_ref?.handle || '',
    product_image: raw.product_ref?.image_url || '',
    category: raw.product_ref?.category || '',
    edition_number: raw.edition_number ?? undefined,
    edition_total: raw.edition_total ?? undefined,
    status: raw.status as PieceData['status'],
    nfc_uid: raw.nfc_uid || undefined,
    manufacturing_date: raw.manufacturing_date || '',
    manufacturing_location: raw.manufacturing_location || '',
    materials,
    color: raw.color || '',
    dimensions: raw.dimensions || '',
    active_owner: customer
      ? {
          name: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Unknown',
          email: customer.email || '',
          started_at: activeOwnership?.started_at || '',
        }
      : undefined,
  };
}

function mapPassport(raw: RawPassport): PassportData {
  let gallery: string[] = [];
  if (raw.gallery_json) {
    try {
      gallery = JSON.parse(raw.gallery_json);
    } catch {
      gallery = [];
    }
  }

  return {
    id: raw.id,
    piece_id: raw.physical_piece_id,
    serial: raw.physical_piece?.serial || '',
    title: raw.title,
    description: raw.description || '',
    hero_image: raw.hero_image_url || '',
    gallery,
    craft_info: raw.craft_info || '',
    heritage_story: raw.heritage_story || '',
    materials_summary: raw.materials_summary || '',
    sustainability_data: raw.sustainability_data || '',
    view_count: raw.view_count || 0,
    status: raw.status as PassportData['status'],
  };
}

function mapTransfer(raw: RawTransfer): TransferData {
  return {
    id: raw.id,
    serial: raw.physical_piece?.serial || '',
    product_title: raw.physical_piece?.product_ref?.title || '',
    sender_email: raw.sender?.email || '',
    recipient_email: raw.recipient_email,
    recipient_name: raw.recipient_name || undefined,
    transfer_token: raw.transfer_token,
    status: raw.status as TransferData['status'],
    expires_at: raw.expires_at,
    certificate_number: raw.certificate?.certificate_number,
    verification_hash: raw.certificate?.verification_hash,
  };
}

function mapAuthEvent(raw: RawAuthEvent): AuthEventData {
  return {
    id: raw.id,
    serial: raw.physical_piece?.serial || '',
    method: raw.method as AuthEventData['method'],
    result: raw.result as AuthEventData['result'],
    risk_level: raw.risk_level as AuthEventData['risk_level'],
    country: raw.country || '',
    city: raw.city || '',
    nfc_counter: raw.nfc_read_counter ?? undefined,
    timestamp: raw.created_at,
  };
}

function mapCreditEntry(raw: RawCreditsEntry): CreditEntryData {
  return {
    id: raw.id,
    customer_email: raw.customer?.email || '',
    amount: raw.amount,
    type: raw.type as CreditEntryData['type'],
    reason: raw.reason,
    created_by: raw.created_by,
    created_at: raw.created_at,
  };
}

function mapServiceCase(raw: RawServiceCase): ServiceCaseData {
  return {
    id: raw.id,
    case_number: raw.case_number,
    serial: raw.physical_piece?.serial || '',
    service_type: raw.service_type,
    status: raw.status as ServiceCaseData['status'],
    technician_name: raw.technician_name || '',
    received_date: raw.received_date,
    completed_date: raw.completed_date || undefined,
    warranty_covered: raw.warranty_covered,
    cost_amount: raw.cost_amount,
    internal_notes: raw.internal_notes || '',
    customer_notes: raw.customer_notes || '',
  };
}

function mapAuditLog(raw: RawAuditLog): AuditLogEntry {
  let metadata: Record<string, unknown> | undefined;
  if (raw.metadata_json) {
    try {
      metadata = JSON.parse(raw.metadata_json);
    } catch {
      metadata = undefined;
    }
  }
  return {
    id: raw.id,
    action: raw.action,
    actor: `${raw.actor_type}:${raw.actor_id}`,
    target: `${raw.resource_type}:${raw.resource_id}`,
    time: raw.created_at,
    metadata,
  };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const DEFAULT_TENANT: TenantData = {
  id: '',
  shopify_shop_id: '',
  shop_domain: '',
  plan: 'FREE',
  settings: {
    brand_name: 'Loading...',
    primary_color: '#1c1917',
    secondary_color: '#78716c',
    accent_color: '#c2410c',
    font_family: 'system-ui',
    passport_term: 'Digital Passport',
    club_name: 'Private Club',
    credits_term: 'Credits',
    membership_terms: [],
    public_story_enabled: true,
  },
  features: {},
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<TenantData>(DEFAULT_TENANT);
  const [pieces, setPieces] = useState<PieceData[]>([]);
  const [passports, setPassports] = useState<PassportData[]>([]);
  const [transfers, setTransfers] = useState<TransferData[]>([]);
  const [authEvents, setAuthEvents] = useState<AuthEventData[]>([]);
  const [creditEntries, setCreditEntries] = useState<CreditEntryData[]>([]);
  const [serviceCases, setServiceCases] = useState<ServiceCaseData[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------------
  // Fetch helpers (used on mount and after mutations)
  // ------------------------------------------------------------------

  const fetchTenant = useCallback(async () => {
    const raw = await apiGet<RawShop>('/api/admin/settings');
    if (raw) setCurrentTenant(mapTenant(raw));
  }, []);

  const fetchPieces = useCallback(async () => {
    const raw = await apiGet<RawPhysicalPiece[]>('/api/admin/pieces');
    if (raw) setPieces(raw.map(mapPiece));
  }, []);

  const fetchPassports = useCallback(async () => {
    const raw = await apiGet<RawPassport[]>('/api/admin/passports');
    if (raw) setPassports(raw.map(mapPassport));
  }, []);

  const fetchTransfers = useCallback(async () => {
    const raw = await apiGet<RawTransfer[]>('/api/admin/transfers');
    if (raw) setTransfers(raw.map(mapTransfer));
  }, []);

  const fetchAuthEvents = useCallback(async () => {
    const raw = await apiGet<RawAuditLog[]>('/api/admin/audit');
    if (raw) {
      const events = raw
        .filter((r) => r.resource_type === 'AUTH_EVENT' || r.action.includes('AUTH') || r.action.includes('SCAN'))
        .map((r): AuthEventData => {
          let metadata: Record<string, unknown> = {};
          if (r.metadata_json) {
            try { metadata = JSON.parse(r.metadata_json); } catch { /* ignore */ }
          }
          return {
            id: r.id,
            serial: (metadata.serial as string) || r.resource_id,
            method: ((metadata.method as string) || 'SERIAL') as AuthEventData['method'],
            result: ((metadata.result as string) || 'AUTHENTICATED') as AuthEventData['result'],
            risk_level: ((metadata.risk_level as string) || 'NORMAL') as AuthEventData['risk_level'],
            country: (metadata.country as string) || '',
            city: (metadata.city as string) || '',
            nfc_counter: (metadata.nfc_counter as number) || undefined,
            timestamp: r.created_at,
          };
        });
      setAuthEvents(events);
    }
  }, []);

  const fetchCredits = useCallback(async () => {
    const raw = await apiGet<RawCreditsEntry[]>('/api/admin/credits');
    if (raw) setCreditEntries(raw.map(mapCreditEntry));
  }, []);

  const fetchServices = useCallback(async () => {
    const raw = await apiGet<RawServiceCase[]>('/api/admin/services');
    if (raw) setServiceCases(raw.map(mapServiceCase));
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    const raw = await apiGet<RawAuditLog[]>('/api/admin/audit');
    if (raw) setAuditLogs(raw.map(mapAuditLog));
  }, []);

  // ------------------------------------------------------------------
  // Initial data load
  // ------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      await Promise.all([
        fetchTenant(),
        fetchPieces(),
        fetchPassports(),
        fetchTransfers(),
        fetchAuthEvents(),
        fetchCredits(),
        fetchServices(),
        fetchAuditLogs(),
      ]);
      if (!cancelled) setLoading(false);
    }

    loadAll();
    return () => { cancelled = true; };
  }, [fetchTenant, fetchPieces, fetchPassports, fetchTransfers, fetchAuthEvents, fetchCredits, fetchServices, fetchAuditLogs]);

  // ------------------------------------------------------------------
  // Tenant switching (no-op for now; keeps the interface)
  // ------------------------------------------------------------------

  const switchTenant = useCallback((_tenantId: string) => {
    // Production app only has one tenant. Kept as no-op for interface compat.
  }, []);

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------

  const createPieceAndPassport = useCallback(async (pieceData: Partial<PieceData>, passportData: Partial<PassportData>) => {
    await apiPost('/api/admin/pieces', pieceData);
    await apiPost('/api/admin/passports', passportData);
    await Promise.all([fetchPieces(), fetchPassports(), fetchAuditLogs()]);
  }, [fetchPieces, fetchPassports, fetchAuditLogs]);

  const initiateTransfer = useCallback(async (serial: string, recipientEmail: string, recipientName?: string): Promise<string> => {
    const piece = pieces.find((p) => p.serial === serial);
    const data = await apiPost<{ transfer_token: string }>('/api/customer/me/transfer', {
      serial,
      sender_shopify_customer_id: piece?.active_owner ? 'admin' : '',
      recipient_email: recipientEmail,
      recipient_name: recipientName,
    });
    await Promise.all([fetchTransfers(), fetchAuditLogs()]);
    return data?.transfer_token || '';
  }, [pieces, fetchTransfers, fetchAuditLogs]);

  const acceptTransfer = useCallback(async (token: string, recipientEmail: string, recipientName: string): Promise<{ certNumber: string; hash: string }> => {
    const data = await apiPost<{ certificate_number: string; verification_hash: string }>(
      '/api/customer/me/transfer/accept',
      { transfer_token: token, recipient_email: recipientEmail, recipient_name: recipientName },
    );
    await Promise.all([fetchTransfers(), fetchPieces(), fetchAuditLogs()]);
    return {
      certNumber: data?.certificate_number || '',
      hash: data?.verification_hash || '',
    };
  }, [fetchTransfers, fetchPieces, fetchAuditLogs]);

  const postCreditAdjustment = useCallback(async (customerEmail: string, amount: number, reason: string) => {
    await apiPost('/api/admin/credits', { customer_email: customerEmail, amount, reason });
    await Promise.all([fetchCredits(), fetchAuditLogs()]);
  }, [fetchCredits, fetchAuditLogs]);

  const createServiceCase = useCallback(async (serviceData: Partial<ServiceCaseData>) => {
    await apiPost('/api/admin/services', serviceData);
    await Promise.all([fetchServices(), fetchAuditLogs()]);
  }, [fetchServices, fetchAuditLogs]);

  const updateServiceStatus = useCallback(async (caseId: string, status: 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED', customerNotes?: string) => {
    await apiPost(`/api/admin/services/${caseId}/status`, { status, customer_notes: customerNotes });
    await fetchServices();
  }, [fetchServices]);

  const reportTheft = useCallback(async (serial: string, type: 'LOST' | 'STOLEN', notes?: string) => {
    await apiPost('/api/admin/theft', { serial, report_type: type, notes });
    await Promise.all([fetchPieces(), fetchAuditLogs()]);
  }, [fetchPieces, fetchAuditLogs]);

  const updateSettings = useCallback(async (newSettings: Partial<TenantData['settings']>) => {
    const payload: Record<string, unknown> = {};
    if (newSettings.brand_name !== undefined) payload.brand_name = newSettings.brand_name;
    if (newSettings.logo_url !== undefined) payload.logo_url = newSettings.logo_url;
    if (newSettings.primary_color !== undefined) payload.primary_color = newSettings.primary_color;
    if (newSettings.secondary_color !== undefined) payload.secondary_color = newSettings.secondary_color;
    if (newSettings.accent_color !== undefined) payload.accent_color = newSettings.accent_color;
    if (newSettings.font_family !== undefined) payload.font_family = newSettings.font_family;
    if (newSettings.passport_term !== undefined) payload.passport_term = newSettings.passport_term;
    if (newSettings.club_name !== undefined) payload.club_name = newSettings.club_name;
    if (newSettings.credits_term !== undefined) payload.credits_term = newSettings.credits_term;
    if (newSettings.membership_terms !== undefined) {
      payload.membership_terms_json = JSON.stringify(newSettings.membership_terms);
    }
    if (newSettings.public_story_enabled !== undefined) payload.public_story_enabled = newSettings.public_story_enabled;

    await apiPatch('/api/admin/settings', payload);
    await fetchTenant();
  }, [fetchTenant]);

  const updateFeatures = useCallback(async (newFeatures: Record<string, boolean>) => {
    await apiPatch('/api/admin/settings', newFeatures);
    await fetchTenant();
  }, [fetchTenant]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        switchTenant,
        availableTenants: currentTenant.id ? [currentTenant] : [],
        pieces,
        passports,
        transfers,
        authEvents,
        creditEntries,
        serviceCases,
        auditLogs,
        loading,
        createPieceAndPassport,
        initiateTransfer,
        acceptTransfer,
        postCreditAdjustment,
        createServiceCase,
        updateServiceStatus,
        reportTheft,
        updateSettings,
        updateFeatures,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
