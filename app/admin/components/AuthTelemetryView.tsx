import React from 'react';
import { useTenant } from '../../context/TenantContext';
import {
  ShieldCheck,
  AlertTriangle,
  Radio,
  Smartphone,
  QrCode,
  Globe,
  Lock,
  CheckCircle2,
} from 'lucide-react';

export const AuthTelemetryView: React.FC = () => {
  const { currentTenant, authEvents } = useTenant();

  const normalScansCount = authEvents.filter((e) => e.risk_level === 'NORMAL').length;
  const anomaliesCount = authEvents.filter((e) => e.risk_level !== 'NORMAL').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-100">Layered Authenticity Telemetry & Risk Engine</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time verification telemetry, NFC read counters, impossible travel detection, and cryptographic counter validation.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-zinc-800 space-y-1">
          <span className="text-[11px] text-zinc-400">Total Scans Recorded</span>
          <div className="text-xl font-bold font-mono text-zinc-100">{authEvents.length}</div>
          <span className="text-[10px] text-emerald-400">100% cryptographically logged</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-zinc-800 space-y-1">
          <span className="text-[11px] text-zinc-400">Genuine Authentications</span>
          <div className="text-xl font-bold font-mono text-emerald-400">{normalScansCount}</div>
          <span className="text-[10px] text-zinc-500">Verified master hallmarks</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-zinc-800 space-y-1">
          <span className="text-[11px] text-zinc-400">Risk Anomalies Intercepted</span>
          <div className="text-xl font-bold font-mono text-amber-400">{anomaliesCount}</div>
          <span className="text-[10px] text-amber-400/80">Velocity & blacklist flags</span>
        </div>
      </div>

      {/* Telemetry Log Feed */}
      <div className="glass-panel rounded-xl border border-zinc-800/80 overflow-hidden">
        <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-semibold text-xs text-zinc-200">Live Verification Event Feed</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">Append-Only Immutable Telemetry</span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {authEvents.map((ev) => (
            <div key={ev.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-zinc-900/30 transition">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    ev.risk_level === 'NORMAL'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {ev.method === 'NFC' ? <Smartphone className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-zinc-100">{ev.serial}</span>
                    <span className="text-zinc-500 text-[11px]">via {ev.method}</span>
                    {ev.nfc_counter && (
                      <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">
                        NFC Counter: #{ev.nfc_counter}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Location: <span className="text-zinc-300 font-medium">{ev.city}, {ev.country}</span> • Time:{' '}
                    <span className="text-zinc-500 font-mono">{ev.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    ev.result === 'AUTHENTICATED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : ev.result === 'SUSPICIOUS'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}
                >
                  {ev.result}
                </span>

                <span
                  className={`text-[10px] font-mono ${
                    ev.risk_level === 'NORMAL' ? 'text-zinc-500' : 'text-amber-400 font-bold'
                  }`}
                >
                  Risk: {ev.risk_level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
