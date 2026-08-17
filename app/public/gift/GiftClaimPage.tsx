import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { Gift, Sparkles, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft, Heart, Lock } from 'lucide-react';

export const GiftClaimPage: React.FC<{ claimCode?: string; onBackToAdmin?: () => void }> = ({
  claimCode = '',
  onBackToAdmin,
}) => {
  const { currentTenant, pieces } = useTenant();
  const piece = pieces[0];

  const [step, setStep] = useState<'sealed' | 'unboxing' | 'claimed'>('sealed');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');

  const handleOpenGift = () => {
    setStep('unboxing');
  };

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('claimed');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-24 selection:bg-amber-500/20 selection:text-amber-300">
      {/* Editorial Topbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-6 py-4 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          )}
        </div>

        <div className="text-center">
          <span className="font-serif tracking-widest uppercase font-bold text-xs text-zinc-200">
            {currentTenant.settings.brand_name}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bespoke Gift Experience</span>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-12">
        {step === 'sealed' && (
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-amber-500/40 text-center space-y-6 shadow-2xl relative overflow-hidden animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20 animate-pulse">
              <Gift className="w-10 h-10 text-zinc-950" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono tracking-widest uppercase text-amber-400 font-bold">
                Private Gift Presentation
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-100">
                A Bespoke Gift Awaits You
              </h1>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                You have been presented with a serialized masterpiece from {currentTenant.settings.brand_name}.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs italic text-zinc-300">
              "For someone truly extraordinary. May this creation accompany your most memorable journeys."
              <span className="block mt-2 font-mono text-[10px] text-amber-400 font-semibold not-italic">
                — With admiration
              </span>
            </div>

            <button
              onClick={handleOpenGift}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm transition shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <span>Unbox Digital Presentation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'unboxing' && (
          <div className="glass-panel p-8 rounded-3xl border border-zinc-800 space-y-6 shadow-2xl animate-fade-in">
            <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 relative group">
              <img
                src={piece.product_image}
                alt={piece.product_title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
              />
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md border border-amber-500/40 text-amber-400 font-mono text-[10px] font-bold">
                {piece.serial}
              </div>
            </div>

            <div className="space-y-1 text-center">
              <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Verified Authentic Masterpiece
              </span>
              <h2 className="text-xl font-serif font-bold text-zinc-100">{piece.product_title}</h2>
              <p className="text-xs text-zinc-400">
                {piece.manufacturing_location} • Handcrafted {piece.materials[0]?.name}
              </p>
            </div>

            <form onSubmit={handleClaim} className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Claire Delacroix"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Your Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. claire@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-lg mt-2"
              >
                Claim Ownership & Enter {currentTenant.settings.club_name}
              </button>
            </form>
          </div>
        )}

        {step === 'claimed' && (
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-emerald-500/40 text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 font-bold">
                Ownership Verified & Active
              </span>
              <h1 className="text-2xl font-serif font-bold text-zinc-100">
                Welcome to the Collector Circle
              </h1>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                <span className="font-mono text-amber-400 font-bold">{piece.serial}</span> has been securely bound to{' '}
                <span className="text-zinc-200">{recipientEmail || 'your email'}</span>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-1">
              <div className="text-amber-400 font-bold flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4" /> +250 Welcome {currentTenant.settings.credits_term} Credited
              </div>
              <p className="text-[11px] text-zinc-400">
                Your private digital vault is ready with lifetime atelier care and warranty coverage.
              </p>
            </div>

            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="px-6 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
              >
                Return to Admin Console
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
