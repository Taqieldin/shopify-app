import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { Flame, Plus, Clock, Crown, Sparkles, CheckCircle2, Lock, Tag } from 'lucide-react';

export const EarlyAccessView: React.FC = () => {
  const { currentTenant } = useTenant();
  const [rules, setRules] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTier, setNewTier] = useState('Atelier Privilège');
  const [newStartDate, setNewStartDate] = useState('');

  useEffect(() => {
    fetch('/api/admin/early-access')
      .then((res) => res.json())
      .then((data) => setRules(data.rules ?? data ?? []))
      .catch(() => setRules([]));
  }, []);

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule = {
      id: `ea-${Date.now()}`,
      product_title: newTitle,
      shopify_product_id: `gid://shopify/Product/${Date.now()}`,
      tier_required: newTier,
      starts_at: `${newStartDate} 09:00`,
      ends_at: `${newStartDate} 23:59`,
      status: 'SCHEDULED',
      reservations_count: 0,
    };

    setRules([newRule, ...rules]);
    setShowCreateModal(false);
    setNewTitle('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-100">VIP Early Access Private Drops</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Gate upcoming limited editions and seasonal product launches by patron membership tier.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>New Private Drop Rule</span>
        </button>
      </div>

      {/* Rules Table */}
      <div className="glass-panel rounded-xl border border-zinc-800/80 overflow-hidden">
        <div className="p-3.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-300 font-semibold">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Active & Scheduled Drop Windows</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">Real-Time Tier Gating</span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {rules.map((r) => (
            <div key={r.id} className="p-4 text-xs hover:bg-zinc-900/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-200 text-sm">{r.product_title}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      r.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1 text-amber-300">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Required: {r.tier_required}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Window: {r.starts_at} &rarr; {r.ends_at}</span>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-zinc-500 text-[10px] block">Collector Pre-Allocations</span>
                <span className="font-mono text-amber-400 font-bold text-sm">
                  {r.reservations_count} Reserved
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif font-bold text-base text-zinc-100">Create Early Access Drop</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Complication Tourbillon"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Required Membership Tier</label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="All Members">All Registered Members</option>
                  <option value="Atelier Privilège">Atelier Privilège</option>
                  <option value="Privé Patron">Privé Patron (Top Tier Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Launch Date</label>
                <input
                  type="date"
                  required
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
                >
                  Schedule Drop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
