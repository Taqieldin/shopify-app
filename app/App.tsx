import React, { useState } from 'react';
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

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [viewingSerial, setViewingSerial] = useState<string | null>(null);

  const handleNavigate = (tab: string) => {
    if (tab.startsWith('public-passport-')) {
      const serial = tab.replace('public-passport-', '');
      setViewingSerial(serial);
      setCurrentTab('public-passport');
    } else {
      setCurrentTab(tab);
    }
  };

  const handleOpenPassport = (serial: string) => {
    setViewingSerial(serial);
    setCurrentTab('public-passport');
  };

  return (
    <AppBridgeProvider>
      <TenantProvider>
        {currentTab === 'public-passport' && viewingSerial ? (
          <PassportPage
            serial={viewingSerial}
            onBackToAdmin={() => setCurrentTab('dashboard')}
          />
        ) : currentTab === 'customer-portal' ? (
          <CustomerClubView
            onBackToAdmin={() => setCurrentTab('dashboard')}
            onOpenPassport={handleOpenPassport}
          />
        ) : currentTab === 'gift-experience' ? (
          <GiftClaimPage onBackToAdmin={() => setCurrentTab('dashboard')} />
        ) : (
          <AdminLayout currentTab={currentTab} onSelectTab={handleNavigate}>
            {currentTab === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
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
  );
};

export default App;
