import React from 'react';
import { useTenant } from '../../context/TenantContext';
import { BarChart3, TrendingUp, Users, QrCode, Globe, ShieldCheck } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { currentTenant, pieces, passports, authEvents, creditEntries } = useTenant();

  const registeredCount = pieces.filter((p) => p.status === 'REGISTERED').length;
  const registrationRate = pieces.length > 0 ? Math.round((registeredCount / pieces.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-serif font-bold text-zinc-100">Analytics & Insights</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Collector engagement funnel, physical NFC scan geolocation, and passport interaction metrics.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-xl border border-zinc-800">
          <span className="text-xs text-zinc-400">Total Scans & Interactions</span>
          <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">{authEvents.length || '—'}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +24% this month
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-zinc-800">
          <span className="text-xs text-zinc-400">Collector Onboarding Rate</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{registrationRate}%</div>
          <div className="text-[11px] text-zinc-400 mt-1">Physical-to-digital claim efficiency</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-zinc-800">
          <span className="text-xs text-zinc-400">Avg. Scans per Piece</span>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-1">—</div>
          <div className="text-[11px] text-zinc-400 mt-1">NFC taps & QR provenance checks</div>
        </div>
      </div>

      {/* Funnel & Geolocation breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Registration Funnel */}
        <div className="glass-panel p-6 rounded-xl border border-zinc-800 space-y-4">
          <h3 className="font-semibold text-xs text-zinc-200 uppercase tracking-wider">
            Product Passport Lifecycle Funnel
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>1. Manufactured & Serialized</span>
                <span className="font-mono text-zinc-400">{pieces.length} (100%)</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full w-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>2. Active Digital Passports Published</span>
                <span className="font-mono text-zinc-400">{passports.length} (100%)</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div className="bg-amber-400 h-2 rounded-full w-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>3. Customer Claim & Ownership Registered</span>
                <span className="font-mono text-zinc-400">{registeredCount} ({registrationRate}%)</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-emerald-400 h-2 rounded-full"
                  style={{ width: `${Math.max(registrationRate, 10)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>4. Atelier Care & Verified Service</span>
                <span className="font-mono text-zinc-400">—</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div className="bg-sky-400 h-2 rounded-full w-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Global Scan Telemetry Distribution */}
        <div className="glass-panel p-6 rounded-xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-sky-400" /> Geographic Scan Telemetry
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
              <div className="flex items-center gap-2">
                <span className="text-base">🇫🇷</span>
                <span className="text-zinc-200 font-medium">France (Paris, Lyon)</span>
              </div>
              <span className="font-mono text-amber-400 font-bold">58%</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
              <div className="flex items-center gap-2">
                <span className="text-base">🇨🇭</span>
                <span className="text-zinc-200 font-medium">Switzerland (Geneva, Zurich)</span>
              </div>
              <span className="font-mono text-amber-400 font-bold">24%</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
              <div className="flex items-center gap-2">
                <span className="text-base">🇬🇧</span>
                <span className="text-zinc-200 font-medium">United Kingdom (London)</span>
              </div>
              <span className="font-mono text-amber-400 font-bold">12%</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
              <div className="flex items-center gap-2">
                <span className="text-base">🇯🇵</span>
                <span className="text-zinc-200 font-medium">Japan (Tokyo)</span>
              </div>
              <span className="font-mono text-amber-400 font-bold">6%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
