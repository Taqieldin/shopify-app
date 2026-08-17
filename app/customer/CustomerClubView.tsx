import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import {
  Crown,
  Sparkles,
  Tag,
  Coins,
  QrCode,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  ArrowLeft,
  CheckCircle,
  Clock,
  Wrench,
  Flame,
  Check,
} from 'lucide-react';

export const CustomerClubView: React.FC<{ onBackToAdmin?: () => void; onOpenPassport?: (serial: string) => void }> = ({
  onBackToAdmin,
  onOpenPassport,
}) => {
  const { currentTenant, pieces, creditEntries, createServiceCase } = useTenant();

  const [customerEmail, setCustomerEmail] = useState('');
  const customerPieces = pieces.filter((p) => p.active_owner?.email === customerEmail || p.status === 'REGISTERED');
  const customerCredits = creditEntries
    .filter((c) => c.customer_email === customerEmail)
    .reduce((acc, c) => acc + c.amount, 0);

  const [claimedBenefit, setClaimedBenefit] = useState<string | null>(null);
  const [reservedDrop, setReservedDrop] = useState(false);

  // Service Request Modal State
  const [showServiceModal, setShowServiceModal] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState('Annual Leather Spa & Edge Nourishment');
  const [serviceNotes, setServiceNotes] = useState('');
  const [serviceBookedNotice, setServiceBookedNotice] = useState<string | null>(null);

  const handleBookService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showServiceModal) return;

    createServiceCase({
      serial: showServiceModal,
      service_type: serviceType,
      customer_notes: serviceNotes || 'Requested by verified collector via Customer Account Portal.',
      warranty_covered: true,
    });

    setServiceBookedNotice(`Atelier service case booked for serial ${showServiceModal}!`);
    setTimeout(() => {
      setShowServiceModal(null);
      setServiceBookedNotice(null);
      setServiceNotes('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-24 selection:bg-amber-500/20 selection:text-amber-300">
      {/* Customer Account Extension Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-6 py-4 sticky top-0 z-40 flex items-center justify-between">
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
            {currentTenant.settings.club_name}
          </span>
        </div>

        <div className="text-xs text-zinc-400 font-mono">
          <span>Customer Account Extension</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Email Input for Preview */}
        {!customerEmail && (
          <div className="glass-panel p-6 rounded-2xl border border-zinc-700 bg-zinc-900 text-center space-y-3">
            <p className="text-sm text-zinc-400">Enter a customer email to preview their Private Club portal.</p>
            <input
              type="email"
              placeholder="customer@example.com"
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-100 w-full max-w-sm"
              onBlur={(e) => setCustomerEmail(e.target.value)}
            />
          </div>
        )}
        {/* Welcome Member Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Crown className="w-4 h-4" />
                <span>Patron Tier: Atelier Privilège</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-100">
                Welcome, {customerEmail || 'Collector'}
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Your private archive of handcrafted {currentTenant.settings.brand_name} creations.
              </p>
            </div>

            <div className="glass-panel px-5 py-3 rounded-xl border border-zinc-800 text-right">
              <span className="text-[11px] text-zinc-400 block">{currentTenant.settings.credits_term}</span>
              <span className="text-2xl font-bold font-mono text-amber-400">{customerCredits.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Private VIP Early Access Drops */}
        <div className="glass-panel p-6 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                  VIP Early Access Private Drop
                </span>
              </div>
              <h3 className="font-serif font-bold text-base text-zinc-100">
                The Heritage Noir Chronograph (Edition of 25)
              </h3>
              <p className="text-xs text-zinc-400">
                Exclusive pre-launch window open for Atelier Privilège collectors before global release.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-zinc-500 uppercase block font-mono">Private Window</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">Access Unlocked</span>
              </div>
              <button
                onClick={() => setReservedDrop(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                  reservedDrop
                    ? 'bg-emerald-500 text-zinc-950 cursor-default'
                    : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                }`}
              >
                {reservedDrop ? '✓ Pre-Allocation Reserved' : 'Reserve Allocation'}
              </button>
            </div>
          </div>
        </div>

        {/* Collector's Cabinet / Digital Vault */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-400" />
              <span>Collector's Digital Vault</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono">{customerPieces.length} Verified Pieces</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {customerPieces.map((piece) => (
              <div
                key={piece.id}
                className="glass-panel rounded-xl border border-zinc-800 overflow-hidden flex flex-col justify-between hover:border-zinc-700 transition"
              >
                <div className="flex gap-4 p-4">
                  <img
                    src={piece.product_image}
                    alt={piece.product_title}
                    className="w-20 h-20 rounded-lg object-cover bg-zinc-900 border border-zinc-800 shrink-0"
                  />
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] font-bold text-amber-400">{piece.serial}</span>
                    <h3 className="font-semibold text-xs text-zinc-200 line-clamp-1">{piece.product_title}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Authenticated & Registered</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenPassport && onOpenPassport(piece.serial)}
                    className="py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold transition flex items-center justify-center gap-1"
                  >
                    <span>Passport</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>

                  <button
                    onClick={() => setShowServiceModal(piece.serial)}
                    className="py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold transition flex items-center justify-center gap-1"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Book Service</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Member Privileges & Benefits */}
        <div className="space-y-4">
          <h2 className="font-serif text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Exclusive Atelier Privileges</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex items-start justify-between">
                <span className="font-semibold text-xs text-zinc-100">Annual Atelier Leather Spa</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  READY TO CLAIM
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Complimentary master leather nourishment and edge sealant re-application.
              </p>
              <button
                onClick={() => setClaimedBenefit('spa')}
                className="w-full py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition"
              >
                {claimedBenefit === 'spa' ? '✓ Voucher: ATELIER-CARE-2026' : 'Claim Complimentary Care'}
              </button>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex items-start justify-between">
                <span className="font-semibold text-xs text-zinc-100">Private Runway Preview Reservation</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400">
                  ATELIER TIER
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Early access RSVP to upcoming seasonal Haute Maroquinerie drops.
              </p>
              <button
                onClick={() => setClaimedBenefit('runway')}
                className="w-full py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
              >
                {claimedBenefit === 'runway' ? '✓ RSVP Confirmed' : 'Reserve Salon Access'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Book Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif font-bold text-sm text-zinc-100">Request Atelier Service</h3>
              </div>
              <button onClick={() => setShowServiceModal(null)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>

            <form onSubmit={handleBookService} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Target Piece</label>
                <input
                  type="text"
                  disabled
                  value={`Serial No. ${showServiceModal}`}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-amber-400"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Service Type</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Annual Leather Spa & Edge Nourishment">Annual Leather Spa & Edge Nourishment</option>
                  <option value="Hardware Polishing & Re-plating">Hardware Polishing & Re-plating</option>
                  <option value="Complication Diagnostic & Timing Check">Complication Diagnostic & Timing Check</option>
                  <option value="Restoration & Deep Clean">Restoration & Deep Clean</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Specific Care Notes / Requests</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Please nourish corners and inspect handle stitchwork..."
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {serviceBookedNotice && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{serviceBookedNotice}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(null)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
                >
                  Confirm Atelier Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
