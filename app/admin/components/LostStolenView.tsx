import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { AlertTriangle, ShieldAlert, Lock, CheckCircle, ShieldCheck } from 'lucide-react';

export const LostStolenView: React.FC = () => {
  const { currentTenant, pieces, reportTheft } = useTenant();
  const [selectedSerial, setSelectedSerial] = useState(pieces[0]?.serial || '');
  const [reportType, setReportType] = useState<'LOST' | 'STOLEN'>('STOLEN');
  const [notes, setNotes] = useState('Reported stolen during transit.');
  const [showModal, setShowModal] = useState(false);

  const stolenPieces = pieces.filter((p) => p.status === 'STOLEN' || p.status === 'LOST');

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    reportTheft(selectedSerial, reportType, notes);
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-100">Lost & Stolen Product Blacklist</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Automated transfer lockouts, public scan fraud alerts, and law-enforcement incident tracking.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition shadow-md"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Report Lost or Stolen Piece</span>
        </button>
      </div>

      {/* Flagged Pieces Grid */}
      <div className="space-y-3">
        {stolenPieces.length === 0 ? (
          <div className="glass-panel p-8 rounded-xl border border-zinc-800 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="font-semibold text-sm text-zinc-200">No Active Stolen or Flagged Pieces</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              All physical serial numbers for {currentTenant.settings.brand_name} are verified in good standing.
            </p>
          </div>
        ) : (
          stolenPieces.map((piece) => (
            <div
              key={piece.id}
              className="glass-panel p-5 rounded-xl border border-red-900/40 bg-red-950/10 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-red-400 text-sm">{piece.serial}</span>
                    <span className="text-xs font-medium text-zinc-200">{piece.product_title}</span>
                  </div>
                  <div className="text-[11px] text-red-300/80 mt-0.5">
                    Status: <span className="font-semibold uppercase">{piece.status}</span> • Ownership Transfer:{' '}
                    <span className="font-bold underline">LOCKED</span>
                  </div>
                </div>
              </div>

              <span className="text-xs px-2.5 py-1 rounded bg-red-500/20 text-red-300 font-semibold border border-red-500/30">
                Fraud Alert Active
              </span>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif font-bold text-base text-red-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Report Lost / Stolen
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>

            <form onSubmit={handleReport} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Select Piece</label>
                <select
                  value={selectedSerial}
                  onChange={(e) => setSelectedSerial(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                >
                  {pieces.map((p) => (
                    <option key={p.id} value={p.serial}>
                      {p.serial} — {p.product_title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                >
                  <option value="STOLEN">Stolen (Theft / Burglary)</option>
                  <option value="LOST">Lost (Unaccounted)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Incident Notes / Police Report</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold"
                >
                  Lock Serial & Flag Blacklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
