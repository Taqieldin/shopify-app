import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { authFetch } from '../../utils/api';
import { ShieldCheck, Clock, CheckCircle2, AlertTriangle, User, Search, Tag } from 'lucide-react';

export const WarrantiesView: React.FC = () => {
  const { currentTenant } = useTenant();
  const [warranties, setWarranties] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    authFetch('/api/admin/services')
      .then((res) => res.json())
      .then((data) => setWarranties(data.warranties ?? data ?? []))
      .catch(() => setWarranties([]));
  }, []);

  const filtered = warranties.filter(
    (w) =>
      w.serial.toLowerCase().includes(search.toLowerCase()) ||
      w.customer_email.toLowerCase().includes(search.toLowerCase()) ||
      w.product_title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-100">Warranty & Atelier Guarantees</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Tracking multi-year and lifetime warranty registrations, active coverage periods, and service claims.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by serial or collector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Warranties Table */}
      <div className="glass-panel rounded-xl border border-zinc-800/80 overflow-hidden">
        <div className="p-3.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Active Warranty Registrations</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">Status: Verified Immutable</span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {filtered.map((w) => (
            <div key={w.id} className="p-4 text-xs hover:bg-zinc-900/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-amber-400">{w.serial}</span>
                  <span className="text-zinc-200 font-semibold">{w.product_title}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {w.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-zinc-400">
                  <span>Coverage: <strong className="text-zinc-300">{w.warranty_type}</strong></span>
                  <span>Registered Collector: <strong className="text-zinc-300">{w.customer_email}</strong></span>
                  <span>Validity: {w.start_date} &rarr; {w.end_date}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-zinc-500 text-[10px] block">Service Claims Filed</span>
                <span className="font-mono text-zinc-200 font-semibold">{w.claims_count} Claims</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
