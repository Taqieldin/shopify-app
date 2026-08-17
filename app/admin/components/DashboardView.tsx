import React from 'react';
import { useTenant } from '../../context/TenantContext';
import {
  QrCode,
  Tag,
  ShieldCheck,
  Crown,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle,
  Coins,
  Sparkles,
} from 'lucide-react';

export const DashboardView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { currentTenant, pieces, passports, transfers, authEvents, creditEntries, serviceCases } = useTenant();

  const registeredPieces = pieces.filter((p) => p.status === 'REGISTERED').length;
  const totalCirculatingCredits = creditEntries.reduce((acc, c) => acc + c.amount, 0);
  const activeTransfersCount = transfers.filter((t) => t.status === 'PENDING').length;
  const recentAnomalies = authEvents.filter((e) => e.risk_level === 'HIGH_RISK');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-zinc-950 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Tenant SaaS Active Tenant</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-zinc-100">
              {currentTenant.settings.brand_name} Dashboard
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-xl">
              Real-time digital product passports, physical piece authentication, immutable provenance ledger, and {currentTenant.settings.club_name} collector engagement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('passports')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition shadow-md hover:shadow-amber-500/20"
            >
              <QrCode className="w-4 h-4" />
              <span>Issue New Passport</span>
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
            >
              <span>Customize Branding</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Active Passports</span>
            <QrCode className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{passports.length}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-2">
            <TrendingUp className="w-3 h-3" />
            <span>100% cloud-synced</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Registered Pieces</span>
            <Tag className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">
            {registeredPieces} <span className="text-sm font-normal text-zinc-500">/ {pieces.length}</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-2">
            {pieces.length > 0 ? Math.round((registeredPieces / pieces.length) * 100) : 0}% collector claim rate
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Circulating {currentTenant.settings.credits_term}</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{totalCirculatingCredits.toLocaleString()}</div>
          <div className="text-[11px] text-zinc-400 mt-2">Immutable append-only ledger</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Pending Transfers</span>
            <ArrowRightLeft className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{activeTransfersCount}</div>
          <div className="text-[11px] text-zinc-400 mt-2">Secure cryptographic tokens</div>
        </div>
      </div>

      {/* Two Column Layout: Real-Time Telemetry & Active Provenance Transfers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Authentication Telemetry */}
        <div className="glass-panel rounded-xl border border-zinc-800/80 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-sm text-zinc-100">Live Authenticity Telemetry</h3>
              </div>
              <button
                onClick={() => onNavigate('authentication')}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {authEvents.slice(0, 4).map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        ev.risk_level === 'NORMAL' ? 'bg-emerald-400' : 'bg-red-400 animate-ping'
                      }`}
                    />
                    <div>
                      <div className="font-medium text-zinc-200">{ev.serial}</div>
                      <div className="text-[11px] text-zinc-500">
                        {ev.method} Tap • {ev.city}, {ev.country}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        ev.result === 'AUTHENTICATED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {ev.result}
                    </span>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{ev.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ownership Transfers & Service History */}
        <div className="glass-panel rounded-xl border border-zinc-800/80 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-sky-400" />
                <h3 className="font-semibold text-sm text-zinc-100">Ownership & Provenance Activity</h3>
              </div>
              <button
                onClick={() => onNavigate('transfers')}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {transfers.slice(0, 3).map((trf) => (
                <div
                  key={trf.id}
                  className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">{trf.product_title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        trf.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {trf.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                    <span>
                      From: <span className="text-zinc-300">{trf.sender_email}</span> → To:{' '}
                      <span className="text-zinc-300">{trf.recipient_email}</span>
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-zinc-500 truncate">
                    Token: {trf.transfer_token}
                  </div>
                </div>
              ))}

              {serviceCases.slice(0, 1).map((srv) => (
                <div
                  key={srv.id}
                  className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-zinc-200">
                      {srv.case_number} • {srv.service_type}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Serial: {srv.serial} • Tech: {srv.technician_name}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {srv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
