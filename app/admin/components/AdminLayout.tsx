import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import {
  LayoutDashboard,
  ShieldCheck,
  QrCode,
  Tag,
  ArrowRightLeft,
  Crown,
  Coins,
  Wrench,
  AlertTriangle,
  BarChart3,
  Settings,
  FileText,
  ExternalLink,
  Store,
  CheckCircle2,
  Sparkles,
  Search,
  Bell,
  Gift,
  CreditCard,
  Mail,
  Flame,
  Shield,
  Users,
  CalendarDays,
  SlidersHorizontal,
  Nfc,
} from 'lucide-react';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
}) => {
  const { currentTenant, switchTenant, availableTenants, pieces } = useTenant();
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { id: 'dashboard', label: 'Overview & KPIs', icon: LayoutDashboard },
    { id: 'passports', label: currentTenant.settings.passport_term, icon: QrCode },
    { id: 'pieces', label: 'Physical Pieces', icon: Tag },
    { id: 'transfers', label: 'Ownership Transfers', icon: ArrowRightLeft },
    { id: 'authentication', label: 'Authenticity Telemetry', icon: ShieldCheck },
    { id: 'verification-options', label: 'Verification Options', icon: SlidersHorizontal },
    { id: 'nfc', label: 'NFC Tag Management', icon: Nfc },
    { id: 'club', label: currentTenant.settings.club_name, icon: Crown },
    { id: 'events', label: 'Club Events', icon: CalendarDays },
    { id: 'resale', label: 'Pre-Owned Marketplace', icon: Store },
    { id: 'credits', label: currentTenant.settings.credits_term, icon: Coins },
    { id: 'early-access', label: 'VIP Early Access Drops', icon: Flame },
    { id: 'services', label: 'Care & Service Cases', icon: Wrench },
    { id: 'warranties', label: 'Warranty & Guarantees', icon: Shield },
    { id: 'customers', label: 'Collector Circle', icon: Users },
    { id: 'lost-stolen', label: 'Lost & Stolen Registry', icon: AlertTriangle },
    { id: 'communications', label: 'Communications & Alerts', icon: Mail },
    { id: 'billing', label: 'Billing & Subscriptions', icon: CreditCard },
    { id: 'analytics', label: 'Analytics & Insights', icon: BarChart3 },
    { id: 'settings', label: 'Branding & Terminology', icon: Settings },
    { id: 'audit', label: 'Audit Trail', icon: FileText },
  ];

  const firstSerial = pieces[0]?.serial || '';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Embedded Shopify Navigation Bar */}
      <header className="h-16 border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-bold text-sm shadow-inner">
              DP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-wide text-zinc-100">
                  Digital Product Passport
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentTenant.plan}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Multi-Tenant Shopify SaaS Platform
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-zinc-800 mx-2 hidden sm:block" />

          {/* Tenant Switcher */}
          <div className="flex items-center gap-2 bg-zinc-950/70 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs">
            <Store className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400 text-[11px]">Merchant Tenant:</span>
            <select
              value={currentTenant.id}
              onChange={(e) => switchTenant(e.target.value)}
              className="bg-transparent text-amber-300 font-medium focus:outline-none cursor-pointer text-xs"
            >
              {availableTenants.map((t) => (
                <option key={t.id} value={t.id} className="bg-zinc-900 text-zinc-100">
                  {t.settings.brand_name} ({t.shop_domain})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls & External Preview Links */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            {/* View Live Public Passport */}
            <a
              href={`#passport-${firstSerial}`}
              onClick={() => onSelectTab(`public-passport-${firstSerial}`)}
              className="flex items-center gap-1.5 text-xs bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-md border border-zinc-700/60 transition shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Public Passport View</span>
            </a>

            {/* View Customer Account Extension Preview */}
            <button
              onClick={() => onSelectTab('customer-portal')}
              className="flex items-center gap-1.5 text-xs bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-md border border-zinc-700/60 transition shadow-sm"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Customer Vault Preview</span>
            </button>

            {/* View Gift Unboxing Experience Preview */}
            <button
              onClick={() => onSelectTab('gift-experience')}
              className="flex items-center gap-1.5 text-xs bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-md border border-zinc-700/60 transition shadow-sm"
            >
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>Gift Unboxing</span>
            </button>
          </div>

          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300">
            MA
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="w-64 border-r border-zinc-800/80 bg-zinc-950/60 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest px-3 mb-2">
                Merchant Controls
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                        isActive
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm font-semibold'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Tenant Status Footer */}
          <div className="mt-8 pt-4 border-t border-zinc-800/60 text-[11px] text-zinc-400 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Shopify App Bridge
              </span>
              <span className="text-zinc-400 font-mono text-[10px]">v4.1.6</span>
            </div>
            <div className="text-[10px] text-zinc-400">
              Isolated Tenant: <span className="font-mono text-zinc-400">{currentTenant.id}</span>
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-zinc-950/40 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
