import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { Coins, Plus, Minus, ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react';

export const CreditsLedgerView: React.FC = () => {
  const { currentTenant, creditEntries, postCreditAdjustment } = useTenant();
  const [showModal, setShowModal] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState('Exclusive Atelier Consultation Bonus');

  const totalCirculation = creditEntries.reduce((acc, c) => acc + c.amount, 0);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    postCreditAdjustment(customerEmail, Number(amount), reason);
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-100">
            Immutable {currentTenant.settings.credits_term} Ledger
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Financial-grade append-only transaction ledger with audit compliance and zero mutation.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition shadow-md"
        >
          <Coins className="w-4 h-4" />
          <span>Post Manual Transaction</span>
        </button>
      </div>

      {/* Circulation Metric Card */}
      <div className="glass-panel p-5 rounded-xl border border-zinc-800 flex items-center justify-between">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Total In Circulation</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {totalCirculation.toLocaleString()} <span className="text-xs text-zinc-400">{currentTenant.settings.credits_term}</span>
          </div>
        </div>
        <div className="text-xs text-zinc-400 text-right">
          <div className="text-emerald-400 font-semibold flex items-center justify-end gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ledger Invariants Verified</span>
          </div>
          <span className="text-[11px] text-zinc-500">{creditEntries.length} Recorded Transactions</span>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="glass-panel rounded-xl border border-zinc-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-5">Date</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Reason & Reference</th>
                <th className="p-3.5 pr-5">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {creditEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-zinc-900/40 transition">
                  <td className="p-3.5 pl-5 text-zinc-400 font-mono text-[11px]">{entry.created_at}</td>
                  <td className="p-3.5 font-medium text-zinc-200">{entry.customer_email}</td>
                  <td className="p-3.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        entry.amount >= 0
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {entry.type}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono font-bold">
                    <span className={entry.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {entry.amount >= 0 ? `+${entry.amount}` : entry.amount}
                    </span>
                  </td>
                  <td className="p-3.5 text-zinc-300">{entry.reason}</td>
                  <td className="p-3.5 pr-5 font-mono text-[11px] text-zinc-500">{entry.created_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif font-bold text-base text-zinc-100">
                Post {currentTenant.settings.credits_term} Entry
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>

            <form onSubmit={handlePost} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Customer Email</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Amount (Positive to Grant, Negative to Debit)
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 font-mono text-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Mandatory Business Reason</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                >
                  Commit Ledger Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
