import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { ArrowRightLeft, ShieldCheck, CheckCircle2, Copy, ExternalLink, Clock, FileCheck } from 'lucide-react';

export const TransfersView: React.FC = () => {
  const { currentTenant, transfers, initiateTransfer, acceptTransfer, pieces } = useTenant();
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [selectedSerial, setSelectedSerial] = useState(pieces[0]?.serial || '');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    initiateTransfer(selectedSerial, recipientEmail, recipientName);
    setShowInitiateModal(false);
    setRecipientEmail('');
    setRecipientName('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-100">Ownership Transfers & Provenance</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Secure single-use token lifecycle with automated Digital Transfer Certificate generation.
          </p>
        </div>

        <button
          onClick={() => setShowInitiateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition shadow-md"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Initiate Assisted Transfer</span>
        </button>
      </div>

      {/* Transfers List */}
      <div className="space-y-4">
        {transfers.map((trf) => (
          <div
            key={trf.id}
            className="glass-panel p-5 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                  {trf.serial}
                </span>
                <span className="font-semibold text-sm text-zinc-200">{trf.product_title}</span>
              </div>

              <span
                className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                  trf.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {trf.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-400 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/60">
              <div>
                <span className="text-zinc-500 text-[11px] block">Current Owner (Sender):</span>
                <span className="text-zinc-200 font-medium">{trf.sender_email}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[11px] block">Designated Recipient:</span>
                <span className="text-zinc-200 font-medium">
                  {trf.recipient_email} {trf.recipient_name && `(${trf.recipient_name})`}
                </span>
              </div>
            </div>

            {trf.status === 'COMPLETED' && trf.certificate_number && (
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold">Ownership Transfer Certificate Issued</span>
                    <div className="font-mono text-[10px] text-emerald-400/80">No: {trf.certificate_number}</div>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-emerald-500/60 hidden md:block">
                  Hash: {trf.verification_hash?.slice(0, 16)}...
                </div>
              </div>
            )}

            {trf.status === 'PENDING' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                  <span>Token: {trf.transfer_token.slice(0, 18)}...</span>
                  <button
                    onClick={() => copyToClipboard(trf.transfer_token)}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedToken === trf.transfer_token ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Simulate Recipient Acceptance Button for Demo */}
                <button
                  onClick={() =>
                    acceptTransfer(trf.transfer_token, trf.recipient_email, trf.recipient_name || 'New Collector')
                  }
                  className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-semibold transition"
                >
                  Simulate Recipient Acceptance
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Initiate Transfer Modal */}
      {showInitiateModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-serif font-bold text-base text-zinc-100">Initiate Ownership Transfer</h3>
              <button onClick={() => setShowInitiateModal(false)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>

            <form onSubmit={handleInitiate} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Select Piece to Transfer</label>
                <select
                  value={selectedSerial}
                  onChange={(e) => setSelectedSerial(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                >
                  {pieces
                    .filter((p) => p.status === 'REGISTERED')
                    .map((p) => (
                      <option key={p.id} value={p.serial}>
                        {p.serial} — {p.product_title} (Owner: {p.active_owner?.name})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Recipient Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="recipient@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Recipient Full Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sophie Laurent"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowInitiateModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                >
                  Generate Invitation Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
