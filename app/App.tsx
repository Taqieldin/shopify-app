import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider } from '@shopify/polaris';
import { AppBridgeProvider } from './providers/AppBridgeProvider';
import { TenantProvider } from './context/TenantContext';
import { AdminLayout } from './admin/components/AdminLayout';
import { DashboardView } from './admin/components/DashboardView';
import { PassportsView } from './admin/components/PassportsView';
import { PhysicalPiecesView } from './admin/components/PhysicalPiecesView';
import { TransfersView } from './admin/components/TransfersView';
import { AuthTelemetryView } from './admin/components/AuthTelemetryView';
import { PrivateClubView } from './admin/components/PrivateClubView';
import { CreditsLedgerView } from './admin/components/CreditsLedgerView';
import { EarlyAccessView } from './admin/components/EarlyAccessView';
import { CareServicesView } from './admin/components/CareServicesView';
import { WarrantiesView } from './admin/components/WarrantiesView';
import { CustomersView } from './admin/components/CustomersView';
import { LostStolenView } from './admin/components/LostStolenView';
import { AnalyticsView } from './admin/components/AnalyticsView';
import { BrandingSettingsView } from './admin/components/BrandingSettingsView';
import { AuditLogsView } from './admin/components/AuditLogsView';
import { BillingView } from './admin/components/BillingView';
import { NotificationsView } from './admin/components/NotificationsView';
import { SecurityDashboardView } from './admin/components/SecurityDashboardView';
import { NFCManagementView } from './admin/components/NFCManagementView';
import { VerificationOptionsView } from './admin/components/VerificationOptionsView';
import { ResaleMarketplaceView } from './admin/components/ResaleMarketplaceView';
import { EventsView } from './admin/components/EventsView';
import { PassportPage } from './public/passport/PassportPage';
import { CustomerClubView } from './customer/CustomerClubView';
import { GiftClaimPage } from './public/gift/GiftClaimPage';

const VALID_TABS = [
  'dashboard', 'passports', 'pieces', 'transfers', 'authentication',
  'verification-options', 'nfc', 'club', 'events', 'resale',
  'credits', 'early-access', 'services', 'warranties', 'customers',
  'lost-stolen', 'communications', 'billing', 'analytics', 'settings',
  'audit', 'customer-portal', 'gift-experience', 'security',
];

function getTabFromHash(): string {
  if (typeof window === 'undefined') return 'dashboard';
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash.startsWith('passport-')) return 'public-passport';
  if (VALID_TABS.includes(hash)) return hash;
  return 'dashboard';
}

function getSerialFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash.startsWith('passport-')) return hash.replace('passport-', '');
  return null;
}

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(() => getTabFromHash());
  const [viewingSerial, setViewingSerial] = useState<string | null>(() => getSerialFromHash());

  useEffect(() => {
    function onHashChange() {
      const tab = getTabFromHash();
      const serial = getSerialFromHash();
      setCurrentTab(tab);
      setViewingSerial(serial);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTo = useCallback((tab: string) => {
    if (tab.startsWith('public-passport-')) {
      const serial = tab.replace('public-passport-', '');
      window.location.hash = `passport-${serial}`;
    } else {
      window.location.hash = tab;
    }
  }, []);

  const handleOpenPassport = useCallback((serial: string) => {
    window.location.hash = `passport-${serial}`;
  }, []);

  return (
    <AppProvider i18n={{}}>
    <AppBridgeProvider>
      <TenantProvider>
        {currentTab === 'public-passport' && viewingSerial ? (
          <PassportPage
            serial={viewingSerial}
            onBackToAdmin={() => { window.location.hash = 'dashboard'; }}
          />
        ) : currentTab === 'customer-portal' ? (
          <CustomerClubView
            onBackToAdmin={() => { window.location.hash = 'dashboard'; }}
            onOpenPassport={handleOpenPassport}
          />
        ) : currentTab === 'gift-experience' ? (
          <GiftClaimPage onBackToAdmin={() => { window.location.hash = 'dashboard'; }} />
        ) : (
          <AdminLayout currentTab={currentTab} onSelectTab={navigateTo}>
            {currentTab === 'dashboard' && <DashboardView onNavigate={navigateTo} />}
            {currentTab === 'passports' && <PassportsView onPreviewPassport={handleOpenPassport} />}
            {currentTab === 'pieces' && <PhysicalPiecesView />}
            {currentTab === 'transfers' && <TransfersView />}
            {currentTab === 'authentication' && <AuthTelemetryView />}
            {currentTab === 'club' && <PrivateClubView />}
            {currentTab === 'credits' && <CreditsLedgerView />}
            {currentTab === 'early-access' && <EarlyAccessView />}
            {currentTab === 'services' && <CareServicesView />}
            {currentTab === 'warranties' && <WarrantiesView />}
            {currentTab === 'customers' && <CustomersView />}
            {currentTab === 'lost-stolen' && <LostStolenView />}
            {currentTab === 'communications' && <NotificationsView />}
            {currentTab === 'billing' && <BillingView />}
            {currentTab === 'analytics' && <AnalyticsView />}
            {currentTab === 'security' && <SecurityDashboardView />}
            {currentTab === 'nfc' && <NFCManagementView />}
            {currentTab === 'verification-options' && <VerificationOptionsView />}
            {currentTab === 'resale' && <ResaleMarketplaceView />}
            {currentTab === 'events' && <EventsView />}
            {currentTab === 'settings' && <BrandingSettingsView />}
            {currentTab === 'audit' && <AuditLogsView />}
          </AdminLayout>
        )}
      </TenantProvider>
    </AppBridgeProvider>
    </AppProvider>
  );
};

export default App;
