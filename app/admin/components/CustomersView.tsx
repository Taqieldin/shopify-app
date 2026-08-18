import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { authFetch } from '../../utils/api';
import { Users, Crown, Coins, Tag, Search, ShieldCheck, Mail, ArrowRight } from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { currentTenant } = useTenant();
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    authFetch('/api/admin/customers')
      .then((res) => res.json())
      .then((data) => setCustomers(data.customers ?? data ?? []))
      .catch(() => setCustomers([]));
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.tier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-100">Collector Directory & VIP Circle</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Verified owners, lifetime client profiles, patron tiers, and active vault piece counts.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email or tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass-panel rounded-xl border border-zinc-800/80 overflow-hidden">
        <div className="p-3.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-300 font-semibold">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Verified Collector Profiles</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">Sync: Shopify Customer Accounts</span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {filtered.map((cust) => (
            <div key={cust.id} className="p-4 text-xs hover:bg-zinc-900/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-100 text-sm">{cust.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    <span>{cust.tier}</span>
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-zinc-500" />
                    <span>{cust.email}</span>
                  </span>
                  <span>Registered: {cust.registered_since}</span>
                  <span className="text-zinc-300">Lifetime Volume: <strong>{cust.total_spend}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-zinc-500 text-[10px] block">Vault Pieces</span>
                  <span className="font-mono text-emerald-400 font-bold">{cust.pieces_count} Pieces</span>
                </div>

                <div className="text-right">
                  <span className="text-zinc-500 text-[10px] block">{currentTenant.settings.credits_term}</span>
                  <span className="font-mono text-amber-400 font-bold">{cust.credits_balance.toLocaleString()} pts</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
